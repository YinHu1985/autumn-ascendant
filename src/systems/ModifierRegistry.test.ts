import { describe, it, expect, beforeEach } from 'vitest'
import { ModifierRegistry } from './ModifierRegistry'
import { Modifier } from '../types/Modifier'

describe('ModifierRegistry', () => {
  const registry = ModifierRegistry.getInstance()

  beforeEach(() => {
    registry.reset()
  })

  it('calculates flat modifiers correctly', () => {
    const mod: Modifier = {
      id: 'iron_tools',
      name: 'Iron Tools',
      targetAttribute: 'production',
      operator: 'add_flat',
      value: 10
    }
    registry.registerModifier(mod)
    registry.addModifierToScope('settlement_1', 'iron_tools')

    const result = registry.calculateValue(100, 'production', 'settlement_1')
    expect(result).toBe(110)
  })

  it('calculates percent modifiers correctly', () => {
    const mod: Modifier = {
      id: 'tax_reform',
      name: 'Tax Reform',
      targetAttribute: 'tax',
      operator: 'add_percent',
      value: 0.5 // +50%
    }
    registry.registerModifier(mod)
    registry.addModifierToScope('country_1', 'tax_reform')

    const result = registry.calculateValue(100, 'tax', 'country_1')
    expect(result).toBe(150)
  })

  it('combines multiple modifier types correctly', () => {
    // Base: 100
    // +10 flat -> 110
    // +50% percent -> 110 * 1.5 = 165
    // * 2 multiply -> 165 * 2 = 330
    
    registry.registerModifier({
      id: 'flat_mod',
      name: 'Flat',
      targetAttribute: 'attr',
      operator: 'add_flat',
      value: 10
    })
    registry.registerModifier({
      id: 'percent_mod',
      name: 'Percent',
      targetAttribute: 'attr',
      operator: 'add_percent',
      value: 0.5
    })
    registry.registerModifier({
      id: 'multi_mod',
      name: 'Multi',
      targetAttribute: 'attr',
      operator: 'multiply',
      value: 2
    })

    const scope = 'test_scope'
    registry.addModifierToScope(scope, 'flat_mod')
    registry.addModifierToScope(scope, 'percent_mod')
    registry.addModifierToScope(scope, 'multi_mod')

    const result = registry.calculateValue(100, 'attr', scope)
    expect(result).toBe(330)
  })

  it('handles multiple additive percents correctly', () => {
    // 100 + 10% + 20% = 100 * 1.3 = 130 (not 100 * 1.1 * 1.2 = 132)
    registry.registerModifier({
      id: 'p1',
      name: 'P1',
      targetAttribute: 'val',
      operator: 'add_percent',
      value: 0.1
    })
    registry.registerModifier({
      id: 'p2',
      name: 'P2',
      targetAttribute: 'val',
      operator: 'add_percent',
      value: 0.2
    })

    const scope = 'test_scope'
    registry.addModifierToScope(scope, 'p1')
    registry.addModifierToScope(scope, 'p2')

    const result = registry.calculateValue(100, 'val', scope)
    expect(result).toBe(130)
  })

  it('ignores modifiers for other attributes or scopes', () => {
    registry.registerModifier({
      id: 'mod_a',
      name: 'A',
      targetAttribute: 'attr_a',
      operator: 'add_flat',
      value: 10
    })

    const scope = 'scope_1'
    registry.addModifierToScope(scope, 'mod_a')

    // Different attribute
    expect(registry.calculateValue(100, 'attr_b', scope)).toBe(100)
    
    // Different scope
    expect(registry.calculateValue(100, 'attr_a', 'scope_2')).toBe(100)
  })
})
