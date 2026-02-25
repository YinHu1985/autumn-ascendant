import { GameState } from '../store/gameState'
import { Condition } from '../systems/ConditionSystem'

export interface EventOption {
  text: string
  effect: (dispatch: any, state: GameState, context?: any) => void
}

export interface GameEvent {
  id: string
  title: string
  description: string
  options: EventOption[]
  triggerCondition?: (state: GameState) => boolean | { triggered: boolean, context: any }
  condition?: Condition
  maxFires?: number
  isRandom?: boolean
  mtth?: number // Mean Time To Happen in days
}
