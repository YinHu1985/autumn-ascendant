import { describe, it, expect } from 'vitest'
import { moveArmyCommand, processArmyMovement, processArmyRecovery } from './ArmySystem'
import type { GameState } from '../store/gameState'
import type { Army } from '../types/Army'

function makeEmptyState(): GameState {
  return {
    date: { year: 1000, month: 1, day: 1 },
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

describe('ArmySystem - moveArmyCommand', () => {
  it('sets destination and arrivalDate when move is valid', () => {
    const state = makeEmptyState()
    state.settlements = [
      {
        id: 'S1',
        name: 'Origin',
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
        name: 'Target',
        ownerId: 'C1',
        position: { x: 100, y: 0 },
        terrain: 'plain',
        connections: [],
        population: { urban: 0, rural: 0 },
        development: { urban: 0, rural: 0 },
        buildings: [],
      },
    ]
    const army = makeArmy()
    state.armies[army.id] = army

    moveArmyCommand(state, army.id, 'S2')

    expect(army.state).toBe('MOVING')
    expect(army.destination).toBe('S2')
    expect(army.arrivalDate).not.toBeNull()
  })
})

describe('ArmySystem - processArmyMovement', () => {
  it('moves army to destination and sets state to IDLE when arriving at owned settlement', () => {
    const state = makeEmptyState()
    state.settlements = [
      {
        id: 'S1',
        name: 'Origin',
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
        name: 'Target',
        ownerId: 'C1',
        position: { x: 0, y: 0 },
        terrain: 'plain',
        connections: [],
        population: { urban: 0, rural: 0 },
        development: { urban: 0, rural: 0 },
        buildings: [],
      },
    ]
    const army = makeArmy({
      location: 'S1',
      state: 'MOVING',
      destination: 'S2',
      arrivalDate: { year: 1000, month: 1, day: 1 },
    })
    state.armies[army.id] = army

    processArmyMovement(state)

    expect(army.location).toBe('S2')
    expect(army.destination).toBeNull()
    expect(army.arrivalDate).toBeNull()
    expect(army.state).toBe('IDLE')
  })
})

describe('ArmySystem - processArmyRecovery', () => {
  it('recovers troop HP up to maxHp', () => {
    const state = makeEmptyState()
    const army = makeArmy({
      troops: [
        {
          id: 't1',
          type: 'Infantry',
          stats: { hp: 50, maxHp: 100, morale: 100, attack: 10, defense: 10 },
          position: { row: 0, col: 0 },
        },
      ],
    })
    state.armies[army.id] = army

    processArmyRecovery(state)

    const troop = army.troops[0]
    expect(troop.stats.hp).toBeGreaterThan(50)
    expect(troop.stats.hp).toBeLessThanOrEqual(100)
  })
})

