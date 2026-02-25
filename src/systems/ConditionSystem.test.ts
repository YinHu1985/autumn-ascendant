
import { describe, it, expect } from 'vitest'
import { ConditionSystem, Condition, ConditionContext } from './ConditionSystem'

describe('ConditionSystem', () => {
  const mockState: any = {
    date: { year: 1000, month: 1, day: 1 },
    countries: {
      'c1': { id: 'c1', gold: 100, tags: ['player'] },
      'c2': { id: 'c2', gold: 50, tags: ['ai'] }
    },
    globalFlag: true
  }

  const context: ConditionContext = {
    ROOT: mockState,
    ACTOR: mockState.countries['c1'],
    TARGET: mockState.countries['c2'],
    TEMP: { battleRound: 3 }
  }

  it('should evaluate basic leaf conditions (ROOT scope)', () => {
    const condition: Condition = {
      path: 'date.year',
      op: 'eq',
      value: 1000
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)

    const condition2: Condition = {
      path: 'date.year',
      op: 'gt',
      value: 900
    }
    expect(ConditionSystem.checkCondition(condition2, context)).toBe(true)

    const condition3: Condition = {
      path: 'date.year',
      op: 'lt',
      value: 2000
    }
    expect(ConditionSystem.checkCondition(condition3, context)).toBe(true)
  })

  it('should evaluate actor scope conditions', () => {
    const condition: Condition = {
      scope: 'ACTOR',
      path: 'gold',
      op: 'eq',
      value: 100
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)

    const condition2: Condition = {
      scope: 'ACTOR',
      path: 'gold',
      op: 'gt',
      value: 50
    }
    expect(ConditionSystem.checkCondition(condition2, context)).toBe(true)
  })

  it('should evaluate target scope conditions', () => {
    const condition: Condition = {
      scope: 'TARGET',
      path: 'gold',
      op: 'lt',
      value: 100
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)
  })

  it('should evaluate temp scope conditions', () => {
    const condition: Condition = {
      scope: 'TEMP',
      path: 'battleRound',
      op: 'gte',
      value: 3
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)
  })

  it('should handle AND logic', () => {
    const condition: Condition = {
      AND: [
        { scope: 'ACTOR', path: 'gold', op: 'gt', value: 50 },
        { scope: 'TARGET', path: 'gold', op: 'lt', value: 60 }
      ]
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)

    const failCondition: Condition = {
      AND: [
        { scope: 'ACTOR', path: 'gold', op: 'gt', value: 50 },
        { scope: 'TARGET', path: 'gold', op: 'gt', value: 60 } // False (50 is not > 60)
      ]
    }
    expect(ConditionSystem.checkCondition(failCondition, context)).toBe(false)
  })

  it('should handle OR logic', () => {
    const condition: Condition = {
      OR: [
        { scope: 'ACTOR', path: 'gold', op: 'gt', value: 200 }, // False
        { scope: 'TARGET', path: 'gold', op: 'lt', value: 60 }  // True
      ]
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)

    const failCondition: Condition = {
      OR: [
        { scope: 'ACTOR', path: 'gold', op: 'gt', value: 200 }, // False
        { scope: 'TARGET', path: 'gold', op: 'gt', value: 60 }  // False
      ]
    }
    expect(ConditionSystem.checkCondition(failCondition, context)).toBe(false)
  })

  it('should handle NOT logic', () => {
    const condition: Condition = {
      NOT: { scope: 'ACTOR', path: 'gold', op: 'eq', value: 50 } // ACTOR gold is 100, so eq 50 is False. NOT False is True.
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)
  })

  it('should handle nested logic', () => {
    // (ACTOR.gold > 50 AND TARGET.gold < 60) OR (ROOT.date.year > 2000)
    // (True AND True) OR False -> True
    const condition: Condition = {
      OR: [
        {
          AND: [
            { scope: 'ACTOR', path: 'gold', op: 'gt', value: 50 },
            { scope: 'TARGET', path: 'gold', op: 'lt', value: 60 }
          ]
        },
        { path: 'date.year', op: 'gt', value: 2000 }
      ]
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)
  })

  it('should handle contains operator', () => {
    const condition: Condition = {
      scope: 'ACTOR',
      path: 'tags',
      op: 'contains',
      value: 'player'
    }
    expect(ConditionSystem.checkCondition(condition, context)).toBe(true)

    const failCondition: Condition = {
      scope: 'ACTOR',
      path: 'tags',
      op: 'contains',
      value: 'missing_tag'
    }
    expect(ConditionSystem.checkCondition(failCondition, context)).toBe(false)
  })
})
