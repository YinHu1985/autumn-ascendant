export type School =
  | 'confucianism'
  | 'taoism'
  | 'legalism'
  | 'mohism'
  | 'military'
  | 'agricultural'
  | 'diplomacy'
  | 'logicians'
  | 'misc'

export const SCHOOLS: School[] = [
  'confucianism',
  'taoism',
  'legalism',
  'mohism',
  'military',
  'agricultural',
  'diplomacy',
  'logicians',
  'misc',
]

export type ResourceId =
  | 'grain'
  | 'logs'
  | 'cattle'
  | 'fruit'
  | 'fish'
  | 'wool'
  | 'tea'
  | 'hardwood'
  | 'silk'
  | 'gold'
  | 'silver'
  | 'iron'
  | 'copper'
  | 'tin'
  | 'bronze'
  | 'ships'
  | 'textiles'
  | 'furniture'
  | 'luxury_furniture'
  | 'spirits'
  | 'fruit_wine'
  | 'lumber'
  | 'clothes'
  | 'luxury_clothes'
  | 'paper'

export const RESOURCE_IDS: ResourceId[] = [
  'grain',
  'logs',
  'cattle',
  'fruit',
  'fish',
  'wool',
  'tea',
  'hardwood',
  'silk',
  'gold',
  'silver',
  'iron',
  'copper',
  'tin',
  'bronze',
  'ships',
  'textiles',
  'furniture',
  'luxury_furniture',
  'spirits',
  'fruit_wine',
  'lumber',
  'clothes',
  'luxury_clothes',
  'paper',
]

export type ResourceStockpile = Record<ResourceId, number>

export const RESOURCE_BASE_PRICE: Record<ResourceId, number> = {
  grain: 1,
  logs: 2,
  cattle: 4,
  fruit: 2,
  fish: 2,
  wool: 3,
  tea: 6,
  hardwood: 5,
  silk: 12,
  gold: 20,
  silver: 10,
  iron: 4,
  copper: 3,
  tin: 2,
  bronze: 5,
  ships: 50,
  textiles: 6,
  furniture: 8,
  luxury_furniture: 15,
  spirits: 5,
  fruit_wine: 4,
  lumber: 4,
  clothes: 6,
  luxury_clothes: 12,
  paper: 3,
}

export const createEmptyStockpile = (): ResourceStockpile => {
  const stockpile = {} as ResourceStockpile
  RESOURCE_IDS.forEach(id => {
    stockpile[id] = 0
  })
  return stockpile
}

export interface Resources {
  cash: number
  engineering_practice: number
  military_practice: number
  tradition: Record<School, number>
  stockpile: ResourceStockpile
}

export interface Country {
  id: string
  name: string
  color: string
  resources: Resources
  researchedTechs: string[]
  adoptedIdeas: string[]
  capitalId: string
}
