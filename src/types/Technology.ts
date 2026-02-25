import { Modifier } from './Modifier'
import { Condition } from '../systems/ConditionSystem'

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
  prerequisites?: never // Removed from interface, use condition instead
  excludes?: never // Removed from interface, use condition instead
  condition?: Condition
  rewardModifiers: Modifier[]
}
