import { describe, it, expect } from 'vitest'
import { IdeaRegistry } from './IdeaRegistry'
import { TechRegistry } from './TechRegistry'
import { BuildingRegistry } from './BuildingRegistry'

describe('Registry integrity', () => {
  it('IdeaRegistry returns ideas by id and school', () => {
    const registry = IdeaRegistry.getInstance()
    const all = registry.getAllIdeas()
    expect(all.length).toBeGreaterThan(0)

    const first = all[0]
    const byId = registry.getIdea(first.id)
    expect(byId).toBeTruthy()
    expect(byId?.id).toBe(first.id)

    const bySchool = registry.getIdeasBySchool(first.school)
    expect(bySchool.length).toBeGreaterThan(0)
    expect(bySchool.every(i => i.school === first.school)).toBe(true)
  })

  it('TechRegistry can fetch techs by id and category', () => {
    const registry = TechRegistry.getInstance()
    const all = registry.getAllTechs()
    expect(all.length).toBeGreaterThan(0)

    const first = all[0]
    const byId = registry.getTech(first.id)
    expect(byId).toBeTruthy()
    expect(byId?.id).toBe(first.id)

    const byCategory = registry.getTechsByCategory(first.category)
    expect(byCategory.length).toBeGreaterThan(0)
    expect(byCategory.every(t => t.category === first.category)).toBe(true)
  })

  it('BuildingRegistry can fetch buildings by id', () => {
    const registry = BuildingRegistry.getInstance()
    const all = registry.getAllBuildings()
    expect(all.length).toBeGreaterThan(0)

    const first = all[0]
    const byId = registry.getBuilding(first.id)
    expect(byId).toBeTruthy()
    expect(byId?.id).toBe(first.id)
  })
})
