import { GameEvent } from '../types/GameEvent'
import { GameState } from '../store/gameState'
import { ConditionSystem } from './ConditionSystem'

export class EventManager {
  private static instance: EventManager
  private events: GameEvent[] = []

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager()
    }
    return EventManager.instance
  }

  registerEvent(event: GameEvent) {
    this.events.push(event)
  }

  registerEvents(events: GameEvent[]) {
    this.events.push(...events)
  }

  getEventById(id: string): GameEvent | undefined {
    return this.events.find(e => e.id === id)
  }

  /**
   * Check all events against current state
   * Returns the first triggered event or null
   */
  checkTriggers(state: GameState): { event: GameEvent, context: any } | null {
    for (const event of this.events) {
      // Check maxFires
      if (event.maxFires && (state.firedEvents[event.id] || 0) >= event.maxFires) {
        continue
      }

      // Check condition (JSON logic)
      if (event.condition) {
        // Default context: just root for now, maybe event itself as 'from'?
        // For triggers, we usually check against global state (root)
        // If we need specific actor context (e.g. per-country events), we'd need to loop over countries?
        // But checkTriggers currently takes just `state`.
        // So `condition` here is strictly global check unless we iterate.
        // Existing `triggerCondition` also just takes `state`.
        const context = { ROOT: state }
        if (!ConditionSystem.checkCondition(event.condition, context)) {
          continue
        }
      }

      // Check triggerCondition if exists
      if (event.triggerCondition) {
        const result = event.triggerCondition(state)
        if (typeof result === 'boolean') {
          if (result) return { event, context: null }
        } else {
          if (result.triggered) {
            return { event, context: result.context }
          }
        }
      } else if (event.condition) {
        // If no triggerCondition but condition passed (checked above)
        return { event, context: null }
      }
    }
    return null
  }
}

import { coreEvents } from '../content/EventLoader'

// Example Event Registration
// Ideally this happens at app startup
export function registerCoreEvents() {
  const manager = EventManager.getInstance()
  manager.registerEvents(coreEvents)
}
