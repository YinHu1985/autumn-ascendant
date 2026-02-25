import { Modifier } from './Modifier'
import { ResourceId, ResourceStockpile } from './Country'

export interface Building {
  id: string
  name: string
  description: string
  cost: Record<string, number>
  modifiers: Modifier[]
  monthlyMaintenance?: number
   urbanConsumption?: number
   ruralConsumption?: number
   inputStockpile?: Partial<ResourceStockpile>
   outputStockpile?: Partial<ResourceStockpile>
   requiredProduct?: ResourceId
}
