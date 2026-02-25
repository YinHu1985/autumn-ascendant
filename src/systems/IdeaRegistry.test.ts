
import { describe, it, expect } from 'vitest'
import { IdeaRegistry } from './IdeaRegistry'
import { Idea } from '../types/Idea'

describe('IdeaRegistry', () => {
  it('should load core ideas', () => {
    const registry = IdeaRegistry.getInstance()
    const ideas = registry.getAllIdeas()
    expect(ideas.length).toBeGreaterThan(0)
  })

  it('should retrieve idea by id', () => {
    const registry = IdeaRegistry.getInstance()
    const ideas = registry.getAllIdeas()
    const firstIdea = ideas[0]
    const retrieved = registry.getIdea(firstIdea.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(firstIdea.id)
  })

  it('should have condition generated for ideas with prereqs', () => {
    const registry = IdeaRegistry.getInstance()
    // 'idea_yi' is known to have 'idea_ren' as prereq
    const ideaWithPrereqs = registry.getIdea('idea_yi')
    
    if (ideaWithPrereqs) {
      expect(ideaWithPrereqs.condition).toBeDefined()
      // Basic check that condition structure is likely correct (contains ACTOR/adoptedIdeas)
      const cond = ideaWithPrereqs.condition as any
      // It might be a LeafCondition or { AND: [] }
      const isValidStructure = cond.scope === 'ACTOR' || (cond.AND && cond.AND.length > 0)
      expect(isValidStructure).toBe(true)
    }
  })
})
