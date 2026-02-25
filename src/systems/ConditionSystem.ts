
import { GameState } from '../store/gameState'

export type ScopeType = 'ROOT' | 'ACTOR' | 'TARGET' | 'FROM' | 'TEMP'

export type Operator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains'

export interface LeafCondition {
  scope?: ScopeType | string
  path: string
  op: Operator
  value: any
}

export type Condition =
  | { AND: Condition[] }
  | { OR: Condition[] }
  | { NOT: Condition }
  | LeafCondition

export interface ConditionContext {
  ROOT?: GameState
  ACTOR?: any
  TARGET?: any
  FROM?: any
  TEMP?: Record<string, any>
}

// Helper to get value from a path string "a.b.c"
function getValueByPath(obj: any, path: string): any {
  if (obj === null || obj === undefined) return undefined
  
  const parts = path.split('.')
  let current = obj
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  
  return current
}

function resolveValue(context: ConditionContext, scope: string, path: string): any {
  let targetObj: any

  switch (scope) {
    case 'ROOT':
      targetObj = context.ROOT
      break
    case 'ACTOR':
      targetObj = context.ACTOR
      break
    case 'TARGET':
      targetObj = context.TARGET
      break
    case 'FROM':
      targetObj = context.FROM
      break
    case 'TEMP':
      targetObj = context.TEMP
      break
    default:
      targetObj = undefined
  }

  return getValueByPath(targetObj, path)
}

function compare(actual: any, op: Operator, expected: any): boolean {
  switch (op) {
    case 'eq':
      return actual === expected
    case 'neq':
      return actual !== expected
    case 'gt':
      return typeof actual === 'number' && actual > expected
    case 'gte':
      return typeof actual === 'number' && actual >= expected
    case 'lt':
      return typeof actual === 'number' && actual < expected
    case 'lte':
      return typeof actual === 'number' && actual <= expected
    case 'contains':
      return Array.isArray(actual) && actual.includes(expected)
    case 'not_contains':
      return Array.isArray(actual) && !actual.includes(expected)
    default:
      return false
  }
}

export class ConditionSystem {
  static checkCondition(condition: Condition, context: ConditionContext): boolean {
    // Handle AND
    if ('AND' in condition) {
      return condition.AND.every(sub => this.checkCondition(sub, context))
    }

    // Handle OR
    if ('OR' in condition) {
      return condition.OR.some(sub => this.checkCondition(sub, context))
    }

    // Handle NOT
    if ('NOT' in condition) {
      return !this.checkCondition(condition.NOT, context)
    }

    // Handle Leaf
    // Default scope is ROOT if not specified
    const scope = condition.scope || 'ROOT'
    const actualValue = resolveValue(context, scope, condition.path)
    
    return compare(actualValue, condition.op, condition.value)
  }

  static dependsOn(condition: Condition | undefined, path: string, value: any, scope: string = 'ACTOR'): boolean {
    if (!condition) return false

    // Handle AND
    if ('AND' in condition) {
      return condition.AND.some(sub => this.dependsOn(sub, path, value, scope))
    }

    // Handle OR
    if ('OR' in condition) {
      return condition.OR.some(sub => this.dependsOn(sub, path, value, scope))
    }

    // Handle NOT
    if ('NOT' in condition) {
      // If NOT(not_contains X), it means contains X.
      const sub = condition.NOT
      if ('path' in sub && sub.path === path && sub.value === value && (sub.scope || 'ROOT') === scope) {
         if (sub.op === 'not_contains') return true
      }
      return false
    }

    // Handle Leaf
    if ('path' in condition && condition.path === path && condition.value === value) {
      const condScope = condition.scope || 'ROOT'
      if (condScope === scope) {
        if (condition.op === 'contains') return true
        if (condition.op === 'eq') return true
      }
    }
    
    return false
  }
}
