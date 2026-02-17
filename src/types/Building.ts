import { Modifier } from './Modifier'
import { ResourceId, ResourceStockpile } from './Country'

export interface Building {
  id: string
  name: string
  description: string
  cost: {
    gold?: number
    food?: number
    metal?: number
    horse?: number
  }
  modifiers: Modifier[]
   monthlyMaintenance?: number
   urbanConsumption?: number
   ruralConsumption?: number
   inputStockpile?: Partial<ResourceStockpile>
   outputStockpile?: Partial<ResourceStockpile>
   requiredProduct?: ResourceId
}
