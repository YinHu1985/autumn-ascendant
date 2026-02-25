import rawResourcesData from '../data/resources.json'
import { RawResource } from '../types/RawData'
import { ResourceStockpile } from '../types/Country'

const RAW_RESOURCES = rawResourcesData as RawResource[]

const resourcesMap = new Map<string, RawResource>()
const resourceIds: string[] = []

RAW_RESOURCES.forEach(r => {
  resourcesMap.set(r.id, r)
  resourceIds.push(r.id)
})

export const getAllResources = (): RawResource[] => {
  return RAW_RESOURCES
}

export const getAllResourceIds = (): string[] => {
  return resourceIds
}

export const getResource = (id: string): RawResource | undefined => {
  return resourcesMap.get(id)
}

export const getResourcePrice = (id: string): number => {
  return resourcesMap.get(id)?.basePrice ?? 0
}

export const createEmptyStockpile = (): ResourceStockpile => {
  const stockpile = {} as ResourceStockpile
  resourceIds.forEach(id => {
    stockpile[id] = 0
  })
  return stockpile
}
