import { Modifier } from './Modifier'

export type TechCategory = 'production' | 'military' | 'secret'

export interface Technology {
  id: string
  name: string
  description: string
  category: TechCategory
  cost: {
    gold?: number
    food?: number
    metal?: number
    horse?: number
    engineering_practice?: number
    military_practice?: number
  }
  prerequisites: string[] // List of Tech IDs
  rewardModifiers: Modifier[]
}
