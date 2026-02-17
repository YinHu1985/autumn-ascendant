import { GameState } from '../store/gameState'

export interface EventOption {
  text: string
  effect: (dispatch: any, state: GameState, context?: any) => void
}

export interface GameEvent {
  id: string
  title: string
  description: string
  options: EventOption[]
  triggerCondition: (state: GameState) => boolean | { triggered: boolean, context: any }
  maxFires?: number
}
