import { Settlement } from '../types/Settlement'

const MAX_COORD = 1000

function randInt(max: number) {
  return Math.floor(Math.random() * (max + 1))
}

function distance2(a: Settlement, b: Settlement) {
  const dx = a.position.x - b.position.x
  const dy = a.position.y - b.position.y
  return dx * dx + dy * dy
}

export function calculateDistance(p1: {x: number, y: number}, p2: {x: number, y: number}) {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

function connect(a: Settlement, b: Settlement) {
  if (!a.connections.some(c => c.targetId === b.id)) {
    a.connections.push({ targetId: b.id, type: 'normal' })
  }
  if (!b.connections.some(c => c.targetId === a.id)) {
    b.connections.push({ targetId: a.id, type: 'normal' })
  }
}

export function generateMap(count: number): Settlement[] {
  if (count <= 0) return []
  const settlements: Settlement[] = Array.from({ length: count }, (_, i) => ({
    id: `settlement-${i + 1}`,
    name: `Settlement ${i + 1}`,
    ownerId: '',
    position: { x: randInt(MAX_COORD), y: randInt(MAX_COORD) },
    terrain: 'plain',
    connections: [],
    population: {
      urban: 1000 + randInt(2000),
      rural: 5000 + randInt(5000),
    },
    development: {
      urban: 1 + randInt(5),
      rural: 1 + randInt(5),
    },
    buildings: [],
  }))

  // Helper to get distance squared
  const distSq = (idxA: number, idxB: number) => {
    return distance2(settlements[idxA], settlements[idxB])
  }

  const inTree = new Set<number>()
  
  // Start with node 0
  inTree.add(0)
  
  // Potential edges from the tree to outside
  // We can just iterate to find the min edge from InTree to OutTree
  // (Simple implementation for N < ~500)
  while (inTree.size < count) {
    let minDist = Infinity
    let bestFrom = -1
    let bestTo = -1
    
    for (const i of inTree) {
      for (let j = 0; j < count; j++) {
        if (!inTree.has(j)) {
          const d = distSq(i, j)
          if (d < minDist) {
            minDist = d
            bestFrom = i
            bestTo = j
          }
        }
      }
    }
    
    if (bestTo !== -1) {
      connect(settlements[bestFrom], settlements[bestTo])
      inTree.add(bestTo)
    } else {
      break // Should not happen
    }
  }

  // 2. Ensure min 2 neighbors per node
  // Add extra edges to closest neighbors that aren't already connected
  for (let i = 0; i < count; i++) {
    const current = settlements[i]
    if (current.connections.length >= 2) continue

    const sortedNeighbors = settlements
      .map((s, idx) => ({ s, idx, d2: distance2(current, s) }))
      .filter(item => item.idx !== i && !current.connections.some(c => c.targetId === item.s.id))
      .sort((a, b) => a.d2 - b.d2)

    for (const { s } of sortedNeighbors) {
      if (current.connections.length >= 2) break
      connect(current, s)
    }
  }

  return settlements
}
