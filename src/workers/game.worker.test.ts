import { describe, it, expect } from 'vitest'
import type { Settlement } from '../types/Settlement'

async function loadWorker() {
  if (!(globalThis as any).self) {
    ;(globalThis as any).self = {
      postMessage: () => {},
      onmessage: null,
    }
  }
  if (typeof window !== 'undefined') {
    ;(window as any).postMessage = () => {}
  }
  const mod = await import('./game.worker')
  return mod
}

describe('game.worker event integration', () => {
  it('spawns a country via event option effect', async () => {
    const { handleCommand, store } = await loadWorker()

    const settlements: Settlement[] = [
      {
        id: 'S1',
        name: 'Frontier',
        ownerId: null as any,
        position: { x: 0, y: 0 },
        terrain: 'plain',
        connections: [],
        population: { urban: 0, rural: 0 },
        development: { urban: 0, rural: 0 },
        buildings: [],
      },
    ]

    handleCommand({
      type: 'LOAD_MAP',
      payload: {
        settlements,
        countries: [],
        armies: [],
        advisors: [],
      },
    })

    handleCommand({
      type: 'SET_PAUSED',
      payload: false,
    })

    let spawned = false
    let safety = 120
    while (!spawned && safety > 0) {
      const state = store.getState().gameState
      if (state.activeEventId) {
        const currentId = state.activeEventId
        const context = state.activeEventContext
        handleCommand({
          type: 'RESOLVE_EVENT',
          payload: { eventId: currentId, optionIndex: 0 },
        })
        if (currentId === 'evt_new_nation_rise') {
          const after = store.getState().gameState
          const settlement = after.settlements.find(s => s.id === context.settlementId)
          expect(settlement).toBeTruthy()
          const ownerId = settlement?.ownerId
          expect(ownerId).toBeTruthy()
          const country = ownerId ? after.countries[ownerId] : undefined
          expect(country).toBeTruthy()
          expect(country?.capitalId).toBe(context.settlementId)
          spawned = true
        } else {
          handleCommand({
            type: 'SET_PAUSED',
            payload: false,
          })
        }
      } else {
        handleCommand({
          type: 'TICK',
          payload: null,
        })
      }
      safety -= 1
    }

    expect(spawned).toBe(true)
  })
})
