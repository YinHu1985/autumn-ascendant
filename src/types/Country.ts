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

// Now dynamic from JSON
export type ResourceId = string

export type ResourceStockpile = Record<string, number>

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
  ideaSlots: (string | null)[]
  unlockedIdeas: string[]
  capitalId: string
}
