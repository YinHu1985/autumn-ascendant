import { describe, it, expect } from 'vitest'
import {
  gameStateReducer,
  tick,
  researchTech,
  adoptIdea,
  constructBuilding,
  tradeResource,
} from './gameState'
import type { GameState } from './gameState'
import type { Country } from '../types/Country'
import type { Building } from '../types/Building'
import { TechRegistry } from '../systems/TechRegistry'
import { IdeaRegistry } from '../systems/IdeaRegistry'
import type { Technology } from '../types/Technology'
import type { Idea } from '../types/Idea'
import { BuildingRegistry } from '../systems/BuildingRegistry'

function makeInitialState(): GameState {
  return {
    date: { year: 1000, month: 1, day: 30 },
    lastTickType: 'daily',
    settlements: [],
    countries: {},
    armies: {},
    advisors: [],
    activeEventId: null,
    activeBattle: null,
    paused: false,
    playerCountryId: 'C1',
    firedEvents: {},
    activeEventContext: null,
  }
}

function makeCountry(): Country {
  return {
    id: 'C1',
    name: 'Test',
    color: '#000',
    resources: {
      cash: 100,
      engineering_practice: 50,
      military_practice: 50,
      tradition: { confucianism: 100 } as any,
      stockpile: { grain: 10 } as any,
    },
    researchedTechs: [],
    adoptedIdeas: [],
    ideaSlots: [],
    unlockedIdeas: [],
    capitalId: 'S1',
  }
}

describe('gameState - tick', () => {
  it('advances to next month and sets lastTickType to monthly', () => {
    const initial = makeInitialState()
    const next = gameStateReducer(initial, tick())

    expect(next.date.day).toBe(1)
    expect(next.date.month).toBe(2)
    expect(next.lastTickType).toBe('monthly')
  })
})

describe('gameState - researchTech', () => {
  it('adds tech and deducts resources when valid', () => {
    const techRegistry = TechRegistry.getInstance()
    const tech: Technology = {
      id: 'tech_gs',
      name: 'GS',
      description: '',
      category: 'production',
      cost: { gold: 10, engineering_practice: 10, military_practice: 10 },
      prerequisites: [],
      rewardModifiers: [],
    }
    techRegistry.registerTech(tech)

    const initial = makeInitialState()
    const country = makeCountry()
    initial.countries[country.id] = country

    const next = gameStateReducer(
      initial,
      researchTech({ countryId: country.id, techId: tech.id })
    )

    const updated = next.countries[country.id]
    expect(updated.researchedTechs).toContain(tech.id)
    expect(updated.resources.cash).toBe(90)
    expect(updated.resources.engineering_practice).toBe(40)
    expect(updated.resources.military_practice).toBe(40)
  })
})

describe('gameState - adoptIdea', () => {
  it('adds idea and deducts tradition when valid', () => {
    const ideaRegistry = IdeaRegistry.getInstance()
    const idea: Idea = {
      id: 'idea_gs',
      name: 'Idea',
      description: '',
      school: 'confucianism',
      cost: 20,
      prerequisites: [],
      rewardModifiers: [],
    }
    ideaRegistry.registerIdea(idea)

    const initial = makeInitialState()
    const country = makeCountry()
    initial.countries[country.id] = country

    const next = gameStateReducer(
      initial,
      adoptIdea({ countryId: country.id, ideaId: idea.id })
    )

    const updated = next.countries[country.id]
    expect(updated.adoptedIdeas).toContain(idea.id)
    expect(updated.resources.tradition.confucianism).toBe(80)
  })
})

describe('gameState - constructBuilding', () => {
  it('constructs building and deducts gold', () => {
    const buildingRegistry = BuildingRegistry.getInstance()
    const building: Building = {
      id: 'b1',
      name: 'House',
      description: '',
      cost: { gold: 20 },
      modifiers: [],
    }
    buildingRegistry.registerBuilding(building)

    const initial = makeInitialState()
    const country = makeCountry()
    initial.countries[country.id] = country
    initial.settlements = [
      {
        id: 'S1',
        name: 'City',
        ownerId: country.id,
        position: { x: 0, y: 0 },
        terrain: 'plain',
        connections: [],
        localProduct: null,
        population: { urban: 0, rural: 0 },
        development: { urban: 0, rural: 0 },
        buildings: [],
      },
    ]

    const next = gameStateReducer(
      initial,
      constructBuilding({ settlementId: 'S1', buildingId: 'b1' })
    )

    const updatedCountry = next.countries[country.id]
    const updatedSettlement = next.settlements[0]
    expect(updatedCountry.resources.cash).toBe(80)
    expect(updatedSettlement.buildings).toContain('b1')
  })
})

describe('gameState - tradeResource', () => {
  it('buys resources when cash sufficient', () => {
    const initial = makeInitialState()
    const country = makeCountry()
    initial.countries[country.id] = country

    const next = gameStateReducer(
      initial,
      tradeResource({ countryId: country.id, resourceId: 'grain', quantity: 1 })
    )

    const updated = next.countries[country.id]
    expect(updated.resources.stockpile['grain']).toBeGreaterThan(10)
    expect(updated.resources.cash).toBeLessThan(100)
  })
})

