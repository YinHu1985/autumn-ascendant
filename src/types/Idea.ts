import { Modifier } from './Modifier'
import { School } from './Country'

export interface Idea {
  id: string
  name: string
  description: string
  school: School
  cost: number // Tradition cost (specific to the school)
  prerequisites: string[] // List of Idea IDs
  rewardModifiers: Modifier[]
}
