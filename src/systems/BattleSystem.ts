import { BattleState, Troop, TroopStats, TroopType } from '../types/Battle'
import { Army } from '../types/Army'
import { ModifierRegistry } from './ModifierRegistry'

export function getDefaultTroopStatsForType(type: TroopType, isWeak: boolean = false): TroopStats {
  const baseHp = type === 'Chariot' ? 200 : 100
  const baseAtk = type === 'Infantry' ? 10 : (type === 'Archer' ? 15 : (type === 'Cavalry' ? 20 : 30))
  const baseDef = type === 'Infantry' ? 10 : (type === 'Archer' ? 5 : (type === 'Cavalry' ? 8 : 15))

  const multiplier = isWeak ? 0.5 : 1.0

  const hp = Math.floor(baseHp * multiplier)

  return {
    hp,
    maxHp: hp,
    morale: 100,
    attack: Math.floor(baseAtk * multiplier),
    defense: Math.floor(baseDef * multiplier),
  }
}

/**
 * Helper to generate some default troops for an army
 */
export function generateTroopsForArmy(army: Army, isWeak: boolean = false): Troop[] {
  const troops: Troop[] = []
  const types: TroopType[] = ['Infantry', 'Archer', 'Cavalry', 'Chariot']
  const count = isWeak ? 3 : 6

  for (let i = 0; i < count; i++) {
    const type = types[i % 4]
    const stats = getDefaultTroopStatsForType(type, isWeak)

    troops.push({
      id: `${army.id}_troop_${i}`,
      type,
      stats,
      position: {
        row: i < 3 ? 0 : 1,
        col: (i % 3) as 0 | 1 | 2
      }
    })
  }
  return troops
}

export function generateActionQueue(attackerTroops: Troop[], defenderTroops: Troop[]): string[] {
  // Filter living troops
  const attackers = attackerTroops.filter(t => t.stats.hp > 0).sort((a, b) => b.stats.morale - a.stats.morale)
  const defenders = defenderTroops.filter(t => t.stats.hp > 0).sort((a, b) => b.stats.morale - a.stats.morale)

  const queue: string[] = []
  const maxLength = Math.max(attackers.length, defenders.length)

  for (let i = 0; i < maxLength; i++) {
    if (i < attackers.length) queue.push(attackers[i].id)
    if (i < defenders.length) queue.push(defenders[i].id)
  }

  return queue
}

export function initializeBattle(attacker: Army, defender: Army, isDefenderWeak: boolean = false): BattleState {
  // Use existing troops if available, otherwise generate (should generally be initialized)
  const attackerTroops = attacker.troops && attacker.troops.length > 0 
      ? attacker.troops 
      : generateTroopsForArmy(attacker, false)
  
  const defenderTroops = defender.troops && defender.troops.length > 0 
      ? defender.troops 
      : generateTroopsForArmy(defender, isDefenderWeak)
  
  const queue = generateActionQueue(attackerTroops, defenderTroops)

  return {
    id: `battle_${attacker.id}_${defender.id}_${Date.now()}`,
    attackerId: attacker.id,
    defenderId: defender.id,
    attackerTroops: JSON.parse(JSON.stringify(attackerTroops)), // Clone for battle state to avoid mutating Army directly until end
    defenderTroops: JSON.parse(JSON.stringify(defenderTroops)),
    turn: 'ATTACKER', // Legacy, updated by queue logic usually
    actionQueue: queue,
    currentActionIndex: 0,
    round: 1,
    log: ['Battle started!'],
    winner: null
  }
}

// AI Helper: Select best target for max damage
export function getBestTarget(attacker: Troop, enemies: Troop[]): string | null {
    let bestTargetId: string | null = null
    let maxDamage = -1

    const livingEnemies = enemies.filter(t => t.stats.hp > 0)
    if (livingEnemies.length === 0) return null

    for (const enemy of livingEnemies) {
        // Simplified damage calc matching resolveTurn logic
        const damage = Math.max(1, attacker.stats.attack - (enemy.stats.defense * 0.5))
        if (damage > maxDamage) {
            maxDamage = damage
            bestTargetId = enemy.id
        }
    }
    
    // If all equal, pick random or first
    return bestTargetId || livingEnemies[0].id
}

export function resolveTurn(
  battle: BattleState, 
  actionType: 'ATTACK' | 'DEFEND',
  targetTroopId?: string // Required if ATTACK
): BattleState {
  // Clone battle state
  const nextBattle: BattleState = JSON.parse(JSON.stringify(battle))
  
  const currentActorId = nextBattle.actionQueue[nextBattle.currentActionIndex]
  if (!currentActorId) {
      // Should not happen if logic is correct, but safety check
      // Regenerate queue?
      return nextBattle
  }

  // Find actor
  let actor = nextBattle.attackerTroops.find(t => t.id === currentActorId)
  let isActorAttacker = true
  if (!actor) {
      actor = nextBattle.defenderTroops.find(t => t.id === currentActorId)
      isActorAttacker = false
  }

  if (!actor) {
      // Actor might have died? Skip
      nextBattle.currentActionIndex++
      return checkNextTurn(nextBattle)
  }

  // Perform Action
  if (actionType === 'ATTACK' && targetTroopId) {
      const enemies = isActorAttacker ? nextBattle.defenderTroops : nextBattle.attackerTroops
      const target = enemies.find(t => t.id === targetTroopId)

      if (target && target.stats.hp > 0) {
          const damage = Math.max(1, actor.stats.attack - (target.stats.defense * 0.5))
          const variance = 0.8 + Math.random() * 0.4
          const finalDamage = Math.floor(damage * variance)
          
          target.stats.hp = Math.max(0, target.stats.hp - finalDamage)
          
          nextBattle.log.push(`${actor.type} attacks ${target.type} for ${finalDamage} damage!`)
          
          if (target.stats.hp === 0) {
              nextBattle.log.push(`${target.type} was defeated!`)
          }
      }
  } else {
      nextBattle.log.push(`${actor.type} holds position.`)
  }

  // Check Win Condition
  const attackerAlive = nextBattle.attackerTroops.some(t => t.stats.hp > 0)
  const defenderAlive = nextBattle.defenderTroops.some(t => t.stats.hp > 0)
  
  if (!attackerAlive) {
    nextBattle.winner = 'DEFENDER'
    nextBattle.log.push('Defender wins!')
    return nextBattle
  } else if (!defenderAlive) {
    nextBattle.winner = 'ATTACKER'
    nextBattle.log.push('Attacker wins!')
    return nextBattle
  }

  // Advance Queue
  nextBattle.currentActionIndex++
  return checkNextTurn(nextBattle)
}

function checkNextTurn(battle: BattleState): BattleState {
    // If index exceeds queue, start new round
    if (battle.currentActionIndex >= battle.actionQueue.length) {
        battle.round++
        battle.log.push(`Round ${battle.round} started.`)
        battle.actionQueue = generateActionQueue(battle.attackerTroops, battle.defenderTroops)
        battle.currentActionIndex = 0
    }
    
    // Check if next actor is dead (skip them)
    // Loop until we find a living actor or finish queue
    while (battle.currentActionIndex < battle.actionQueue.length) {
        const nextId = battle.actionQueue[battle.currentActionIndex]
        const actor = battle.attackerTroops.find(t => t.id === nextId) || battle.defenderTroops.find(t => t.id === nextId)
        
        if (actor && actor.stats.hp > 0) {
            break // Found valid actor
        }
        
        // Actor dead, skip
        battle.currentActionIndex++
    }
    
    // Double check if we exhausted queue again
    if (battle.currentActionIndex >= battle.actionQueue.length) {
        return checkNextTurn(battle) // Recurse to generate new round
    }

    return battle
}
