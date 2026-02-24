import { describe, it, expect } from 'vitest'
import { checkCommandAllowed } from './CommandRules'
import type { GameState } from '../store/gameState'
import type { Country } from '../types/Country'
import type { Army } from '../types/Army'
import { TechRegistry } from './TechRegistry'
import { IdeaRegistry } from './IdeaRegistry'
import { BuildingRegistry } from './BuildingRegistry'
import { EventManager } from './EventManager'
import type { Technology } from '../types/Technology'
import type { Idea } from '../types/Idea'
import type { Building } from '../types/Building'

function makeEmptyGameState(): GameState {
  return {
    date: { year: 1000, month: 1, day: 1 },
    lastTickType: 'daily',
    settlements: [],
    countries: {},
    armies: {},
    advisors: [],
    activeEventId: null,
    activeBattle: null,
    paused: true,
    playerCountryId: 'QII',
    firedEvents: {},
    activeEventContext: null,
  }
}

function makeCountry(overrides: Partial<Country> = {}): Country {
  return {
    id: 'C1',
    name: 'Test Country',
    color: '#000000',
    resources: {
      cash: 0,
      engineering_practice: 0,
      military_practice: 0,
      tradition: {} as any,
      stockpile: {} as any,
    },
    researchedTechs: [],
    adoptedIdeas: [],
    ideaSlots: [],
    unlockedIdeas: [],
    capitalId: 'S1',
    ...overrides,
  }
}

function makeArmy(overrides: Partial<Army> = {}): Army {
  return {
    id: 'A1',
    ownerId: 'C1',
    location: 'S1',
    state: 'IDLE',
    destination: null,
    arrivalDate: null,
    troops: [],
    ...overrides,
  }
}

describe('CommandRules - RESEARCH_TECH', () => {
  it('allows valid tech research when prereqs and resources are sufficient', () => {
    const state = makeEmptyGameState()
    const techRegistry = TechRegistry.getInstance()
    const tech: Technology = {
      id: 'tech_test',
      name: 'Test Tech',
      description: '',
      category: 'production',
      cost: { gold: 10 },
      prerequisites: [],
      rewardModifiers: [],
    }
    techRegistry.registerTech(tech)

    const country = makeCountry({
      resources: {
        cash: 20,
        engineering_practice: 0,
        military_practice: 0,
        tradition: {} as any,
        stockpile: {} as any,
      },
    })
    state.countries[country.id] = country

    const result = checkCommandAllowed(state, {
      type: 'RESEARCH_TECH',
      payload: { countryId: country.id, techId: tech.id },
    })

    expect(result.hardBlock).toBe(false)
    expect(result.allowed).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('collects soft reasons for missing prereqs and insufficient resources', () => {
    const state = makeEmptyGameState()
    const techRegistry = TechRegistry.getInstance()
    const tech: Technology = {
      id: 'tech_soft',
      name: 'Soft Tech',
      description: '',
      category: 'production',
      cost: { gold: 50 },
      prerequisites: ['tech_missing'],
      rewardModifiers: [],
    }
    techRegistry.registerTech(tech)

    const country = makeCountry({
      resources: {
        cash: 10,
        engineering_practice: 0,
        military_practice: 0,
        tradition: {} as any,
        stockpile: {} as any,
      },
    })
    state.countries[country.id] = country

    const result = checkCommandAllowed(state, {
      type: 'RESEARCH_TECH',
      payload: { countryId: country.id, techId: tech.id },
    })

    expect(result.hardBlock).toBe(false)
    expect(result.allowed).toBe(false)
    expect(result.reasons).toEqual(
      expect.arrayContaining(['Prerequisites not met', 'Insufficient resources'])
    )
  })
})

describe('CommandRules - ADOPT_IDEA / EQUIP_IDEA_SLOT', () => {
  it('respects unlockedIdeas as a soft requirement for adopt', () => {
    const state = makeEmptyGameState()
    const ideaRegistry = IdeaRegistry.getInstance()
    const idea: Idea = {
      id: 'idea_test',
      name: 'Test Idea',
      description: '',
      school: 'confucianism',
      cost: 10,
      prerequisites: [],
      rewardModifiers: [],
    }
    ideaRegistry.registerIdea(idea)

    const country = makeCountry({
      resources: {
        cash: 0,
        engineering_practice: 0,
        military_practice: 0,
        tradition: { confucianism: 20 } as any,
        stockpile: {} as any,
      },
      unlockedIdeas: ['some_other_idea'],
    })
    state.countries[country.id] = country

    const result = checkCommandAllowed(state, {
      type: 'ADOPT_IDEA',
      payload: { countryId: country.id, ideaId: idea.id },
    })

    expect(result.hardBlock).toBe(false)
    expect(result.allowed).toBe(false)
    expect(result.reasons).toContain('Idea not unlocked')
  })

  it('allows equip into unlocked slot when idea unlocked and prereqs met', () => {
    const state = makeEmptyGameState()
    const ideaRegistry = IdeaRegistry.getInstance()
    const idea: Idea = {
      id: 'idea_equip',
      name: 'Slot Idea',
      description: '',
      school: 'confucianism',
      cost: 5,
      prerequisites: [],
      rewardModifiers: [],
    }
    ideaRegistry.registerIdea(idea)

    const country = makeCountry({
      ideaSlots: [null],
      unlockedIdeas: [idea.id],
      adoptedIdeas: [],
      resources: {
        cash: 0,
        engineering_practice: 0,
        military_practice: 0,
        tradition: { confucianism: 10 } as any,
        stockpile: {} as any,
      },
    })
    state.countries[country.id] = country

    const result = checkCommandAllowed(state, {
      type: 'EQUIP_IDEA_SLOT',
      payload: { countryId: country.id, slotIndex: 0, ideaId: idea.id },
    })

    expect(result.hardBlock).toBe(false)
    expect(result.allowed).toBe(true)
  })

  it('prevents unequip when other equipped ideas depend on it', () => {
    const state = makeEmptyGameState()
    const ideaRegistry = IdeaRegistry.getInstance()
    const baseIdea: Idea = {
      id: 'idea_base',
      name: 'Base',
      description: '',
      school: 'confucianism',
      cost: 0,
      prerequisites: [],
      rewardModifiers: [],
    }
    const childIdea: Idea = {
      id: 'idea_child',
      name: 'Child',
      description: '',
      school: 'confucianism',
      cost: 0,
      prerequisites: ['idea_base'],
      rewardModifiers: [],
    }
    ideaRegistry.registerIdea(baseIdea)
    ideaRegistry.registerIdea(childIdea)

    const country = makeCountry({
      ideaSlots: ['idea_base', 'idea_child'],
      adoptedIdeas: ['idea_base', 'idea_child'],
    })
    state.countries[country.id] = country

    const result = checkCommandAllowed(state, {
      type: 'UNEQUIP_IDEA_SLOT',
      payload: { countryId: country.id, slotIndex: 0 },
    })

    expect(result.hardBlock).toBe(false)
    expect(result.allowed).toBe(false)
    expect(result.reasons).toContain('Required by other equipped ideas')
  })
})

describe('CommandRules - MOVE_ARMY', () => {
  it('hard-blocks when army or target settlement missing', () => {
    const state = makeEmptyGameState()
    const result = checkCommandAllowed(state, {
      type: 'MOVE_ARMY',
      payload: { armyId: 'missing', targetSettlementId: 'S2' },
    })
    expect(result.hardBlock).toBe(true)
    expect(result.allowed).toBe(false)
  })

  it('adds soft reason when target is not directly connected', () => {
    const state = makeEmptyGameState()
    state.settlements = [
      {
        id: 'S1',
        name: 'A',
        ownerId: 'C1',
        position: { x: 0, y: 0 },
        terrain: 'plain',
        connections: [],
        population: { urban: 0, rural: 0 },
        development: { urban: 0, rural: 0 },
        buildings: [],
      },
      {
        id: 'S2',
        name: 'B',
        ownerId: 'C1',
        position: { x: 1, y: 1 },
        terrain: 'plain',
        connections: [],
        population: { urban: 0, rural: 0 },
        development: { urban: 0, rural: 0 },
        buildings: [],
      },
    ]
    state.armies['A1'] = makeArmy()

    const result = checkCommandAllowed(state, {
      type: 'MOVE_ARMY',
      payload: { armyId: 'A1', targetSettlementId: 'S2' },
    })

    expect(result.hardBlock).toBe(false)
    expect(result.allowed).toBe(false)
    expect(result.reasons).toContain('Target not directly connected')
  })
})

describe('CommandRules - TRADE_RESOURCE', () => {
  it('hard-blocks non-tradeable resource', () => {
    const state = makeEmptyGameState()
    const country = makeCountry({
      resources: {
        cash: 100,
        engineering_practice: 0,
        military_practice: 0,
        tradition: {} as any,
        stockpile: {} as any,
      },
    })
    state.countries[country.id] = country

    const result = checkCommandAllowed(state, {
      type: 'TRADE_RESOURCE',
      payload: { countryId: country.id, resourceId: 'nonexistent', quantity: 10 },
    } as any)

    expect(result.hardBlock).toBe(true)
    expect(result.allowed).toBe(false)
  })

  it('adds soft reason when buying without enough cash', () => {
    const state = makeEmptyGameState()
    const country = makeCountry({
      resources: {
        cash: 0,
        engineering_practice: 0,
        military_practice: 0,
        tradition: {} as any,
        stockpile: { grain: 0 } as any,
      },
    })
    state.countries[country.id] = country

    const result = checkCommandAllowed(state, {
      type: 'TRADE_RESOURCE',
      payload: { countryId: country.id, resourceId: 'grain', quantity: 10 },
    })

    expect(result.hardBlock).toBe(false)
    expect(result.allowed).toBe(false)
    expect(result.reasons).toContain('Not enough cash')
  })
})

describe('CommandRules - RESOLVE_EVENT', () => {
  it('hard-blocks when event or option not found', () => {
    const state = makeEmptyGameState()
    const manager = EventManager.getInstance()
    manager.registerEvent({
      id: 'evt_test',
      title: 'Test',
      description: '',
      options: [{ text: 'OK', effect: () => {} }],
      triggerCondition: () => false,
    })

    const missingEvent = checkCommandAllowed(state, {
      type: 'RESOLVE_EVENT',
      payload: { eventId: 'missing', optionIndex: 0 },
    })
    expect(missingEvent.hardBlock).toBe(true)

    const badOption = checkCommandAllowed(state, {
      type: 'RESOLVE_EVENT',
      payload: { eventId: 'evt_test', optionIndex: 5 },
    })
    expect(badOption.hardBlock).toBe(true)
  })
})
