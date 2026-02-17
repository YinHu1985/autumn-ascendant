import { Modifier } from '../types/Modifier'

type ScopeMap = Map<string, Set<string>> // scopeId -> Set<modifierId>

export class ModifierRegistry {
  private static instance: ModifierRegistry
  private modifiers: Map<string, Modifier> = new Map()
  private scopeModifiers: ScopeMap = new Map()

  private constructor() {}

  static getInstance(): ModifierRegistry {
    if (!ModifierRegistry.instance) {
      ModifierRegistry.instance = new ModifierRegistry()
    }
    return ModifierRegistry.instance
  }

  /**
   * Register a modifier definition globally
   */
  registerModifier(mod: Modifier): void {
    this.modifiers.set(mod.id, mod)
  }

  /**
   * Apply a registered modifier to a specific scope (e.g., country or settlement)
   */
  addModifierToScope(scopeId: string, modifierId: string): void {
    if (!this.modifiers.has(modifierId)) {
      console.warn(`Modifier ${modifierId} not registered`)
      return
    }
    if (!this.scopeModifiers.has(scopeId)) {
      this.scopeModifiers.set(scopeId, new Set())
    }
    this.scopeModifiers.get(scopeId)!.add(modifierId)
  }

  /**
   * Remove a modifier from a specific scope
   */
  removeModifierFromScope(scopeId: string, modifierId: string): void {
    const scope = this.scopeModifiers.get(scopeId)
    if (scope) {
      scope.delete(modifierId)
    }
  }

  /**
   * Get all modifiers active for a given attribute and scope
   */
  getActiveModifiers(targetAttribute: string, scopeId: string): Modifier[] {
    const activeIds = this.scopeModifiers.get(scopeId)
    if (!activeIds) return []

    const result: Modifier[] = []
    for (const modId of activeIds) {
      const mod = this.modifiers.get(modId)
      if (mod && mod.targetAttribute === targetAttribute) {
        result.push(mod)
      }
    }
    return result
  }

  /**
   * Calculate final value based on base value and active modifiers
   * Order: Base + Flat -> Percent Additive -> Multiplicative
   */
  calculateValue(baseValue: number, targetAttribute: string, scopeId: string): number {
    const mods = this.getActiveModifiers(targetAttribute, scopeId)
    
    let flatSum = 0
    let percentSum = 0
    let multiplierProduct = 1

    for (const mod of mods) {
      switch (mod.operator) {
        case 'add_flat':
          flatSum += mod.value
          break
        case 'add_percent':
          percentSum += mod.value
          break
        case 'multiply':
          multiplierProduct *= mod.value
          break
      }
    }

    // 1. Apply flat
    let result = baseValue + flatSum

    // 2. Apply additive percent (e.g. +10% + +20% = +30% of base+flat)
    // Assuming 'add_percent' value 0.1 means +10%
    if (percentSum !== 0) {
      result = result * (1 + percentSum)
    }

    // 3. Apply multiplicative (e.g. * 1.1 * 1.5)
    if (multiplierProduct !== 1) {
      result = result * multiplierProduct
    }

    return result
  }

  // Helper for testing
  reset(): void {
    this.modifiers.clear()
    this.scopeModifiers.clear()
  }
}
