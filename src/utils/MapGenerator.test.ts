import { describe, it, expect } from 'vitest'
import { generateMap } from './MapGenerator'

describe('generateMap', () => {
  it('creates the requested number of settlements', () => {
    const list = generateMap(10)
    expect(list.length).toBe(10)
  })

  it('ensures each settlement has at least two connections', () => {
    const list = generateMap(20)
    for (const s of list) {
      expect(s.connections.length).toBeGreaterThanOrEqual(2)
    }
  })
})

