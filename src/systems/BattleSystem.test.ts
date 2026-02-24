import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getDefaultTroopStatsForType,
  generateTroopsForArmy,
  generateActionQueue,
  initializeBattle,
  getBestTarget,
  resolveTurn,
} from './BattleSystem'
import type { Army } from '../types/Army'
import type { Troop } from '../types/Battle'

const makeArmy = (id: string): Army => ({
  id,
  ownerId: 'C1',
  location: 'S1',
  state: 'IDLE',
  destination: null,
  arrivalDate: null,
  troops: [],
})

describe('BattleSystem - getDefaultTroopStatsForType', () => {
  it('applies weaker stats when isWeak is true', () => {
    const normal = getDefaultTroopStatsForType('Infantry', false)
    const weak = getDefaultTroopStatsForType('Infantry', true)
    expect(weak.hp).toBeLessThan(normal.hp)
    expect(weak.attack).toBeLessThan(normal.attack)
    expect(weak.defense).toBeLessThan(normal.defense)
  })
})

describe('BattleSystem - generateTroopsForArmy', () => {
  it('generates correct number of troops and positions', () => {
    const army = makeArmy('A1')
    const troops = generateTroopsForArmy(army, false)
    expect(troops).toHaveLength(6)
    troops.forEach((t, index) => {
      expect(t.id).toBe(`A1_troop_${index}`)
      expect(t.position.row === 0 || t.position.row === 1).toBe(true)
      expect([0, 1, 2]).toContain(t.position.col)
    })
  })
})

describe('BattleSystem - generateActionQueue', () => {
  it('alternates attacker and defender troop IDs', () => {
    const makeTroop = (id: string): Troop => ({
      id,
      type: 'Infantry',
      stats: { hp: 100, maxHp: 100, morale: 50, attack: 10, defense: 10 },
      position: { row: 0, col: 0 },
    })
    const attackers = [makeTroop('a1'), makeTroop('a2')]
    const defenders = [makeTroop('d1'), makeTroop('d2')]

    const queue = generateActionQueue(attackers, defenders)
    expect(queue).toEqual(['a1', 'd1', 'a2', 'd2'])
  })
})

describe('BattleSystem - initializeBattle', () => {
  it('creates a battle state with cloned troops and action queue', () => {
    const attacker = makeArmy('A1')
    const defender = makeArmy('D1')
    const battle = initializeBattle(attacker, defender, false)

    expect(battle.id).toContain('battle_A1_D1')
    expect(battle.attackerId).toBe('A1')
    expect(battle.defenderId).toBe('D1')
    expect(battle.attackerTroops.length).toBeGreaterThan(0)
    expect(battle.defenderTroops.length).toBeGreaterThan(0)
    expect(battle.actionQueue.length).toBeGreaterThan(0)

    // Ensure troops are cloned
    if (attacker.troops.length > 0) {
      expect(battle.attackerTroops[0]).not.toBe(attacker.troops[0])
    }
  })
})

describe('BattleSystem - getBestTarget', () => {
  it('returns enemy with maximum expected damage', () => {
    const attacker: Troop = {
      id: 'atk',
      type: 'Infantry',
      stats: { hp: 100, maxHp: 100, morale: 50, attack: 20, defense: 10 },
      position: { row: 0, col: 0 },
    }
    const enemies: Troop[] = [
      {
        id: 'e1',
        type: 'Infantry',
        stats: { hp: 100, maxHp: 100, morale: 50, attack: 10, defense: 10 },
        position: { row: 0, col: 0 },
      },
      {
        id: 'e2',
        type: 'Infantry',
        stats: { hp: 100, maxHp: 100, morale: 50, attack: 10, defense: 0 },
        position: { row: 0, col: 1 },
      },
    ]

    const best = getBestTarget(attacker, enemies)
    expect(best).toBe('e2')
  })
})

describe('BattleSystem - resolveTurn', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(1)
  })

  it('deals damage on ATTACK and can end battle', () => {
    const attacker = makeArmy('A1')
    const defender = makeArmy('D1')
    const battle = initializeBattle(attacker, defender, false)

    const actorId = battle.actionQueue[battle.currentActionIndex]
    const actor =
      battle.attackerTroops.find(t => t.id === actorId) ||
      battle.defenderTroops.find(t => t.id === actorId)
    expect(actor).toBeTruthy()

    const enemies =
      battle.attackerTroops.includes(actor as Troop) ? battle.defenderTroops : battle.attackerTroops
    const targetId = enemies[0].id

    const next = resolveTurn(battle, 'ATTACK', targetId)
    const targetAfter =
      next.attackerTroops.find(t => t.id === targetId) ||
      next.defenderTroops.find(t => t.id === targetId)

    expect(targetAfter?.stats.hp).toBeLessThan(
      enemies[0].stats.hp
    )
  })
})

