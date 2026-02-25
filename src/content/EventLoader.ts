import { GameEvent, EventOption } from '../types/GameEvent'
import { RawEvent, RawEventOption } from '../types/RawData'
import rawEvents from '../data/events.json'
import { GameState } from '../store/gameState'

const createEventEffect = (command: { type: string, payload: any }) => {
  return (dispatch: any, state: GameState, context?: any) => {
    // Dispatch the command
    // We assume dispatch handles the command structure { type, payload }
    // But in our system, dispatch usually takes an action object.
    // If we are using Redux, dispatch takes { type: string, payload: any }
    // If we are using the worker system, we might need to send a command.
    
    // However, the `effect` function signature in `GameEvent` is `(dispatch: any, state: GameState, context?: any) => void`.
    // In `GameController.tsx` or similar, we likely pass the redux dispatch or a custom dispatcher.
    // Let's assume standard redux dispatch for now, or a command handler.
    
    // If the command type matches our internal command types (e.g. SPAWN_COUNTRY), 
    // we might need a way to handle it.
    
    // For now, let's just dispatch the object directly.
    dispatch({ type: command.type, payload: command.payload })
  }
}

const createEventOption = (raw: RawEventOption): EventOption => {
  return {
    text: raw.text,
    effect: raw.effectCommand ? createEventEffect(raw.effectCommand) : () => {}
  }
}

const createEvent = (raw: RawEvent): GameEvent => {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    options: raw.options.map(createEventOption),
    condition: raw.condition,
    maxFires: raw.maxFires,
    // triggerCondition is optional and we use condition for JSON events
  }
}

export const coreEvents: GameEvent[] = (rawEvents as RawEvent[]).map(createEvent)
