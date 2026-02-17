export type CommandType =
  | "TICK"
  | "MOVE_ARMY"
  | "RESEARCH_TECH"
  | "ADOPT_IDEA"
  | "CONSTRUCT_BUILDING"
  | "SET_PAUSED"
  | "SET_GAME_SPEED"
  | "RESOLVE_EVENT"
  | "START_GAME"
  | "LOAD_MAP"
  | "BATTLE_ACTION"
  | "CLOSE_BATTLE"
  | "INITIATE_ATTACK"
  | "RETREAT_BATTLE"
  | "HIRE_ADVISOR"
  | "FIRE_ADVISOR"
  | "SPAWN_COUNTRY"
  | "TRADE_RESOURCE"
  | "FAST_RECOVER_ARMY"
  | "SET_TROOP_POSITION"
  | "CHANGE_TROOP_TYPE"
  | "SWAP_TROOP_POSITION"

export interface Command {
  type: CommandType
  payload: any
}
