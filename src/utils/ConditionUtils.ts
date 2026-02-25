
import { Condition } from '../systems/ConditionSystem'

export function extractTechRequirements(condition: Condition | undefined): string[] {
  if (!condition) return []
  
  if ('AND' in condition) {
    return condition.AND.flatMap(c => extractTechRequirements(c))
  }
  if ('OR' in condition) {
    return condition.OR.flatMap(c => extractTechRequirements(c))
  }
  if ('NOT' in condition) {
    return []
  }
  
  // Check for direct contains check on researchedTechs
  if (condition.path === 'researchedTechs' && condition.op === 'contains') {
    return [String(condition.value)]
  }
  
  return []
}

export function extractTechExcludes(condition: Condition | undefined): string[] {
  if (!condition) return []
  
  if ('AND' in condition) {
    return condition.AND.flatMap(c => extractTechExcludes(c))
  }
  if ('OR' in condition) {
    return condition.OR.flatMap(c => extractTechExcludes(c))
  }
  if ('NOT' in condition) {
    // If NOT (contains), that's an exclude
    // But my factory uses 'not_contains' directly. 
    // If someone uses NOT(contains), we could support that too, but let's stick to 'not_contains' for now as per factory.
    return []
  }
  
  if (condition.path === 'researchedTechs' && condition.op === 'not_contains') {
    return [String(condition.value)]
  }
  
  return []
}

export function extractIdeaRequirements(condition: Condition | undefined): string[] {
  if (!condition) return []
  
  if ('AND' in condition) {
    return condition.AND.flatMap(c => extractIdeaRequirements(c))
  }
  if ('OR' in condition) {
    return condition.OR.flatMap(c => extractIdeaRequirements(c))
  }
  if ('NOT' in condition) {
    return []
  }
  
  if (condition.path === 'adoptedIdeas' && condition.op === 'contains') {
    return [String(condition.value)]
  }
  
  return []
}

export function extractIdeaExcludes(condition: Condition | undefined): string[] {
  if (!condition) return []
  
  if ('AND' in condition) {
    return condition.AND.flatMap(c => extractIdeaExcludes(c))
  }
  if ('OR' in condition) {
    return condition.OR.flatMap(c => extractIdeaExcludes(c))
  }
  if ('NOT' in condition) {
    return []
  }
  
  if (condition.path === 'adoptedIdeas' && condition.op === 'not_contains') {
    return [String(condition.value)]
  }
  
  return []
}
