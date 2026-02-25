import { describe, it, expect } from 'vitest'
import { getAllResourceIds, getResourcePrice, createEmptyStockpile } from './ResourceLoader'
import resourcesData from '../data/resources.json'

describe('ResourceLoader', () => {
  it('loads all resources from JSON', () => {
    const ids = getAllResourceIds()
    expect(ids.length).toBe(resourcesData.length)
    expect(ids).toContain('grain')
    expect(ids).toContain('gold')
  })

  it('gets correct price for resources', () => {
    const grainPrice = getResourcePrice('grain')
    expect(grainPrice).toBe(1)
    
    const goldPrice = getResourcePrice('gold')
    expect(goldPrice).toBe(20)

    const invalidPrice = getResourcePrice('invalid_resource')
    expect(invalidPrice).toBe(0)
  })

  it('creates empty stockpile with all resources initialized to 0', () => {
    const stockpile = createEmptyStockpile()
    const ids = getAllResourceIds()
    
    ids.forEach(id => {
      expect(stockpile[id]).toBe(0)
    })
    
    expect(Object.keys(stockpile).length).toBe(ids.length)
  })
})
