import type { GameState } from '../store/gameState'
import type { Command } from '../types/Command'
import { TechRegistry } from './TechRegistry'
import { IdeaRegistry } from './IdeaRegistry'
import { BuildingRegistry } from './BuildingRegistry'
import { EventManager } from './EventManager'
import { RESOURCE_BASE_PRICE } from '../types/Country'

export interface CommandCheckResult {
  allowed: boolean
  hardBlock: boolean
  reasons: string[]
}

export function checkCommandAllowed(state: GameState, command: Command): CommandCheckResult {
  const reasons: string[] = []

  switch (command.type) {
    case 'RESEARCH_TECH': {
      const { countryId, techId } = command.payload
      const country = state.countries[countryId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      const tech = TechRegistry.getInstance().getTech(techId)
      if (!tech) {
        return { allowed: false, hardBlock: true, reasons: ['Tech not found'] }
      }
      if (country.researchedTechs.includes(techId)) {
        reasons.push('Tech already researched')
      }
      const hasPrereqs = tech.prerequisites.every(id => country.researchedTechs.includes(id))
      if (!hasPrereqs) {
        reasons.push('Prerequisites not met')
      }
      const cost = tech.cost
      if (
        (cost.gold && country.resources.cash < cost.gold) ||
        (cost.engineering_practice &&
          (country.resources.engineering_practice || 0) < cost.engineering_practice) ||
        (cost.military_practice &&
          (country.resources.military_practice || 0) < cost.military_practice)
      ) {
        reasons.push('Insufficient resources')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'ADOPT_IDEA': {
      const { countryId, ideaId } = command.payload
      const country = state.countries[countryId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      const registry = IdeaRegistry.getInstance()
      const idea = registry.getIdea(ideaId)
      if (!idea) {
        return { allowed: false, hardBlock: true, reasons: ['Idea not found'] }
      }
      if (country.adoptedIdeas?.includes(ideaId)) {
        reasons.push('Idea already adopted')
      }
      if (country.unlockedIdeas && country.unlockedIdeas.length > 0 && !country.unlockedIdeas.includes(ideaId)) {
        reasons.push('Idea not unlocked')
      }
      const prereqsMet = idea.prerequisites.every(id => country.adoptedIdeas?.includes(id))
      if (!prereqsMet) {
        reasons.push('Prerequisites not met')
      }
      const school = idea.school
      const currentTradition = country.resources.tradition?.[school] || 0
      if (currentTradition < idea.cost) {
        reasons.push('Not enough tradition')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'CONSTRUCT_BUILDING': {
      const { settlementId, buildingId } = command.payload
      const settlement = state.settlements.find(s => s.id === settlementId)
      if (!settlement) {
        return { allowed: false, hardBlock: true, reasons: ['Settlement not found'] }
      }
      const country = state.countries[settlement.ownerId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      const registry = BuildingRegistry.getInstance()
      const building = registry.getBuilding(buildingId)
      if (!building) {
        return { allowed: false, hardBlock: true, reasons: ['Building not found'] }
      }
      if (building.requiredProduct && settlement.localProduct !== building.requiredProduct) {
        reasons.push('Required local product not present')
      }
      const cost = building.cost
      if (cost.gold && country.resources.cash < cost.gold) {
        reasons.push('Not enough gold')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'FAST_RECOVER_ARMY': {
      const { armyId } = command.payload
      const army = state.armies[armyId]
      if (!army) {
        return { allowed: false, hardBlock: true, reasons: ['Army not found'] }
      }
      const country = state.countries[army.ownerId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      let totalMissingHp = 0
      for (const troop of army.troops || []) {
        totalMissingHp += Math.max(0, (troop.stats.maxHp || 0) - (troop.stats.hp || 0))
      }
      if (totalMissingHp <= 0) {
        reasons.push('No missing HP')
      }
      const costPerHp = 0.5
      const cost = Math.ceil(totalMissingHp * costPerHp)
      if (country.resources.cash < cost) {
        reasons.push('Not enough cash')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'CHANGE_TROOP_TYPE': {
      const { armyId, troopId } = command.payload
      const army = state.armies[armyId]
      if (!army) {
        return { allowed: false, hardBlock: true, reasons: ['Army not found'] }
      }
      const country = state.countries[army.ownerId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      const troop = (army.troops || []).find(t => t.id === troopId)
      if (!troop) {
        return { allowed: false, hardBlock: true, reasons: ['Troop not found'] }
      }
      const typeChangeCost = 10
      if (country.resources.cash < typeChangeCost) {
        reasons.push('Not enough cash')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'INITIATE_ATTACK': {
      const targetSettlementId = command.payload as string
      const targetSettlement = state.settlements.find(s => s.id === targetSettlementId)
      if (!targetSettlement) {
        return { allowed: false, hardBlock: true, reasons: ['Target settlement not found'] }
      }
      const playerCountryId = state.playerCountryId
      const isConnected = state.settlements.some(s => {
        if (s.ownerId !== playerCountryId) return false
        const forward = targetSettlement.connections.some(conn => {
          const target = typeof conn === 'string' ? conn : conn.targetId
          const type = typeof conn === 'string' ? 'normal' : conn.type
          return type !== 'disabled' && target === s.id
        })
        const backward = s.connections.some(conn => {
          const target = typeof conn === 'string' ? conn : conn.targetId
          const type = typeof conn === 'string' ? 'normal' : conn.type
          return type !== 'disabled' && target === targetSettlement.id
        })
        return forward || backward
      })
      if (!isConnected) {
        reasons.push('Target not connected to player territory')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'RESOLVE_EVENT': {
      const { eventId, optionIndex } = command.payload
      const event = EventManager.getInstance().getEventById(eventId)
      if (!event) {
        return { allowed: false, hardBlock: true, reasons: ['Event not found'] }
      }
      if (!event.options[optionIndex]) {
        return { allowed: false, hardBlock: true, reasons: ['Option not found'] }
      }
      return { allowed: true, hardBlock: false, reasons: [] }
    }

    case 'UNLOCK_IDEA_SLOT': {
      const { countryId } = command.payload
      const country = state.countries[countryId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      const slots = country.ideaSlots || []
      if (slots.length >= 12) {
        return { allowed: false, hardBlock: true, reasons: ['Maximum slots reached'] }
      }
      const cost = 50
      if (country.resources.cash < cost) {
        reasons.push('Not enough cash')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'EQUIP_IDEA_SLOT': {
      const { countryId, slotIndex, ideaId } = command.payload
      const country = state.countries[countryId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      if (slotIndex < 0 || slotIndex >= 12) {
        return { allowed: false, hardBlock: true, reasons: ['Invalid slot index'] }
      }
      const slots = country.ideaSlots || []
      if (slotIndex >= slots.length) {
        reasons.push('Slot not unlocked')
      }
      const registry = IdeaRegistry.getInstance()
      const idea = registry.getIdea(ideaId)
      if (!idea) {
        return { allowed: false, hardBlock: true, reasons: ['Idea not found'] }
      }
      if (country.unlockedIdeas && country.unlockedIdeas.length > 0 && !country.unlockedIdeas.includes(ideaId)) {
        reasons.push('Idea not unlocked')
      }
      const equippedIds = slots.filter((x): x is string => typeof x === 'string')
      if (equippedIds.includes(ideaId)) {
        reasons.push('Idea already equipped')
      }
      const prereqsMet = idea.prerequisites.every(id => equippedIds.includes(id))
      if (!prereqsMet) {
        reasons.push('Prerequisites not equipped')
      }
      if (!country.adoptedIdeas.includes(ideaId)) {
        const school = idea.school
        const currentTradition = country.resources.tradition?.[school] || 0
        if (currentTradition < idea.cost) {
          reasons.push('Not enough tradition to adopt idea')
        }
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'UNEQUIP_IDEA_SLOT': {
      const { countryId, slotIndex } = command.payload
      const country = state.countries[countryId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      if (slotIndex < 0 || slotIndex >= 12) {
        return { allowed: false, hardBlock: true, reasons: ['Invalid slot index'] }
      }
      const slots = country.ideaSlots || []
      if (slotIndex >= slots.length) {
        return { allowed: false, hardBlock: true, reasons: ['Slot not unlocked'] }
      }
      const ideaId = slots[slotIndex]
      if (!ideaId) {
        return { allowed: false, hardBlock: true, reasons: ['Slot is empty'] }
      }
      const registry = IdeaRegistry.getInstance()
      const equippedIds = slots.filter((x): x is string => typeof x === 'string')
      const blockedBy: string[] = []
      for (const id of equippedIds) {
        if (id === ideaId) continue
        const idea = registry.getIdea(id)
        if (idea && idea.prerequisites.includes(ideaId)) {
          blockedBy.push(id)
        }
      }
      if (blockedBy.length > 0) {
        reasons.push('Required by other equipped ideas')
      }
      return { allowed: reasons.length === 0, hardBlock: false, reasons }
    }

    case 'MOVE_ARMY': {
      const { armyId, targetSettlementId } = command.payload
      const army = state.armies[armyId]
      if (!army) {
        return { allowed: false, hardBlock: true, reasons: ['Army not found'] }
      }
      const target = state.settlements.find(s => s.id === targetSettlementId)
      if (!target) {
        return { allowed: false, hardBlock: true, reasons: ['Target settlement not found'] }
      }
      const reasonsLocal: string[] = []
      const origin = state.settlements.find(s => s.id === army.location)
      if (!origin) {
        reasonsLocal.push('Army location not found')
      } else {
        const isNeighbor = origin.connections.some(conn => {
          const id = typeof conn === 'string' ? conn : conn.targetId
          const type = typeof conn === 'string' ? 'normal' : conn.type
          return type !== 'disabled' && id === targetSettlementId
        })
        if (!isNeighbor) {
          reasonsLocal.push('Target not directly connected')
        }
      }
      return {
        allowed: reasonsLocal.length === 0,
        hardBlock: false,
        reasons: reasonsLocal,
      }
    }

    case 'TRADE_RESOURCE': {
      const { countryId, resourceId, quantity } = command.payload
      const country = state.countries[countryId]
      if (!country) {
        return { allowed: false, hardBlock: true, reasons: ['Country not found'] }
      }
      const basePrice = RESOURCE_BASE_PRICE[resourceId as keyof typeof RESOURCE_BASE_PRICE]
      if (!basePrice) {
        return { allowed: false, hardBlock: true, reasons: ['Resource not tradeable'] }
      }
      const reasonsLocal: string[] = []
      const currentStock = country.resources.stockpile[resourceId]
      if (quantity > 0) {
        const cost = basePrice * quantity
        if (country.resources.cash < cost) {
          reasonsLocal.push('Not enough cash')
        }
      } else if (quantity < 0) {
        const sellQty = Math.min(currentStock, -quantity)
        if (sellQty <= 0) {
          reasonsLocal.push('Not enough stock to sell')
        }
      }
      return { allowed: reasonsLocal.length === 0, hardBlock: false, reasons: reasonsLocal }
    }

    default:
      return { allowed: true, hardBlock: false, reasons: [] }
  }
}
