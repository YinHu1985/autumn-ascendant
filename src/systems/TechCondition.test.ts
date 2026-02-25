
import { describe, it, expect, beforeEach } from 'vitest'
import { checkCommandAllowed } from './CommandRules'
import { TechRegistry } from './TechRegistry'
import { GameState } from '../store/gameState'
import { Technology } from '../types/Technology'

describe('Tech Condition Checks', () => {
  let mockState: GameState
  let techRegistry: TechRegistry

  beforeEach(() => {
    techRegistry = TechRegistry.getInstance()
    // Mock state
    mockState = {
      countries: {
        'C1': {
          id: 'C1',
          researchedTechs: [],
          resources: {
            cash: 100,
            engineering_practice: 100,
            military_practice: 100
          },
          tags: ['player']
        }
      }
    } as unknown as GameState
  })

  it('should prevent research if condition is not met', () => {
    const tech: Technology = {
      id: 'tech_condition_fail',
      name: 'Conditional Tech',
      description: 'Requires specific tag',
      category: 'secret',
      cost: { gold: 10 },
      rewardModifiers: [],
      condition: {
        scope: 'ACTOR',
        path: 'tags',
        op: 'contains',
        value: 'wizard' // C1 does not have this tag
      }
    }
    techRegistry.registerTech(tech)

    const result = checkCommandAllowed(mockState, {
      type: 'RESEARCH_TECH',
      payload: { countryId: 'C1', techId: 'tech_condition_fail' }
    })

    expect(result.allowed).toBe(false)
    expect(result.reasons).toContain('Requirements not met')
  })

  it('should allow research if condition is met', () => {
    const tech: Technology = {
      id: 'tech_condition_pass',
      name: 'Allowed Tech',
      description: 'Requires player tag',
      category: 'secret',
      cost: { gold: 10 },
      rewardModifiers: [],
      condition: {
        scope: 'ACTOR',
        path: 'tags',
        op: 'contains',
        value: 'player' // C1 has this tag
      }
    }
    techRegistry.registerTech(tech)

    const result = checkCommandAllowed(mockState, {
      type: 'RESEARCH_TECH',
      payload: { countryId: 'C1', techId: 'tech_condition_pass' }
    })

    expect(result.allowed).toBe(true)
  })
})
