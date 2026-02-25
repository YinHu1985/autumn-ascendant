
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventManager } from './EventManager'
import { GameState } from '../store/gameState'
import { GameEvent } from '../types/GameEvent'

describe('EventManager with Conditions', () => {
  let manager: EventManager
  let mockState: GameState

  beforeEach(() => {
    // Reset singleton instance (hacky but necessary if no reset method)
    // Actually EventManager has private constructor and static instance.
    // We can cast to any to reset it or just add events to the existing one.
    // Better to just clear events if possible, or create a new instance via prototype manipulation?
    // Let's just use the instance and register unique events.
    manager = EventManager.getInstance()
    
    // Clear existing events to avoid noise (if possible)
    // The class doesn't expose a clear method. We can access private property via casting.
    ;(manager as any).events = []

    mockState = {
      date: { year: 1000, month: 1, day: 1 },
      activeEventId: null,
      activeEventContext: null,
      firedEvents: {},
      countries: {},
      settlements: [],
      armies: {},
      advisors: [],
      activeBattle: null,
      paused: false,
      lastTickType: 'daily',
      playerCountryId: 'QII'
    } as unknown as GameState
  })

  it('should trigger event when JSON condition is met', () => {
    const event: GameEvent = {
      id: 'evt_json_test',
      title: 'JSON Test',
      description: 'Testing JSON conditions',
      options: [],
      condition: {
        path: 'date.year',
        op: 'eq',
        value: 1000
      }
    }
    manager.registerEvent(event)

    const result = manager.checkTriggers(mockState)
    expect(result).not.toBeNull()
    expect(result?.event.id).toBe('evt_json_test')
  })

  it('should NOT trigger event when JSON condition is NOT met', () => {
    const event: GameEvent = {
      id: 'evt_json_fail',
      title: 'JSON Fail',
      description: 'Should not trigger',
      options: [],
      condition: {
        path: 'date.year',
        op: 'eq',
        value: 2000
      }
    }
    manager.registerEvent(event)

    const result = manager.checkTriggers(mockState)
    expect(result).toBeNull()
  })

  it('should respect both condition and triggerCondition', () => {
    const event: GameEvent = {
      id: 'evt_both',
      title: 'Both Checks',
      description: 'Both must pass',
      options: [],
      condition: {
        path: 'date.year',
        op: 'eq',
        value: 1000
      },
      triggerCondition: () => true
    }
    manager.registerEvent(event)

    const result = manager.checkTriggers(mockState)
    expect(result).not.toBeNull()
    expect(result?.event.id).toBe('evt_both')
  })

  it('should fail if condition passes but triggerCondition fails', () => {
    const event: GameEvent = {
      id: 'evt_mixed_fail',
      title: 'Mixed Fail',
      description: 'Condition pass, trigger fail',
      options: [],
      condition: {
        path: 'date.year',
        op: 'eq',
        value: 1000
      },
      triggerCondition: () => false
    }
    manager.registerEvent(event)

    const result = manager.checkTriggers(mockState)
    expect(result).toBeNull()
  })
})
