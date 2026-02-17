
import type { ResourceId } from './Country'

export type TerrainType = 'plain' | 'forest' | 'hills' | 'mountains' | 'water' | 'marsh'

export type ConnectionType = 'normal' | 'river' | 'disabled'

export interface Connection {
  targetId: string
  type: ConnectionType
}

export interface Settlement {
  id: string
  name: string
  ownerId: string // Country ID
  position: {
    x: number
    y: number
  }
  terrain: TerrainType
  connections: Connection[]
  
  localProduct?: ResourceId | null
  
  // Economy
  population: {
    urban: number
    rural: number
  }
  development: {
    urban: number
    rural: number
  }
  buildings: string[] // List of Building IDs
}
