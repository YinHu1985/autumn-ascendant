import { describe, it, expect } from 'vitest'
import { generateInitialAdvisors } from './AdvisorLoader'

describe('AdvisorLoader', () => {
  it('generates advisors with correct properties', () => {
    const settlementIds = ['S1', 'S2']
    const advisors = generateInitialAdvisors(settlementIds)
    
    expect(advisors.length).toBeGreaterThan(0)
    
    const first = advisors[0]
    expect(first.id).toBeTruthy()
    expect(first.name).toBeTruthy()
    expect(first.level).toBeGreaterThanOrEqual(1)
    expect(first.level).toBeLessThanOrEqual(5)
    expect(first.specialAbilities).toBeInstanceOf(Array)
    
    // Check if location is assigned (since settlementIds are provided)
    expect(settlementIds).toContain(first.location)
  })

  it('generates advisors without location if no settlements provided', () => {
    const advisors = generateInitialAdvisors([])
    expect(advisors.length).toBeGreaterThan(0)
    expect(advisors[0].location).toBeNull()
  })
})
