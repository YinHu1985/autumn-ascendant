import { Building } from '../types/Building'
import { RawBuilding } from '../types/RawData'
import rawBuildingsData from '../data/buildings.json'

const RAW_BUILDINGS = rawBuildingsData as RawBuilding[]

export const buildings: Building[] = RAW_BUILDINGS.map(raw => ({
  id: raw.id,
  name: raw.name,
  description: raw.description || '',
  cost: raw.cost,
  modifiers: raw.modifiers || [],
  monthlyMaintenance: raw.monthlyMaintenance,
  inputStockpile: raw.inputStockpile,
  outputStockpile: raw.outputStockpile,
  requiredProduct: raw.requiredProduct as any
}))
