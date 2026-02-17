import { GameEvent } from '../types/GameEvent'
import { GameState } from '../store/gameState'

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

      const result = event.triggerCondition(state)
      if (typeof result === 'boolean') {
        if (result) return { event, context: null }
      } else {
        if (result.triggered) {
          return { event, context: result.context }
        }
      }
    }
    return null
  }
}

// Example Event Registration
// Ideally this happens at app startup
export function registerCoreEvents() {
  const manager = EventManager.getInstance()

  // Test Event: Day 5 Welcome
  manager.registerEvent({
    id: 'evt_welcome',
    title: 'A New Era',
    description: 'The year is 1000. Your reign begins. The people await your command.',
    options: [
      {
        text: 'Let us prosper.',
        effect: (dispatch) => {
          console.log('Event Effect: Welcome confirmed')
        }
      }
    ],
    triggerCondition: (state) => {
      // Trigger exactly on Day 5
      return state.date.year === 1000 && state.date.month === 1 && state.date.day === 5
    }
  })

  // New Nation Event
  manager.registerEvent({
    id: 'evt_new_nation_rise',
    title: 'Rise of a New Power',
    description: 'A local warlord in {settlement_name} has declared independence and established a new state!',
    maxFires: 1,
    triggerCondition: (state) => {
        // Random chance check (e.g. 1% daily chance, or check once a month)
        // For testing, let's make it trigger on Day 10 if not triggered
        if (state.date.day !== 10) return false

        // Find candidate settlements:
        // 1. Ownerless (ownerId === null)
        const candidates = state.settlements.filter(s => s.ownerId === null)
        
        if (candidates.length === 0) return false

        // Pick one randomly
        const target = candidates[Math.floor(Math.random() * candidates.length)]
        
        console.log(`[EventManager] Triggering New Nation Event at ${target.name} (${target.id})`)

        return {
            triggered: true,
            context: {
                settlementId: target.id,
                settlement_name: target.name
            }
        }
    },
    options: [
        {
            text: 'Interesting times ahead.',
            effect: (dispatch, state, context) => {
                if (context && context.settlementId) {
                    dispatch({
                        type: 'SPAWN_COUNTRY',
                        payload: {
                            settlementId: context.settlementId,
                            tag: null // Auto-generate unused tag
                        }
                    })
                }
            }
        }
    ]
  })
}
