import { configureStore } from '@reduxjs/toolkit'
import { gameStateReducer, tick, moveArmy, researchTech, adoptIdea, constructBuilding, setPaused, setSettlements, setCountries, addCountry, setArmies, setAdvisors, updateAdvisor, setActiveEvent, setBattle, updateBattle, resolveEvent, tradeResource, updateSettlement } from '../store/gameState'
import type { GameState } from '../store/gameState'
import type { Command } from '../types/Command'
import { EventManager, registerCoreEvents } from '../systems/EventManager'
import { ConditionSystem } from '../systems/ConditionSystem'
import { resolveTurn, initializeBattle, getBestTarget, generateTroopsForArmy, getDefaultTroopStatsForType } from '../systems/BattleSystem'
import { Army } from '../types/Army'
import { TAGS, COUNTRY_NAMES, COUNTRY_COLORS, CountryTag } from '../content/CountryTags'
import { SCHOOLS, School, createEmptyStockpile, ResourceId } from '../types/Country'
import { IdeaRegistry } from '../systems/IdeaRegistry'
import { ModifierRegistry } from '../systems/ModifierRegistry'
import type { Settlement, TerrainType } from '../types/Settlement'

const inferLocalProduct = (terrain: TerrainType): ResourceId | null => {
  switch (terrain) {
    case 'forest':
      return 'logs'
    case 'plain':
      return 'grain'
    case 'hills':
      return 'wool'
    case 'mountains':
      return 'iron'
    case 'water':
    case 'marsh':
      return 'fish'
    default:
      return null
  }
}

type CommandExecutionContext = {
  dispatch: (action: any) => void
  getState: () => GameState
  handleCommand: (command: Command) => void
}

type CommandHandler<P = any> = {
  execute: (ctx: CommandExecutionContext, payload: P) => void
}

// 1. Setup Store
export const store = configureStore({
  reducer: {
    gameState: gameStateReducer,
  },
})

// Subscribe to store updates and post to main thread
store.subscribe(() => {
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: store.getState().gameState,
  })
})

// Initialize Systems
registerCoreEvents()

const commandHandlers: { [K in Command['type']]?: CommandHandler<any> } = {
  TICK: {
    execute: ({ dispatch }) => {
      dispatch(tick())
    },
  },

  LOAD_MAP: {
    execute: ({ dispatch }, { settlements, countries, armies, advisors }) => {
      const enriched: Settlement[] = (settlements || []).map((s: Settlement) => {
        const lp = typeof s.localProduct === 'undefined' ? inferLocalProduct(s.terrain) : s.localProduct
        return { ...s, localProduct: lp ?? null }
      })
      dispatch(setSettlements(enriched))
      if (countries?.length) dispatch(setCountries(countries))
      if (armies?.length) dispatch(setArmies(armies))
      if (advisors?.length) dispatch(setAdvisors(advisors))
    },
  },

  SET_PAUSED: {
    execute: ({ dispatch }, paused: boolean) => {
      dispatch(setPaused(paused))
    },
  },

  MOVE_ARMY: {
    execute: ({ dispatch }, { armyId, targetSettlementId }) => {
      dispatch(moveArmy({ armyId, targetSettlementId }))
    },
  },

  RESEARCH_TECH: {
    execute: ({ dispatch }, { countryId, techId }) => {
      dispatch(researchTech({ countryId, techId }))
    },
  },

  ADOPT_IDEA: {
    execute: ({ dispatch }, { countryId, ideaId }) => {
      dispatch(adoptIdea({ countryId, ideaId }))
    },
  },

  CONSTRUCT_BUILDING: {
    execute: ({ dispatch }, { settlementId, buildingId }) => {
      dispatch(constructBuilding({ settlementId, buildingId }))
    },
  },

  TRADE_RESOURCE: {
    execute: ({ dispatch }, { countryId, resourceId, quantity }) => {
      dispatch(tradeResource({ countryId, resourceId, quantity }))
    },
  },

  RESOLVE_EVENT: {
    execute: ({ getState, handleCommand }, { eventId, optionIndex }) => {
      const event = EventManager.getInstance().getEventById(eventId)
      if (!event) return
      const option = event.options[optionIndex]
      if (!option) return
      const state = getState()
      const context = (state as any).activeEventContext
      const dispatchCommand = (cmd: any) => {
        if (cmd && typeof cmd.type === 'string') {
          handleCommand(cmd as Command)
        }
      }
      option.effect(dispatchCommand, state, context)
      store.dispatch(resolveEvent())
    },
  },

  FAST_RECOVER_ARMY: {
    execute: ({ dispatch, getState }, { armyId }) => {
      const state = getState()
      const army = state.armies[armyId]
      if (!army) return
      const country = state.countries[army.ownerId]
      if (!country) return
      let totalMissingHp = 0
      for (const troop of army.troops || []) {
        totalMissingHp += Math.max(0, (troop.stats.maxHp || 0) - (troop.stats.hp || 0))
      }
      if (totalMissingHp <= 0) return
      const costPerHp = 0.5
      const cost = Math.ceil(totalMissingHp * costPerHp)
      if (country.resources.cash < cost) return
      const updatedArmy = {
        ...army,
        troops: (army.troops || []).map(t => ({
          ...t,
          stats: {
            ...t.stats,
            hp: t.stats.maxHp,
          },
        })),
      }
      const updatedCountry = {
        ...country,
        resources: {
          ...country.resources,
          cash: country.resources.cash - cost,
        },
      }
      dispatch(setArmies([updatedArmy]))
      dispatch(setCountries([updatedCountry]))
    },
  },

  SET_TROOP_POSITION: {
    execute: ({ dispatch, getState }, { armyId, troopId, position }) => {
      const state = getState()
      const army = state.armies[armyId]
      if (!army) return
      const updatedArmy = {
        ...army,
        troops: (army.troops || []).map(t =>
          t.id === troopId ? { ...t, position: { row: position.row, col: position.col } } : t
        ),
      }
      dispatch(setArmies([updatedArmy]))
    },
  },

  SWAP_TROOP_POSITION: {
    execute: ({ dispatch, getState }, { armyId, sourceTroopId, target }) => {
      const state = getState()
      const army = state.armies[armyId]
      if (!army) return
      const troops = army.troops || []
      const sourceTroop = troops.find(t => t.id === sourceTroopId)
      if (!sourceTroop) return
      const oldPos = { ...sourceTroop.position }
      const targetTroop = troops.find(t => t.position.row === target.row && t.position.col === target.col)
      const updatedArmy: Army = {
        ...army,
        troops: troops.map(t => {
          if (t.id === sourceTroopId) {
            return { ...t, position: { row: target.row, col: target.col } }
          }
          if (targetTroop && t.id === targetTroop.id) {
            return { ...t, position: { row: oldPos.row, col: oldPos.col } }
          }
          return t
        }),
      }
      dispatch(setArmies([updatedArmy]))
    },
  },

  CHANGE_TROOP_TYPE: {
    execute: ({ dispatch, getState }, { armyId, troopId, newType }) => {
      const state = getState()
      const army = state.armies[armyId]
      if (!army) return
      const country = state.countries[army.ownerId]
      if (!country) return
      const typeChangeCost = 10
      if (country.resources.cash < typeChangeCost) return
      const updatedArmy = {
        ...army,
        troops: (army.troops || []).map(t =>
          t.id === troopId
            ? {
                ...t,
                type: newType,
                stats: getDefaultTroopStatsForType(newType, false),
              }
            : t
        ),
      }
      const updatedCountry = {
        ...country,
        resources: {
          ...country.resources,
          cash: country.resources.cash - typeChangeCost,
        },
      }
      dispatch(setArmies([updatedArmy]))
      dispatch(setCountries([updatedCountry]))
    },
  },

  INITIATE_ATTACK: {
    execute: ({ dispatch, getState }, targetSettlementId: string) => {
      const state = getState()
      const playerCountryId = state.playerCountryId
      const targetSettlementForAttack = state.settlements.find(s => s.id === targetSettlementId)
      if (!targetSettlementForAttack) return
      const isConnected = state.settlements.some(
        s =>
          s.ownerId === playerCountryId &&
          (targetSettlementForAttack.connections.some(c => c.targetId === s.id) ||
            s.connections.some(c => c.targetId === targetSettlementForAttack.id))
      )
      if (!isConnected) return
      const playerSettlements = state.settlements.filter(s => s.ownerId === playerCountryId)
      if (playerSettlements.length === 0) return
      const playerCountry = state.countries[playerCountryId]
      let capitalId = playerCountry?.capitalId
      if (!capitalId || !playerSettlements.some(s => s.id === capitalId)) {
        capitalId = playerSettlements[0].id
      }
      let attackerArmy = Object.values(state.armies).find(
        a => a.ownerId === playerCountryId && a.location === capitalId
      )
      if (!attackerArmy) {
        attackerArmy = Object.values(state.armies).find(a => a.ownerId === playerCountryId)
        if (attackerArmy) {
          attackerArmy = { ...attackerArmy, location: capitalId, state: 'IDLE' }
        } else {
          const newArmyId = `army_${playerCountryId}_main`
          attackerArmy = {
            id: newArmyId,
            ownerId: playerCountryId,
            location: capitalId,
            state: 'IDLE',
            name: 'Royal Army',
            destination: null,
            arrivalDate: null,
            troops: [],
          }
          attackerArmy.troops = generateTroopsForArmy(attackerArmy, false)
        }
      }
      attackerArmy = {
        ...attackerArmy,
        location: targetSettlementId,
        state: 'BATTLE',
      }
      const defenderOwnerId = targetSettlementForAttack.ownerId || 'REBELS'
      const defenderId = `army_defend_${targetSettlementId}_${Date.now()}`
      const defenderArmy: Army = {
        id: defenderId,
        ownerId: defenderOwnerId,
        location: targetSettlementId,
        state: 'BATTLE',
        name: targetSettlementForAttack.ownerId ? 'Garrison' : 'Local Militia',
        destination: null,
        arrivalDate: null,
        troops: [],
      }
      defenderArmy.troops = generateTroopsForArmy(defenderArmy, true)
      const battle = initializeBattle(attackerArmy, defenderArmy, true)
      dispatch(setArmies([attackerArmy, defenderArmy]))
      dispatch(setBattle(battle))
      dispatch(setPaused(true))
    },
  },

  UNLOCK_IDEA_SLOT: {
    execute: ({ dispatch, getState }, { countryId }) => {
      const state = getState()
      const country = state.countries[countryId]
      if (!country) return
      const slots = country.ideaSlots || []
      if (slots.length >= 12) return
      const cost = 50
      if (country.resources.cash < cost) return
      const updatedCountry = {
        ...country,
        resources: {
          ...country.resources,
          cash: country.resources.cash - cost,
        },
        ideaSlots: [...slots, null],
      }
      dispatch(setCountries([updatedCountry]))
    },
  },

  EQUIP_IDEA_SLOT: {
    execute: ({ dispatch, getState }, { countryId, slotIndex, ideaId }) => {
      const state = getState()
      const country = state.countries[countryId]
      if (!country) return
      if (slotIndex < 0 || slotIndex >= 12) return
      const slots = country.ideaSlots || []
      if (slotIndex >= slots.length) return
      const registry = IdeaRegistry.getInstance()
      const idea = registry.getIdea(ideaId)
      if (!idea) return
      const equippedIds = slots.filter((x): x is string => typeof x === 'string')
      if (equippedIds.includes(ideaId)) return
      let newResources = country.resources
      let newAdopted = country.adoptedIdeas
      if (!country.adoptedIdeas.includes(ideaId)) {
        const school = idea.school
        const currentTradition = country.resources.tradition?.[school] || 0
        if (currentTradition < idea.cost) return
        const updatedTradition = {
          ...(country.resources.tradition || {}),
          [school]: currentTradition - idea.cost,
        }
        newResources = {
          ...country.resources,
          tradition: updatedTradition,
        }
        newAdopted = [...country.adoptedIdeas, ideaId]
        const modifierRegistry = ModifierRegistry.getInstance()
        idea.rewardModifiers.forEach(mod => {
          modifierRegistry.registerModifier(mod)
          modifierRegistry.addModifierToScope(countryId, mod.id)
        })
      }
      const newSlots = [...slots]
      newSlots[slotIndex] = ideaId
      const updatedCountry = {
        ...country,
        resources: newResources,
        adoptedIdeas: newAdopted,
        ideaSlots: newSlots,
      }
      dispatch(setCountries([updatedCountry]))
    },
  },

  UNEQUIP_IDEA_SLOT: {
    execute: ({ dispatch, getState }, { countryId, slotIndex }) => {
      const state = getState()
      const country = state.countries[countryId]
      if (!country) return
      const slots = country.ideaSlots || []
      if (slotIndex < 0 || slotIndex >= slots.length) return
      const ideaId = slots[slotIndex]
      if (!ideaId) return
      const registry = IdeaRegistry.getInstance()
      const equippedIds = slots.filter((x): x is string => typeof x === 'string')
      const blockedBy: string[] = []
      for (const id of equippedIds) {
        if (id === ideaId) continue
        const idea = registry.getIdea(id)
        if (idea && ConditionSystem.dependsOn(idea.condition, 'adoptedIdeas', ideaId)) {
          blockedBy.push(id)
        }
      }
      if (blockedBy.length > 0) return
      const newSlots = [...slots]
      newSlots[slotIndex] = null
      const stillEquippedElsewhere = newSlots.some(x => x === ideaId)
      let newAdopted = country.adoptedIdeas
      if (!stillEquippedElsewhere) {
        newAdopted = country.adoptedIdeas.filter(id => id !== ideaId)
        const idea = registry.getIdea(ideaId)
        if (idea) {
          const modifierRegistry = ModifierRegistry.getInstance()
          idea.rewardModifiers.forEach(mod => {
            modifierRegistry.removeModifierFromScope(countryId, mod.id)
          })
        }
      }
      const updatedCountry = {
        ...country,
        adoptedIdeas: newAdopted,
        ideaSlots: newSlots,
      }
      dispatch(setCountries([updatedCountry]))
    },
  },

  BATTLE_ACTION: {
    execute: ({ dispatch, getState }, { actionType, targetTroopId }) => {
      let battleState = getState().activeBattle
      if (!battleState) return
      let nextState = resolveTurn(battleState, actionType, targetTroopId)
      dispatch(updateBattle(nextState))
      battleState = nextState
      while (!battleState.winner) {
        const currentActorId = battleState.actionQueue[battleState.currentActionIndex]
        if (!currentActorId) break
        const isAiActor = battleState.defenderTroops.some(t => t.id === currentActorId)
        if (!isAiActor) break
        const actor = battleState.defenderTroops.find(t => t.id === currentActorId)
        if (actor) {
          const targetId = getBestTarget(actor, battleState.attackerTroops)
          nextState = targetId ? resolveTurn(battleState, 'ATTACK', targetId) : resolveTurn(battleState, 'DEFEND')
          dispatch(updateBattle(nextState))
          battleState = nextState
        } else {
          break
        }
      }
      if (battleState.winner) {
        if (battleState.winner === 'ATTACKER') {
          const attackerId = battleState.attackerId
          const attackerArmy = getState().armies[attackerId]
          if (attackerArmy && attackerArmy.location) {
            const settlement = getState().settlements.find(s => s.id === attackerArmy.location)
            if (settlement && settlement.ownerId !== attackerArmy.ownerId) {
              const updatedSettlement = { ...settlement, ownerId: attackerArmy.ownerId }
              dispatch(updateSettlement(updatedSettlement))
            }
          }
        }
      }
    },
  },

  CLOSE_BATTLE: {
    execute: ({ dispatch, getState }) => {
      const endingBattle = getState().activeBattle
      if (endingBattle) {
        const { attackerId, defenderId } = endingBattle
        const state = getState()
        const updates: Army[] = []
        const attackerArmy = state.armies[attackerId]
        if (attackerArmy) {
          const country = state.countries[attackerArmy.ownerId]
          let capitalId: string | undefined = country?.capitalId
          if (!capitalId) {
            const s = state.settlements.find(s => s.ownerId === attackerArmy.ownerId)
            capitalId = s?.id
          }
          if (capitalId) {
            updates.push({
              ...attackerArmy,
              location: capitalId,
              state: 'IDLE',
              troops: endingBattle.attackerTroops,
            })
          }
        }
        const defenderArmy = state.armies[defenderId]
        if (defenderArmy) {
          updates.push({
            ...defenderArmy,
            state: 'IDLE',
            troops: endingBattle.defenderTroops,
          })
        }
        if (updates.length > 0) {
          dispatch(setArmies(updates))
        }
      }
      dispatch(setBattle(null))
      dispatch(setPaused(false))
      dispatch(tick())
    },
  },

  RETREAT_BATTLE: {
    execute: ({ dispatch, getState }) => {
      const currentBattle = getState().activeBattle
      if (currentBattle && !currentBattle.winner) {
        const updatedBattle = JSON.parse(JSON.stringify(currentBattle))
        updatedBattle.winner = 'DEFENDER'
        updatedBattle.log.push('Attacker retreated!')
        const attackerId = updatedBattle.attackerId
        const state = getState()
        const attackerArmy = state.armies[attackerId]
        if (attackerArmy) {
          const country = state.countries[attackerArmy.ownerId]
          let capitalId: string | undefined = country?.capitalId
          if (!capitalId) {
            const s = state.settlements.find(s => s.ownerId === attackerArmy.ownerId)
            capitalId = s?.id
          }
          if (capitalId) {
            const updatedArmy: Army = {
              ...attackerArmy,
              location: capitalId,
              state: 'IDLE',
              troops: updatedBattle.attackerTroops,
            }
            dispatch(setArmies([updatedArmy]))
            updatedBattle.log.push(`Army retreated to Capital`)
          }
        }
        dispatch(updateBattle(updatedBattle))
      }
    },
  },

  HIRE_ADVISOR: {
    execute: ({ dispatch, getState }, advisorId: string) => {
      const state = getState()
      const advisorToHire = state.advisors.find(a => a.id === advisorId)
      const playerId = state.playerCountryId
      if (advisorToHire && !advisorToHire.ownerId) {
        const hiredCount = state.advisors.filter(a => a.ownerId === playerId).length
        if (hiredCount < 5) {
          dispatch(updateAdvisor({ ...advisorToHire, ownerId: playerId }))
        }
      }
    },
  },

  FIRE_ADVISOR: {
    execute: ({ dispatch, getState }, advisorId: string) => {
      const state = getState()
      const advisorToFire = state.advisors.find(a => a.id === advisorId)
      const playerId = state.playerCountryId
      if (advisorToFire && advisorToFire.ownerId === playerId) {
        dispatch(updateAdvisor({ ...advisorToFire, ownerId: null }))
      }
    },
  },

  SPAWN_COUNTRY: {
    execute: ({ dispatch, getState }, { settlementId, tag }) => {
      const currentGameState = getState()
      const usedTags = Object.keys(currentGameState.countries)
      let newTag = tag
      if (!newTag) {
        const availableTags = TAGS.filter(t => !usedTags.includes(t))
        if (availableTags.length === 0) return
        newTag = availableTags[Math.floor(Math.random() * availableTags.length)]
      } else {
        if (usedTags.includes(newTag)) {
          return
        }
      }
      const settlementToSpawn = currentGameState.settlements.find(s => s.id === settlementId)
      if (!settlementToSpawn) return
      const newCountry = {
        id: newTag,
        name: COUNTRY_NAMES[newTag as keyof typeof COUNTRY_NAMES] || `State of ${newTag}`,
        color: COUNTRY_COLORS[newTag as keyof typeof COUNTRY_COLORS] || '#000000',
        resources: {
          cash: 100,
          engineering_practice: 0,
          military_practice: 0,
          tradition: SCHOOLS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<School, number>),
          stockpile: createEmptyStockpile(),
        },
        researchedTechs: [],
        adoptedIdeas: [],
        ideaSlots: [],
        unlockedIdeas: [],
        capitalId: settlementId,
      }
      dispatch(addCountry(newCountry))
      const updatedSettlement = { ...settlementToSpawn, ownerId: newTag }
      dispatch(updateSettlement(updatedSettlement))
    },
  },
}

// 2. Tick processing is now driven by TICK commands from the main thread

// Refactored message handler to allow internal calling
export const handleCommand = (command: Command) => {
  const { type, payload } = command

  if (type !== 'TICK') {
    console.log(`[Worker] Handling command: ${type}`)
  }

  const handler = commandHandlers[type]
  if (!handler) {
    console.warn('Unknown command:', type)
    return
  }

  handler.execute(
    {
      dispatch: action => store.dispatch(action),
      getState: () => store.getState().gameState,
      handleCommand,
    },
    payload as any
  )
}

// 3. Handle Messages
self.onmessage = (e: MessageEvent<Command>) => {
  handleCommand(e.data)
}

// 4. Broadcast State Changes
store.subscribe(() => {
  const state = store.getState()
  self.postMessage({ type: 'STATE_UPDATE', payload: state.gameState })
})
