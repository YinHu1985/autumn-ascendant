import { describe, it, expect } from 'vitest'
import { processEconomy } from './EconomySystem'
import type { GameState } from '../store/gameState'
import type { Country, ResourceId, School } from '../types/Country'
import { SCHOOLS } from '../types/Country'
import { ModifierRegistry } from './ModifierRegistry'
import { BuildingRegistry } from './BuildingRegistry'
import type { Building } from '../types/Building'

function makeEmptyGameState(): GameState {
  return {
    date: { year: 1000, month: 1, day: 1 },
    lastTickType: 'monthly',
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
  const stockpile: Record<ResourceId, number> = {} as any
  return {
    id: 'C1',
    name: 'Test',
    color: '#000',
    resources: {
      cash: 0,
      engineering_practice: 0,
      military_practice: 0,
      tradition: SCHOOLS.reduce(
        (acc, s) => ({ ...acc, [s]: 0 }),
        {} as Record<School, number>
      ),
      stockpile,
    },
    researchedTechs: [],
    adoptedIdeas: [],
    ideaSlots: [],
    unlockedIdeas: [],
    capitalId: 'S1',
  }
}

describe('EconomySystem - processEconomy', () => {
  it('adds base cash from urban population', () => {
    const state = makeEmptyGameState()
    const country = makeCountry()
    state.countries[country.id] = country
    state.settlements = [
      {
        id: 'S1',
        name: 'City',
        ownerId: country.id,
        position: { x: 0, y: 0 },
        terrain: 'plain',
        connections: [],
        localProduct: null,
        population: { urban: 5000, rural: 0 },
        development: { urban: 0, rural: 0 },
        buildings: [],
      },
    ]

    processEconomy(state)

    // 5000 / 1000 = 5 base cash
    expect(state.countries[country.id].resources.cash).toBeCloseTo(5)
  })

  it('applies monthly tradition modifiers per school', () => {
    const state = makeEmptyGameState()
    const country = makeCountry()
    state.countries[country.id] = country
    state.settlements = [
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

    const registry = ModifierRegistry.getInstance()
    SCHOOLS.forEach(school => {
      registry.registerModifier({
        id: `trad_${school}`,
        name: `Trad ${school}`,
        targetAttribute: `monthly_tradition_${school}`,
        operator: 'add_flat',
        value: 1,
      })
      registry.addModifierToScope('S1', `trad_${school}`)
    })

    processEconomy(state)

    SCHOOLS.forEach(school => {
      expect(state.countries[country.id].resources.tradition[school]).toBe(1)
    })
  })

  it('runs building input/output when stockpile allows and pays maintenance', () => {
    const state = makeEmptyGameState()
    const country = makeCountry()
    country.resources.cash = 100
    country.resources.stockpile['grain'] = 10
    country.resources.stockpile['paper'] = 0
    state.countries[country.id] = country
    state.settlements = [
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
        buildings: ['b_mill'],
      },
    ]

    const buildingRegistry = BuildingRegistry.getInstance()
    const mill: Building = {
      id: 'b_mill',
      name: 'Mill',
      description: '',
      cost: { gold: 0 },
      modifiers: [],
      monthlyMaintenance: 5,
      inputStockpile: { grain: 2 },
      outputStockpile: { paper: 1 },
    }
    buildingRegistry.registerBuilding(mill)

    processEconomy(state)

    const resources = state.countries[country.id].resources
    expect(resources.cash).toBeCloseTo(95) // maintenance
    expect(resources.stockpile['grain']).toBe(8)
    expect(resources.stockpile['paper']).toBe(1)
  })
})
