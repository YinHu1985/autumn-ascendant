import { GameState } from '../store/gameState'
import { Army } from '../types/Army'
import { Settlement } from '../types/Settlement'
import { initializeBattle } from './BattleSystem'
import { setBattle } from '../store/gameState'

// Configuration
const ARMY_SPEED_PER_DAY = 50 // Map units per day

/**
 * Calculate distance between two settlements
 */
function calculateDistance(from: Settlement, to: Settlement): number {
  const dx = from.position.x - to.position.x
  const dy = from.position.y - to.position.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Helper to add days to a date
 */
function addDays(date: { year: number, month: number, day: number }, daysToAdd: number) {
  let { year, month, day } = date
  let remaining = daysToAdd

  while (remaining > 0) {
    // Simple 30 day months
    const spaceInMonth = 30 - day
    if (remaining <= spaceInMonth) {
      day += remaining
      remaining = 0
    } else {
      remaining -= (spaceInMonth + 1) // +1 because we flip to day 1 next month
      day = 1
      month++
      if (month > 12) {
        month = 1
        year++
      }
    }
  }
  return { year, month, day }
}

/**
 * Compare two dates. Returns:
 * -1 if a < b
 * 0 if a == b
 * 1 if a > b
 */
function compareDates(a: { year: number, month: number, day: number }, b: { year: number, month: number, day: number }): number {
  if (a.year !== b.year) return a.year - b.year
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}

/**
 * Command: Move Army
 */
export function moveArmyCommand(state: GameState, armyId: string, targetSettlementId: string): void {
  const army = state.armies[armyId]
  if (!army) {
    console.warn(`Army ${armyId} not found`)
    return
  }

  // Find locations
  const currentSettlement = state.settlements.find(s => s.id === army.location)
  const targetSettlement = state.settlements.find(s => s.id === targetSettlementId)

  if (!currentSettlement || !targetSettlement) {
    console.warn('Invalid start or target settlement')
    return
  }

  if (currentSettlement.id === targetSettlement.id) {
    console.warn('Already at location')
    return
  }

  // Calculate travel time
  const distance = calculateDistance(currentSettlement, targetSettlement)
  const daysToTravel = Math.ceil(distance / ARMY_SPEED_PER_DAY)

  // Update Army State
  army.state = 'MOVING'
  army.destination = targetSettlementId
  army.arrivalDate = addDays(state.date, daysToTravel)
  
  console.log(`Army ${armyId} moving to ${targetSettlement.name}. ETA: ${daysToTravel} days.`)
}

/**
 * System: Process Army Movement (Daily Tick)
 */
export function processArmyMovement(state: GameState): void {
  const currentDate = state.date

  // We need to trigger battles. But processArmyMovement runs inside the reducer.
  // We CANNOT dispatch actions from inside a reducer.
  // The state passed here is a Draft<GameState> (Immer).
  // We can modify it directly.
  
  for (const armyId in state.armies) {
    const army = state.armies[armyId]
    
    if (army.state === 'MOVING' && army.arrivalDate && army.destination) {
      // Check if arrived (currentDate >= arrivalDate)
      if (compareDates(currentDate, army.arrivalDate) >= 0) {
        // Arrived!
        army.location = army.destination
        army.destination = null
        army.arrivalDate = null
        
        // Determine new state based on ownership
        const locationSettlement = state.settlements.find(s => s.id === army.location)
        
        if (locationSettlement && locationSettlement.ownerId !== army.ownerId) {
          // Check for enemy armies at this location
          const enemyArmy = Object.values(state.armies).find(
             a => a.location === army.location && a.ownerId !== army.ownerId && a.id !== army.id
          )

          if (enemyArmy) {
            army.state = 'BATTLE'
            enemyArmy.state = 'BATTLE'
            
            // Initiate Battle
            // Since we are in Immer draft, we can set state.activeBattle directly!
            // But we need to call initializeBattle which returns a new object.
            const battleState = initializeBattle(army, enemyArmy)
            state.activeBattle = battleState
            state.paused = true // Auto-pause
            
            console.log(`Battle started between ${army.id} and ${enemyArmy.id}`)
          } else {
            // Siege if no army
            army.state = 'SIEGE'
          }
        } else {
          army.state = 'IDLE'
        }
        
        console.log(`Army ${armyId} arrived at ${army.location}`)
      }
    }
  }
}

export function processArmyRecovery(state: GameState): void {
  for (const armyId in state.armies) {
    const army = state.armies[armyId]
    if (!army.troops || army.troops.length === 0) continue

    for (const troop of army.troops) {
      const stats = troop.stats
      if (!stats) continue
      if (stats.hp >= stats.maxHp) continue

      const recovery = Math.max(1, Math.floor(stats.maxHp * 0.1))
      stats.hp = Math.min(stats.maxHp, stats.hp + recovery)
    }
  }
}
