import { Modifier } from './Modifier'
import { School } from './Country'

import { Condition } from '../systems/ConditionSystem'

export interface Idea {
  id: string
  name: string
  description: string
  school: School
  cost: number // Tradition cost (specific to the school)
  prerequisites?: never // Removed from interface, use condition instead
  excludes?: never // Removed from interface, use condition instead
  condition?: Condition
  rewardModifiers: Modifier[]
}
