import { Troop } from './Battle'

export type ArmyState = 'IDLE' | 'MOVING' | 'SIEGE' | 'BATTLE'

export interface Army {
  id: string
  ownerId: string
  name?: string
  troops: Troop[]
  location: string // Settlement ID
  state: ArmyState
  destination: string | null // Target Settlement ID
  arrivalDate: {
    year: number
    month: number
    day: number
  } | null
}
