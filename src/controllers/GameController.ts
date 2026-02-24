import GameWorker from '../workers/game.worker?worker'
import type { Command } from '../types/Command'
import { store } from '../store'
import { syncState } from '../store/gameState'

class GameController {
  private worker: Worker
  private static instance: GameController
  private speed: number = 1
  private lastTickTime: number = performance.now()
  private tickInFlight: boolean = false
  private schedulerId: number | null = null

  private constructor() {
    this.worker = new GameWorker()
    this.worker.onmessage = (e) => {
      const { type, payload } = e.data
      if (type === 'STATE_UPDATE') {
        store.dispatch(syncState(payload))
        this.tickInFlight = false
        this.lastTickTime = performance.now()
      }
    }

    this.startScheduler()
  }

  static getInstance() {
    if (!GameController.instance) {
      GameController.instance = new GameController()
    }
    return GameController.instance
  }

  sendCommand(command: Command) {
    this.worker.postMessage(command)
  }

  private startScheduler() {
    if (this.schedulerId !== null) return
    const baseMs = 200
    this.schedulerId = window.setInterval(() => {
      const state = store.getState().gameState
      if (state.paused) return
      if (this.tickInFlight) return

      const now = performance.now()
      const targetInterval = baseMs / this.speed
      if (now - this.lastTickTime >= targetInterval) {
        this.tickInFlight = true
        this.sendCommand({ type: 'TICK', payload: null as any })
      }
    }, 16)
  }

  // Helpers
  moveArmy(armyId: string, targetSettlementId: string) {
    this.sendCommand({ type: 'MOVE_ARMY', payload: { armyId, targetSettlementId } })
  }

  fastRecoverArmy(armyId: string) {
    this.sendCommand({ type: 'FAST_RECOVER_ARMY', payload: { armyId } })
  }

  setTroopPosition(armyId: string, troopId: string, position: { row: 0 | 1, col: 0 | 1 | 2 }) {
    this.sendCommand({ type: 'SET_TROOP_POSITION', payload: { armyId, troopId, position } })
  }

  changeTroopType(armyId: string, troopId: string, newType: 'Infantry' | 'Archer' | 'Cavalry' | 'Chariot') {
    this.sendCommand({ type: 'CHANGE_TROOP_TYPE', payload: { armyId, troopId, newType } })
  }

  swapTroopPosition(
    armyId: string,
    sourceTroopId: string,
    target: { row: 0 | 1, col: 0 | 1 | 2 }
  ) {
    this.sendCommand({
      type: 'SWAP_TROOP_POSITION',
      payload: { armyId, sourceTroopId, target },
    })
  }

  setPaused(paused: boolean) {
    this.sendCommand({ type: 'SET_PAUSED', payload: paused })
  }

  setGameSpeed(speed: number) {
    if (speed <= 0) return
    this.speed = speed
  }

  researchTech(countryId: string, techId: string) {
    this.sendCommand({ type: 'RESEARCH_TECH', payload: { countryId, techId } })
  }

  adoptIdea(countryId: string, ideaId: string) {
    this.sendCommand({ type: 'ADOPT_IDEA', payload: { countryId, ideaId } })
  }

  unlockIdeaSlot(countryId: string) {
    this.sendCommand({ type: 'UNLOCK_IDEA_SLOT', payload: { countryId } })
  }

  equipIdeaSlot(countryId: string, slotIndex: number, ideaId: string) {
    this.sendCommand({ type: 'EQUIP_IDEA_SLOT', payload: { countryId, slotIndex, ideaId } })
  }

  unequipIdeaSlot(countryId: string, slotIndex: number) {
    this.sendCommand({ type: 'UNEQUIP_IDEA_SLOT', payload: { countryId, slotIndex } })
  }

  constructBuilding(settlementId: string, buildingId: string) {
    this.sendCommand({ type: 'CONSTRUCT_BUILDING', payload: { settlementId, buildingId } })
  }

  tradeResource(countryId: string, resourceId: string, quantity: number) {
    this.sendCommand({ type: 'TRADE_RESOURCE', payload: { countryId, resourceId, quantity } })
  }

  resolveEvent(eventId: string, optionIndex: number) {
    this.sendCommand({ type: 'RESOLVE_EVENT', payload: { eventId, optionIndex } })
  }
  
  loadMap(settlements: any[], countries: any[], armies: any[], advisors: any[]) {
      this.sendCommand({ type: 'LOAD_MAP', payload: { settlements, countries, armies, advisors } })
  }

  battleAction(actionType: 'ATTACK' | 'DEFEND', targetTroopId?: string) {
    this.sendCommand({ type: 'BATTLE_ACTION', payload: { actionType, targetTroopId } })
  }

  closeBattle() {
    this.sendCommand({ type: 'CLOSE_BATTLE', payload: null })
  }

  initiateAttack(targetSettlementId: string) {
      this.sendCommand({ type: 'INITIATE_ATTACK', payload: targetSettlementId })
  }

  retreatBattle() {
      this.sendCommand({ type: 'RETREAT_BATTLE', payload: null })
  }

  hireAdvisor(advisorId: string) {
      this.sendCommand({ type: 'HIRE_ADVISOR', payload: advisorId })
  }

  fireAdvisor(advisorId: string) {
      this.sendCommand({ type: 'FIRE_ADVISOR', payload: advisorId })
  }
}

export default GameController
