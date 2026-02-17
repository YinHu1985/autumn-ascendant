import { configureStore } from '@reduxjs/toolkit'
import { gameStateReducer, tick, moveArmy, researchTech, adoptIdea, constructBuilding, setPaused, setSettlements, setCountries, addCountry, setArmies, setAdvisors, updateAdvisor, setActiveEvent, setBattle, updateBattle, resolveEvent, tradeResource, updateSettlement } from '../store/gameState'
import type { Command } from '../types/Command'
import { EventManager, registerCoreEvents } from '../systems/EventManager'
import { resolveTurn, initializeBattle, getBestTarget, generateTroopsForArmy, getDefaultTroopStatsForType } from '../systems/BattleSystem'
import { Army } from '../types/Army'
import { TAGS, COUNTRY_NAMES, COUNTRY_COLORS, CountryTag } from '../data/CountryTags'
import { SCHOOLS, School, createEmptyStockpile, ResourceId } from '../types/Country'
import type { Settlement, TerrainType } from '../types/Settlement'

const inferLocalProduct = (terrain: TerrainType): ResourceId | null => {
  switch (terrain) {
    case 'forest':
      return 'logs'
    case 'plain':
      return 'grain'
    case 'hills':
      return 'wool'
    case 'mountains':
      return 'iron'
    case 'water':
    case 'marsh':
      return 'fish'
    default:
      return null
  }
}

// 1. Setup Store
const store = configureStore({
  reducer: {
    gameState: gameStateReducer,
  },
})

// Subscribe to store updates and post to main thread
store.subscribe(() => {
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: store.getState().gameState
  })
})

// Initialize Systems
registerCoreEvents()

// 2. Tick processing is now driven by TICK commands from the main thread

// Refactored message handler to allow internal calling
const handleCommand = (command: Command) => {
    const { type, payload } = command
    
    if (type !== 'TICK') {
        console.log(`[Worker] Handling command: ${type}`)
    }

    switch (type) {
      case 'TICK':
        store.dispatch(tick())
        break
      case 'MOVE_ARMY':
        store.dispatch(moveArmy(payload))
        break
      case 'RESEARCH_TECH':
        store.dispatch(researchTech(payload))
        break
      case 'ADOPT_IDEA':
        store.dispatch(adoptIdea(payload))
        break
      case 'CONSTRUCT_BUILDING':
        store.dispatch(constructBuilding(payload))
        break
      case 'TRADE_RESOURCE':
        store.dispatch(tradeResource(payload))
        break
      case 'SET_PAUSED':
        store.dispatch(setPaused(payload))
        break
      case 'RESOLVE_EVENT':
        // Payload: { eventId, optionIndex }
        const { eventId, optionIndex } = payload
        const event = EventManager.getInstance().getEventById(eventId)
        if (event && event.options[optionIndex]) {
            console.log(`[Worker] Executing effect for event ${eventId}, option ${optionIndex}`)
            // Execute effect
            const currentState = store.getState().gameState
            // Wrap the dispatch to handle worker-specific commands
            const workerDispatch = (action: any) => {
                console.log(`[Worker] Effect dispatched action:`, action)
                // If it's a SPAWN_COUNTRY action (which is a command, not a Redux action yet), handle it directly
                if (action.type === 'SPAWN_COUNTRY') {
                     console.log(`[Worker] Direct handling of SPAWN_COUNTRY`)
                     // Directly call handleCommand instead of postMessage to avoid loopback issues
                     handleCommand(action)
                } else {
                    // Standard Redux action
                    store.dispatch(action)
                }
            }
            event.options[optionIndex].effect(workerDispatch, currentState, currentState.activeEventContext)
        }
        store.dispatch(resolveEvent())
        break
    case 'START_GAME':
      // Initialize game data if needed
      break
    case 'LOAD_MAP':
      if (payload.settlements) {
        const settlementsWithProduct: Settlement[] = payload.settlements.map((s: Settlement) => ({
          ...s,
          localProduct:
            typeof s.localProduct !== 'undefined' ? s.localProduct : inferLocalProduct(s.terrain),
        }))
        store.dispatch(setSettlements(settlementsWithProduct))
      }
      if (payload.countries) store.dispatch(setCountries(payload.countries))
      if (payload.armies) {
        const armiesInput = payload.armies as Army[] | Record<string, Army>
        let armiesWithTroops: Army[]
        if (Array.isArray(armiesInput)) {
          armiesWithTroops = armiesInput.map(a => ({
            ...a,
            troops: a.troops && a.troops.length > 0 ? a.troops : generateTroopsForArmy(a, false),
          }))
        } else {
          armiesWithTroops = Object.values(armiesInput).map(a => ({
            ...a,
            troops: a.troops && a.troops.length > 0 ? a.troops : generateTroopsForArmy(a, false),
          }))
        }
        store.dispatch(setArmies(armiesWithTroops))
      }
      if (payload.advisors) store.dispatch(setAdvisors(payload.advisors))
      break
    case 'FAST_RECOVER_ARMY': {
        const { armyId } = payload
        const state = store.getState().gameState
        const army = state.armies[armyId]
        if (!army) break

        const country = state.countries[army.ownerId]
        if (!country) break

        let totalMissingHp = 0
        for (const troop of army.troops || []) {
          totalMissingHp += Math.max(0, (troop.stats.maxHp || 0) - (troop.stats.hp || 0))
        }

        if (totalMissingHp <= 0) break

        const costPerHp = 0.5
        const cost = Math.ceil(totalMissingHp * costPerHp)
        if (country.resources.cash < cost) {
          console.warn('Not enough cash to fast recover army')
          break
        }

        const updatedArmy = {
          ...army,
          troops: (army.troops || []).map(t => ({
            ...t,
            stats: {
              ...t.stats,
              hp: t.stats.maxHp
            }
          })),
        }

        const updatedCountry = {
          ...country,
          resources: {
            ...country.resources,
            cash: country.resources.cash - cost,
          },
        }

        store.dispatch(setArmies([updatedArmy]))
        store.dispatch(setCountries([updatedCountry]))
        break
      }
    case 'SET_TROOP_POSITION': {
        const { armyId, troopId, position } = payload
        const state = store.getState().gameState
        const army = state.armies[armyId]
        if (!army) break

        const updatedArmy = {
          ...army,
          troops: (army.troops || []).map(t =>
            t.id === troopId
              ? { ...t, position: { row: position.row, col: position.col } }
              : t
          ),
        }

        store.dispatch(setArmies([updatedArmy]))
        break
      }
    case 'SWAP_TROOP_POSITION': {
        const { armyId, sourceTroopId, target } = payload
        const state = store.getState().gameState
        const army = state.armies[armyId]
        if (!army) break

        const troops = army.troops || []
        const sourceTroop = troops.find(t => t.id === sourceTroopId)
        if (!sourceTroop) break

        const oldPos = { ...sourceTroop.position }
        const targetTroop = troops.find(
          t => t.position.row === target.row && t.position.col === target.col
        )

        const updatedArmy: Army = {
          ...army,
          troops: troops.map(t => {
            if (t.id === sourceTroopId) {
              return {
                ...t,
                position: { row: target.row, col: target.col },
              }
            }
            if (targetTroop && t.id === targetTroop.id) {
              return {
                ...t,
                position: { row: oldPos.row, col: oldPos.col },
              }
            }
            return t
          }),
        }

        store.dispatch(setArmies([updatedArmy]))
        break
      }
    case 'CHANGE_TROOP_TYPE': {
        const { armyId, troopId, newType } = payload
        const state = store.getState().gameState
        const army = state.armies[armyId]
        if (!army) break

        const country = state.countries[army.ownerId]
        if (!country) break

        const typeChangeCost = 10
        if (country.resources.cash < typeChangeCost) {
          console.warn('Not enough cash to change troop type')
          break
        }

        const updatedArmy = {
          ...army,
          troops: (army.troops || []).map(t =>
            t.id === troopId
              ? {
                  ...t,
                  type: newType,
                  stats: getDefaultTroopStatsForType(newType, false),
                }
              : t
          ),
        }

        const updatedCountry = {
          ...country,
          resources: {
            ...country.resources,
            cash: country.resources.cash - typeChangeCost,
          },
        }

        store.dispatch(setArmies([updatedArmy]))
        store.dispatch(setCountries([updatedCountry]))
        break
      }
    case 'INITIATE_ATTACK':
        // Payload: targetSettlementId
        const targetSettlementId = payload
        const state = store.getState().gameState
        const playerCountryId = state.playerCountryId
        
        // 1. Validate Attack Target (Must be connected to player territory)
        const targetSettlementForAttack = state.settlements.find(s => s.id === targetSettlementId)
        if (!targetSettlementForAttack) break
        
        const isConnected = state.settlements.some(s => 
            s.ownerId === playerCountryId && 
            (targetSettlementForAttack.connections.some(c => c.targetId === s.id) || s.connections.some(c => c.targetId === targetSettlementForAttack.id))
        )
        
        if (!isConnected) {
            console.warn('Target not connected to player territory')
            break
        }

        // 2. Identify Player Capital & Main Army
        const playerCountry = state.countries[playerCountryId]
        const playerSettlements = state.settlements.filter(s => s.ownerId === playerCountryId)
        
        if (playerSettlements.length === 0) {
            console.warn('Player has no settlements!')
            break
        }

        let capitalId = playerCountry?.capitalId
        // Fallback if capitalId not set
        if (!capitalId || !playerSettlements.some(s => s.id === capitalId)) {
            capitalId = playerSettlements[0].id
        }

        // Find existing army at capital (or any player army if we assume 1 army per country logic for now)
        let attackerArmy = Object.values(state.armies).find(a => 
            a.ownerId === playerCountryId && 
            a.location === capitalId
        )
        
        if (!attackerArmy) {
            // Check if player has ANY army, if so, move it to capital (enforce rule)
            attackerArmy = Object.values(state.armies).find(a => a.ownerId === playerCountryId)
            
            if (attackerArmy) {
                // Reset to capital
                attackerArmy = { ...attackerArmy, location: capitalId, state: 'IDLE' }
            } else {
                // Create new Main Army
                const newArmyId = `army_${playerCountryId}_main`
                attackerArmy = {
                    id: newArmyId,
                    ownerId: playerCountryId,
                    location: capitalId,
                    state: 'IDLE',
                    name: 'Royal Army',
                    destination: null,
                    arrivalDate: null,
                    troops: [] // Will be populated by initializeBattle or generate here
                }
                // Generate initial troops for the main army
                attackerArmy.troops = generateTroopsForArmy(attackerArmy, false)
            }
        }
        
        // 3. Teleport to Target
        // We create a copy for the battle state, but also update the actual army in state?
        // User said "teleport to destination and teleport back".
        // So we update the army in the global state to be at the target location.
        attackerArmy = { 
            ...attackerArmy, 
            location: targetSettlementId, 
            state: 'BATTLE' 
        }

        // 4. Create Defender Army (Temporary)
        const defenderOwnerId = targetSettlementForAttack.ownerId || 'REBELS'
        const defenderId = `army_defend_${targetSettlementId}_${Date.now()}`
        const defenderArmy: Army = {
            id: defenderId,
            ownerId: defenderOwnerId,
            location: targetSettlementId,
            state: 'BATTLE',
            name: targetSettlementForAttack.ownerId ? 'Garrison' : 'Local Militia',
            destination: null,
            arrivalDate: null,
            troops: []
        }
        // Generate troops for defender
        defenderArmy.troops = generateTroopsForArmy(defenderArmy, true)

        // 5. Initialize Battle
        const battle = initializeBattle(attackerArmy, defenderArmy, true)

        // 6. Update State
        store.dispatch(setArmies([attackerArmy, defenderArmy]))
        store.dispatch(setBattle(battle))
        store.dispatch(setPaused(true))
        break

    case 'BATTLE_ACTION':
      // Payload: { actionType, targetTroopId }
      let battleState = store.getState().gameState.activeBattle
      if (battleState) {
          // 1. Resolve User Action
          let nextState = resolveTurn(battleState, payload.actionType, payload.targetTroopId)
          store.dispatch(updateBattle(nextState))
          battleState = nextState // Update local reference

          // 2. Loop AI Turns if needed
          while (!battleState.winner) {
              const currentActorId = battleState.actionQueue[battleState.currentActionIndex]
              if (!currentActorId) break // End of queue or round transition

              // Check if current actor is AI (Defender)
              // We assume Player is always Attacker for now, or check ownership.
              // Logic: If actor is in defenderTroops, it's AI.
              const isAiActor = battleState.defenderTroops.some(t => t.id === currentActorId)
              
              if (!isAiActor) {
                  break // It's player's turn, wait for input
              }

              // AI Logic
              const actor = battleState.defenderTroops.find(t => t.id === currentActorId)
              if (actor) {
                  const targetId = getBestTarget(actor, battleState.attackerTroops)
                  if (targetId) {
                      nextState = resolveTurn(battleState, 'ATTACK', targetId)
                  } else {
                       nextState = resolveTurn(battleState, 'DEFEND')
                  }
                  store.dispatch(updateBattle(nextState))
                  battleState = nextState
              } else {
                  // Should have been skipped by resolveTurn logic if dead, but safety break
                  break
              }
          }
          
          if (battleState.winner) {
              // Handle Victory - Conquest
              if (battleState.winner === 'ATTACKER') {
                  const attackerId = battleState.attackerId
                  const attackerArmy = store.getState().gameState.armies[attackerId]
                  if (attackerArmy && attackerArmy.location) {
                      const settlement = store.getState().gameState.settlements.find(s => s.id === attackerArmy.location)
                      if (settlement && settlement.ownerId !== attackerArmy.ownerId) {
                          // Conquest!
                          const updatedSettlement = { ...settlement, ownerId: attackerArmy.ownerId }
                          store.dispatch(updateSettlement(updatedSettlement))
                      }
                  }
              }
          }
      }
      break
    case 'CLOSE_BATTLE':
      const endingBattle = store.getState().gameState.activeBattle
      if (endingBattle) {
          const { attackerId, defenderId } = endingBattle
          const state = store.getState().gameState
          const updates: Army[] = []

          // Handle Attacker (Player)
          const attackerArmy = state.armies[attackerId]
          if (attackerArmy) {
              const country = state.countries[attackerArmy.ownerId]
              let capitalId: string | undefined = country?.capitalId
              if (!capitalId) {
                   const s = state.settlements.find(s => s.ownerId === attackerArmy.ownerId)
                   capitalId = s?.id
              }

              if (capitalId) {
                  // Teleport back to capital
                  updates.push({
                      ...attackerArmy,
                      location: capitalId,
                      state: 'IDLE',
                      troops: endingBattle.attackerTroops // Persist battle damage
                  })
              }
          }
          
          // Handle Defender (update status/troops)
          const defenderArmy = state.armies[defenderId]
          if (defenderArmy) {
               updates.push({ 
                   ...defenderArmy, 
                   state: 'IDLE',
                   troops: endingBattle.defenderTroops
               })
          }
          
          if (updates.length > 0) {
              store.dispatch(setArmies(updates))
          }
      }

      store.dispatch(setBattle(null))
      store.dispatch(setPaused(false))
      // Advance 1 day to represent battle duration
      store.dispatch(tick())
      break
    case 'RETREAT_BATTLE':
        const currentBattle = store.getState().gameState.activeBattle
        if (currentBattle && !currentBattle.winner) {
            // Deep clone to avoid mutating frozen state
            const updatedBattle = JSON.parse(JSON.stringify(currentBattle))
            
            // Assume Player is Attacker for now, or check ID
            // If turn based, whoever retreats loses.
            // Usually the player clicks retreat.
            // Let's assume player is Attacker.
            updatedBattle.winner = 'DEFENDER'
            updatedBattle.log.push('Attacker retreated!')
            
            // Move retreating army to Capital
            const attackerId = updatedBattle.attackerId
            const state = store.getState().gameState
            const attackerArmy = state.armies[attackerId]
            
            if (attackerArmy) {
                const country = state.countries[attackerArmy.ownerId]
                // Find capital
                let capitalId: string | undefined = country?.capitalId
                if (!capitalId) {
                     // Fallback
                     const s = state.settlements.find(s => s.ownerId === attackerArmy.ownerId)
                     capitalId = s?.id
                }

                if (capitalId) {
                     // Update army location/state and TROOPS
                     const updatedArmy: Army = {
                         ...attackerArmy,
                         location: capitalId,
                         state: 'IDLE',
                         troops: updatedBattle.attackerTroops // Persist battle damage
                     }
                     store.dispatch(setArmies([updatedArmy]))
                     updatedBattle.log.push(`Army retreated to Capital`)
                }
            }
            
            store.dispatch(updateBattle(updatedBattle))
        }
        break
    case 'HIRE_ADVISOR':
      const advisorIdToHire = payload
      const stateForHire = store.getState().gameState
      const advisorToHire = stateForHire.advisors.find(a => a.id === advisorIdToHire)
      const playerIdForHire = stateForHire.playerCountryId

      if (advisorToHire && !advisorToHire.ownerId) {
          // Check limit
          const hiredCount = stateForHire.advisors.filter(a => a.ownerId === playerIdForHire).length
          if (hiredCount < 5) {
              store.dispatch(updateAdvisor({ ...advisorToHire, ownerId: playerIdForHire }))
          }
      }
      break
    case 'FIRE_ADVISOR':
      const advisorIdToFire = payload
      const stateForFire = store.getState().gameState
      const advisorToFire = stateForFire.advisors.find(a => a.id === advisorIdToFire)
      const playerIdForFire = stateForFire.playerCountryId

      if (advisorToFire && advisorToFire.ownerId === playerIdForFire) {
          store.dispatch(updateAdvisor({ ...advisorToFire, ownerId: null }))
      }
      break
    case 'SPAWN_COUNTRY':
        const { settlementId, tag } = payload
        console.log(`[Worker] SPAWN_COUNTRY command received for ${settlementId}`)
        const currentGameState = store.getState().gameState
        const usedTags = Object.keys(currentGameState.countries)
        
        let newTag = tag
        if (!newTag) {
            const availableTags = TAGS.filter(t => !usedTags.includes(t))
            if (availableTags.length === 0) {
                console.warn('No available tags for new country')
                break
            }
            newTag = availableTags[Math.floor(Math.random() * availableTags.length)]
        } else {
             if (usedTags.includes(newTag)) {
                 console.warn(`Tag ${newTag} is already in use`)
                 break
             }
        }

        const settlementToSpawn = currentGameState.settlements.find(s => s.id === settlementId)
        if (!settlementToSpawn) {
             console.warn(`Settlement ${settlementId} not found`)
             break
        }

        const newCountry = {
            id: newTag,
            name: COUNTRY_NAMES[newTag as keyof typeof COUNTRY_NAMES] || `State of ${newTag}`,
            color: COUNTRY_COLORS[newTag as keyof typeof COUNTRY_COLORS] || '#000000',
            resources: { 
                cash: 100, 
                engineering_practice: 0, 
                military_practice: 0, 
                tradition: SCHOOLS.reduce((acc, s) => ({...acc, [s]: 0}), {} as Record<School, number>),
                stockpile: createEmptyStockpile()
            },
            researchedTechs: [],
            adoptedIdeas: [],
            capitalId: settlementId
        }

        store.dispatch(addCountry(newCountry))
        console.log(`[Worker] Created new country: ${newTag}`)
        
        const updatedSettlement = { ...settlementToSpawn, ownerId: newTag }
        store.dispatch(updateSettlement(updatedSettlement))
        console.log(`[Worker] Updated settlement ${settlementId} owner to ${newTag}`)
        break
    default:
      console.warn('Unknown command:', type)
  }
}

// 3. Handle Messages
self.onmessage = (e: MessageEvent<Command>) => {
  handleCommand(e.data)
}

// 4. Broadcast State Changes
store.subscribe(() => {
  const state = store.getState()
  self.postMessage({ type: 'STATE_UPDATE', payload: state.gameState })
})
