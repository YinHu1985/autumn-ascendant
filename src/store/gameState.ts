import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Settlement } from '../types/Settlement'
import type { Country, ResourceId } from '../types/Country'
import { RESOURCE_BASE_PRICE } from '../types/Country'
import type { Army } from '../types/Army'
import { processEconomy } from '../systems/EconomySystem'
import { processArmyMovement, processArmyRecovery, moveArmyCommand } from '../systems/ArmySystem'
import { TechRegistry } from '../systems/TechRegistry'
import { IdeaRegistry } from '../systems/IdeaRegistry'
import { BuildingRegistry } from '../systems/BuildingRegistry'
import { ModifierRegistry } from '../systems/ModifierRegistry'
import { EventManager } from '../systems/EventManager'
import { ConditionSystem } from '../systems/ConditionSystem'
import type { BattleState } from '../types/Battle'
import { Advisor } from '../types/Advisor'
import { calculateDistance } from '../utils/MapGenerator'

export type TickType = 'daily' | 'monthly'

export interface DateState {
  year: number
  month: number
  day: number
}

export interface GameState {
  date: DateState
  lastTickType: TickType
  settlements: Settlement[]
  countries: Record<string, Country>
  armies: Record<string, Army>
  advisors: Advisor[]
  activeEventId: string | null
  activeBattle: BattleState | null
  paused: boolean
  playerCountryId: string
  firedEvents: Record<string, number>
  activeEventContext: any
  randomSeed: number
}

const DAYS_PER_MONTH = 30
const MONTHS_PER_YEAR = 12

const initialState: GameState = {
  date: { year: 1000, month: 1, day: 1 },
  lastTickType: 'daily',
  settlements: [],
  countries: {},
  armies: {},
  advisors: [],
  activeEventId: null,
  activeBattle: null,
  paused: true, // Start paused
  playerCountryId: 'QII', // Default player
  firedEvents: {},
  activeEventContext: null,
  randomSeed: 12345
}

const gameStateSlice = createSlice({
  name: 'gameState',
  initialState,
  reducers: {
    setPaused(state: GameState, action: PayloadAction<boolean>) {
      state.paused = action.payload
    },
    setActiveEvent(state: GameState, action: PayloadAction<{ id: string | null, context?: any }>) {
      const { id, context } = action.payload
      state.activeEventId = id
      state.activeEventContext = context || null
      if (id) {
        state.paused = true // Auto-pause on event
        // Increment fire count
        state.firedEvents[id] = (state.firedEvents[id] || 0) + 1
      }
    },
    setBattle(state: GameState, action: PayloadAction<BattleState | null>) {
      state.activeBattle = action.payload
      if (action.payload) {
        state.paused = true // Auto-pause on battle
      }
    },
    updateBattle(state: GameState, action: PayloadAction<BattleState>) {
      state.activeBattle = action.payload
      
      // Check for winner and handle retreat
      if (state.activeBattle.winner) {
         const winner = state.activeBattle.winner
         const loserId = winner === 'ATTACKER' ? state.activeBattle.defenderId : state.activeBattle.attackerId
         const army = state.armies[loserId]
         
         if (army) {
           // RETREAT LOGIC
           // Find nearest friendly settlement
           let nearestSettlementId: string | null = null
           let minDistance = Infinity
           
           state.settlements.forEach(s => {
             if (s.ownerId === army.ownerId && s.id !== army.location) {
               const dist = calculateDistance(
                 s.position, 
                 state.settlements.find(loc => loc.id === army.location)?.position || {x:0, y:0}
               )
               if (dist < minDistance) {
                 minDistance = dist
                 nearestSettlementId = s.id
               }
             }
           })
           
           if (nearestSettlementId) {
             army.state = 'MOVING'
             army.destination = nearestSettlementId
             // Calculate arrival time (e.g., 50km/day speed)
             // Reuse CmdMoveArmy logic or similar
             const travelDays = Math.ceil(minDistance / 50)
             const arrivalDate = { ...state.date }
             // Simple date addition
             let totalDays = arrivalDate.day + travelDays
             while (totalDays > 30) {
               totalDays -= 30
               arrivalDate.month += 1
               if (arrivalDate.month > 12) {
                 arrivalDate.month = 1
                 arrivalDate.year += 1
               }
             }
             arrivalDate.day = totalDays
             
             army.arrivalDate = arrivalDate
             console.log(`Army ${loserId} retreating to ${nearestSettlementId}`)
           } else {
             // No friendly settlement? Disband or die?
             // For now, let's just leave them there as "Defeated"
             army.state = 'IDLE' 
             console.log(`Army ${loserId} defeated but has nowhere to retreat!`)
           }
         }
      }
    },
    tick(state: GameState) {
      if (state.paused) return // Don't tick if paused

      const { day, month, year } = state.date
      let newTickType: TickType = 'daily'
      
      if (day < DAYS_PER_MONTH) {
        state.date.day = day + 1
        newTickType = 'daily'
      } else {
        state.date.day = 1
        if (month < MONTHS_PER_YEAR) {
          state.date.month = month + 1
        } else {
          state.date.month = 1
          state.date.year = year + 1
        }
        newTickType = 'monthly'
      }
      state.lastTickType = newTickType

      // Process Daily Logic
      processArmyMovement(state)

      if (newTickType === 'monthly') {
        processEconomy(state)
        processArmyRecovery(state)
      }

      // Check for Events
      const eventManager = EventManager.getInstance()
      const triggerResult = eventManager.checkTriggers(state)
      if (triggerResult) {
        state.activeEventId = triggerResult.event.id
        state.activeEventContext = triggerResult.context
        state.paused = true
        // Increment fire count
        state.firedEvents[triggerResult.event.id] = (state.firedEvents[triggerResult.event.id] || 0) + 1
      }
    },
    setSettlements(state: GameState, action: PayloadAction<Settlement[]>) {
      state.settlements = action.payload
    },
    setCountries(state: GameState, action: PayloadAction<Country[]>) {
      action.payload.forEach(country => {
        state.countries[country.id] = country
      })
    },
    addCountry(state: GameState, action: PayloadAction<Country>) {
      state.countries[action.payload.id] = action.payload
    },
    setArmies(state: GameState, action: PayloadAction<Record<string, Army> | Army[]>) {
      if (Array.isArray(action.payload)) {
        action.payload.forEach(army => {
          state.armies[army.id] = army
        })
      } else {
        state.armies = action.payload
      }
    },
    setAdvisors(state: GameState, action: PayloadAction<Advisor[]>) {
      state.advisors = action.payload
    },
    updateAdvisor(state: GameState, action: PayloadAction<Advisor>) {
      const index = state.advisors.findIndex(a => a.id === action.payload.id)
      if (index !== -1) {
        state.advisors[index] = action.payload
      } else {
        state.advisors.push(action.payload)
      }
    },
    moveArmy(state: GameState, action: PayloadAction<{ armyId: string, targetSettlementId: string }>) {
      moveArmyCommand(state, action.payload.armyId, action.payload.targetSettlementId)
    },
    researchTech(state: GameState, action: PayloadAction<{ countryId: string, techId: string }>) {
      const { countryId, techId } = action.payload
      const country = state.countries[countryId]
      const registry = TechRegistry.getInstance()
      const tech = registry.getTech(techId)
      
      if (!country || !tech) {
        console.warn('Invalid research request')
        return
      }

      // Check if already researched
      if (country.researchedTechs.includes(techId)) {
        console.warn('Tech already researched')
        return
      }

      // Check prerequisites
      const hasPrereqs = !tech.condition || ConditionSystem.checkCondition(tech.condition, { ACTOR: country, ROOT: state })
      if (!hasPrereqs) {
        console.warn('Prerequisites not met')
        return
      }

      // Check cost
      const cost = tech.cost
      if (
        (cost.gold && country.resources.cash < cost.gold) ||
        (cost.engineering_practice && (country.resources.engineering_practice || 0) < cost.engineering_practice) ||
        (cost.military_practice && (country.resources.military_practice || 0) < cost.military_practice)
      ) {
        console.warn('Insufficient resources')
        return
      }

      // Deduct resources
      if (cost.gold) country.resources.cash -= cost.gold
      if (cost.engineering_practice) country.resources.engineering_practice = (country.resources.engineering_practice || 0) - cost.engineering_practice
      if (cost.military_practice) country.resources.military_practice = (country.resources.military_practice || 0) - cost.military_practice

      // Add tech
      country.researchedTechs.push(techId)

      // Register modifiers
      const modifierRegistry = ModifierRegistry.getInstance()
      tech.rewardModifiers.forEach(mod => {
        // First ensure definition is registered (idempotent usually, but good practice)
        modifierRegistry.registerModifier(mod)
        // Then apply to scope
        modifierRegistry.addModifierToScope(countryId, mod.id)
      })
      
      console.log(`Research complete: ${tech.name} for ${country.name}`)
    },
    adoptIdea(state: GameState, action: PayloadAction<{ countryId: string, ideaId: string }>) {
      const { countryId, ideaId } = action.payload
      const country = state.countries[countryId]
      const registry = IdeaRegistry.getInstance()
      const idea = registry.getIdea(ideaId)

      if (!country || !idea) return
      if (country.adoptedIdeas?.includes(ideaId)) return

      // Check prerequisites
      const prereqsMet = !idea.condition || ConditionSystem.checkCondition(idea.condition, { ACTOR: country, ROOT: state })
      if (!prereqsMet) return

      // Check cost (tradition)
      const school = idea.school
      const currentTradition = country.resources.tradition?.[school] || 0
      if (currentTradition < idea.cost) return

      // Deduct
      if (!country.resources.tradition) country.resources.tradition = {} as any
      country.resources.tradition[school] -= idea.cost

      // Add idea
      if (!country.adoptedIdeas) country.adoptedIdeas = []
      country.adoptedIdeas.push(ideaId)

      // Register modifiers
      const modifierRegistry = ModifierRegistry.getInstance()
      idea.rewardModifiers.forEach(mod => {
        modifierRegistry.registerModifier(mod)
        modifierRegistry.addModifierToScope(countryId, mod.id)
      })
    },
    constructBuilding(state: GameState, action: PayloadAction<{ settlementId: string, buildingId: string }>) {
      const { settlementId, buildingId } = action.payload
      const settlement = state.settlements.find(s => s.id === settlementId)
      if (!settlement) return

      const country = state.countries[settlement.ownerId]
      const registry = BuildingRegistry.getInstance()
      const building = registry.getBuilding(buildingId)

      if (!country || !building) return

      if (building.requiredProduct && settlement.localProduct !== building.requiredProduct) return

      // Check cost
      const cost = building.cost
      if (
        (cost.gold && country.resources.cash < cost.gold)
      ) return

      // Deduct
      if (cost.gold) country.resources.cash -= cost.gold

      // Add building
      if (!settlement.buildings) settlement.buildings = []
      settlement.buildings.push(buildingId)
      
      const modifierRegistry = ModifierRegistry.getInstance()
      building.modifiers.forEach(mod => {
          modifierRegistry.registerModifier(mod)
          modifierRegistry.addModifierToScope(settlementId, mod.id)
      })
    },
    resolveEvent(state: GameState) {
      state.activeEventId = null
      state.paused = false
    },
    tradeResource(state: GameState, action: PayloadAction<{ countryId: string, resourceId: ResourceId, quantity: number }>) {
      const { countryId, resourceId, quantity } = action.payload
      const country = state.countries[countryId]
      if (!country) return

      const basePrice = RESOURCE_BASE_PRICE[resourceId]
      if (!basePrice) return

      const currentStock = country.resources.stockpile[resourceId]

      if (quantity > 0) {
        const cost = basePrice * quantity
        if (country.resources.cash < cost) return
        country.resources.cash -= cost
        country.resources.stockpile[resourceId] = currentStock + quantity
      } else if (quantity < 0) {
        const sellQty = Math.min(currentStock, -quantity)
        if (sellQty <= 0) return
        country.resources.stockpile[resourceId] = currentStock - sellQty
        const revenue = (basePrice * sellQty) / 2
        country.resources.cash += revenue
      }
    },
    updateSettlement(state: GameState, action: PayloadAction<Settlement>) {
      const index = state.settlements.findIndex(s => s.id === action.payload.id)
      if (index !== -1) {
        state.settlements[index] = action.payload
      }
    },
    syncState(state: GameState, action: PayloadAction<GameState>) {
      return action.payload
    }
  },
})

export const { tick, setSettlements, setCountries, addCountry, setArmies, setAdvisors, updateAdvisor, moveArmy, setPaused, setActiveEvent, researchTech, adoptIdea, constructBuilding, setBattle, updateBattle, resolveEvent, tradeResource, updateSettlement, syncState } = gameStateSlice.actions
export const gameStateReducer = gameStateSlice.reducer

export const selectDate = (state: { gameState: GameState }) => state.gameState.date
export const selectLastTickType = (state: { gameState: GameState }) => state.gameState.lastTickType
export const selectSettlements = (state: { gameState: GameState }) => state.gameState.settlements
export const selectCountries = (state: { gameState: GameState }) => state.gameState.countries
export const selectArmies = (state: { gameState: GameState }) => state.gameState.armies
export const selectAdvisors = (state: { gameState: GameState }) => state.gameState.advisors
export const selectPaused = (state: { gameState: GameState }) => state.gameState.paused
export const selectActiveEventId = (state: { gameState: GameState }) => state.gameState.activeEventId
export const selectActiveBattle = (state: { gameState: GameState }) => state.gameState.activeBattle
export const selectPlayerCountryId = (state: { gameState: GameState }) => state.gameState.playerCountryId
export const selectActiveEventContext = (state: { gameState: GameState }) => state.gameState.activeEventContext
