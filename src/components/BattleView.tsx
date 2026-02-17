import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveBattle } from '../store/gameState'
import { Troop } from '../types/Battle'
import { LocManager } from '../systems/LocManager'
import GameController from '../controllers/GameController'

export default function BattleView() {
  const battle = useSelector(selectActiveBattle)
  const [selectedTroopId, setSelectedTroopId] = useState<string | null>(null)
  const [lang, setLang] = useState(LocManager.getInstance().getLanguage())

  useEffect(() => {
    return LocManager.getInstance().subscribe(() => {
      setLang(LocManager.getInstance().getLanguage())
    })
  }, [])

  const t = (key: string, params?: any) => LocManager.getInstance().t(key, params)

  // Determine active troop safely (battle might be null)
  const currentActionId = battle?.actionQueue[battle.currentActionIndex]
  const activeTroop = battle ? (battle.attackerTroops.find(t => t.id === currentActionId) || battle.defenderTroops.find(t => t.id === currentActionId)) : undefined
  
  // Is it player's turn? (Assume player is Attacker)
  const isPlayerTurn = activeTroop && battle ? battle.attackerTroops.some(t => t.id === activeTroop.id) : false
  
  // Auto-select active troop if it's player's turn
  useEffect(() => {
      if (battle && isPlayerTurn && activeTroop) {
          setSelectedTroopId(activeTroop.id)
      } else {
          setSelectedTroopId(null)
      }
  }, [battle?.currentActionIndex, isPlayerTurn, activeTroop, battle])

  if (!battle) return null

  const handleTroopClick = (troop: Troop, side: 'friendly' | 'enemy') => {
    if (battle.winner) return
    if (!isPlayerTurn) return

    if (side === 'enemy') {
      // Attacking enemy
      if (activeTroop && activeTroop.stats.hp > 0) {
        GameController.getInstance().battleAction('ATTACK', troop.id)
      }
    }
  }

  const handleDefend = () => {
      if (battle.winner || !isPlayerTurn) return
      GameController.getInstance().battleAction('DEFEND')
  }

  const handleClose = () => {
    GameController.getInstance().closeBattle()
  }

  // Helper to render grid
  const renderGrid = (troops: Troop[], side: 'friendly' | 'enemy') => {
    // New Layout: 3 rows (vertical positions), 2 cols (depth: Back, Front)
    // Attacker: [Back, Front] -> Defender: [Front, Back]
    
    // Create a 3x2 grid
    // grid[row][col] where row is 0-2 (vertical), col is 0-1 (depth)
    const grid = Array(3).fill(null).map(() => Array(2).fill(null))
    
    troops.forEach(t => {
      // t.position.row: 0=Front, 1=Back
      // t.position.col: 0, 1, 2 (Vertical slot)
      
      const verticalSlot = t.position.col // 0, 1, 2
      
      let depthSlot = 0
      if (side === 'friendly') {
          // Attacker: Col 0 = Back (row 1), Col 1 = Front (row 0)
          depthSlot = t.position.row === 0 ? 1 : 0
      } else {
          // Defender: Col 0 = Front (row 0), Col 1 = Back (row 1)
          depthSlot = t.position.row === 0 ? 0 : 1
      }
      
      if (verticalSlot >= 0 && verticalSlot < 3) {
          grid[verticalSlot][depthSlot] = t
      }
    })

    return (
      <div className={`grid grid-rows-3 grid-cols-2 gap-2 p-4 bg-antique-wood/90 rounded-sm shadow-inner ${side === 'enemy' ? 'border-2 border-antique-red' : 'border-2 border-antique-gold'}`}>
        {grid.map((row, rIdx) => (
           row.map((troop: Troop | null, cIdx: number) => (
             <div 
               key={`${rIdx}-${cIdx}`} 
               className={`
                 w-24 h-24 border rounded-sm flex flex-col items-center justify-center relative transition-all duration-200
                 ${troop ? (troop.stats.hp > 0 ? 'bg-antique-paper border-antique-gold shadow-md' : 'bg-antique-dark opacity-50 border-antique-wood') : 'bg-transparent border-antique-wood/30'}
                 ${troop && activeTroop && activeTroop.id === troop.id ? 'ring-4 ring-antique-gold scale-105 z-10' : ''}
                 ${side === 'enemy' && isPlayerTurn && troop && troop.stats.hp > 0 ? 'cursor-crosshair hover:bg-red-100 hover:ring-2 hover:ring-red-500' : ''}
               `}
               onClick={() => troop && handleTroopClick(troop, side)}
             >
               {troop && (
                 <>
                   <div className={`text-xs font-serif font-bold ${troop.stats.hp > 0 ? 'text-antique-dark' : 'text-antique-white'}`}>{troop.type}</div>
                   <div className="w-full px-2 mt-1">
                     <div className="h-1 bg-antique-dark/30 w-full rounded-full overflow-hidden">
                       <div 
                         className="h-1 bg-antique-red rounded-full" 
                         style={{ width: `${(troop.stats.hp / troop.stats.maxHp) * 100}%` }}
                       />
                     </div>
                   </div>
                   <div className={`text-xs mt-1 font-mono ${troop.stats.hp > 0 ? 'text-antique-wood' : 'text-antique-white/70'}`}>{t('battle.hp')} {troop.stats.hp}</div>
                   <div className={`text-[10px] mt-0.5 font-mono text-gray-500`}>M:{troop.stats.morale}</div>
                 </>
               )}
             </div>
           ))
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-antique-dark/95 flex flex-col items-center justify-center z-[200] font-serif bg-[url('/parchment-dark.jpg')] bg-cover">
      <div className="text-antique-white text-4xl font-bold mb-8 tracking-widest uppercase border-b-2 border-antique-gold pb-2 shadow-black drop-shadow-lg">
        {t('battle.title')} {battle.winner ? `- ${t('battle.winner')} ${battle.winner === 'ATTACKER' ? t('battle.attacker') : t('battle.defender')}` : `${t('battle.turn')} ${battle.turn === 'ATTACKER' ? t('battle.attacker') : t('battle.defender')}`}
      </div>
      
      <div className="flex gap-16 mb-8">
        <div className="flex flex-col items-center">
          <h3 className="text-xl text-antique-gold font-bold mb-4 uppercase tracking-wider">{t('battle.attacker')}</h3>
          {renderGrid(battle.attackerTroops, 'friendly')}
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-antique-red mb-4 font-serif italic">VS</div>
          <div className="text-sm text-antique-white/50 mb-8 font-mono">{t('battle.round')} {battle.round}</div>
          
          {isPlayerTurn && !battle.winner && (
              <div className="flex flex-col gap-2">
                  <div className="text-antique-gold text-sm mb-1 animate-pulse font-bold">Your Turn! Select Target</div>
                  <button 
                      onClick={handleDefend}
                      className="px-6 py-2 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark text-antique-white border border-antique-gold rounded shadow-lg transition-colors font-serif"
                  >
                      {t('battle.defend') || 'Skip Turn'}
                  </button>
              </div>
          )}
          {!isPlayerTurn && !battle.winner && (
              <div className="text-antique-white/70 text-sm animate-pulse">Enemy Moving...</div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-xl text-antique-red font-bold mb-4 uppercase tracking-wider">{t('battle.defender')}</h3>
          {renderGrid(battle.defenderTroops, 'enemy')}
        </div>
      </div>
      
      <div className="h-32 w-full max-w-3xl bg-black/40 border border-antique-wood rounded-sm p-4 overflow-y-auto mb-8 font-mono text-sm text-antique-white shadow-inner">
        {battle.log.slice().reverse().map((line, i) => (
          <div key={i} className="border-b border-white/5 py-1">{line}</div>
        ))}
      </div>
      
      {battle.winner ? (
        <div className="flex flex-col items-center gap-4">
            <div className="text-2xl text-antique-gold font-bold">
                {battle.winner === 'ATTACKER' ? 'VICTORY - PROVINCE CONQUERED' : 'DEFEAT - ARMY RETREATING'}
            </div>
            <button 
            onClick={handleClose}
            className="px-8 py-3 bg-antique-gold hover:bg-antique-white text-antique-dark font-bold rounded-sm text-xl border-2 border-antique-white shadow-lg transition-all transform hover:scale-105 uppercase tracking-widest"
            >
            {t('battle.end_battle')}
            </button>
        </div>
      ) : (
        <button 
          onClick={() => GameController.getInstance().retreatBattle()}
          className="px-8 py-3 bg-red-900 hover:bg-red-800 text-white font-bold rounded-sm text-xl border-2 border-red-700 shadow-lg transition-all transform hover:scale-105 uppercase tracking-widest mt-4"
        >
          {t('battle.retreat') || 'Retreat'}
        </button>
      )}
    </div>
  )
}
