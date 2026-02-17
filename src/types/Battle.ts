export type TroopType = "Infantry" | "Archer" | "Cavalry" | "Chariot"

export interface TroopStats {
  hp: number
  maxHp: number
  morale: number
  attack: number
  defense: number
}

export interface TroopPosition {
  row: 0 | 1 // 0=Front, 1=Back
  col: 0 | 1 | 2 // Left, Center, Right
}

export interface Troop {
  id: string
  type: TroopType
  stats: TroopStats
  position: TroopPosition
}

export interface BattleState {
  id: string
  attackerId: string // Army ID
  defenderId: string // Army ID
  attackerTroops: Troop[]
  defenderTroops: Troop[]
  turn: "ATTACKER" | "DEFENDER" // Kept for legacy/display, but logic uses queue
  actionQueue: string[] // List of Troop IDs in order for this round
  currentActionIndex: number
  round: number
  log: string[]
  winner?: "ATTACKER" | "DEFENDER" | null
}
