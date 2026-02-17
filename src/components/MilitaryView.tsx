import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectArmies, selectPlayerCountryId, selectSettlements } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import GameController from '../controllers/GameController'
import { Troop, TroopType } from '../types/Battle'
import { getDefaultTroopStatsForType } from '../systems/BattleSystem'

interface MilitaryViewProps {
  onClose: () => void
  onSelectArmyForMove?: (armyId: string) => void
  selectedArmyIdForMove?: string | null
}

export default function MilitaryView({ onClose, onSelectArmyForMove, selectedArmyIdForMove }: MilitaryViewProps) {
  const armies = useSelector(selectArmies)
  const settlements = useSelector(selectSettlements)
  const playerId = useSelector(selectPlayerCountryId)
  const t = (key: string) => LocManager.getInstance().t(key)

  const playerArmies = Object.values(armies).filter(a => a.ownerId === playerId)

  const [selectedArmyId, setSelectedArmyId] = useState<string | null>(null)
  const [positionEditTroopId, setPositionEditTroopId] = useState<string | null>(null)
  const [typeEditTroopId, setTypeEditTroopId] = useState<string | null>(null)
  const [typeEditSelectedType, setTypeEditSelectedType] = useState<TroopType | null>(null)

  useEffect(() => {
    if (!selectedArmyId && playerArmies.length > 0) {
      setSelectedArmyId(playerArmies[0].id)
    }
  }, [selectedArmyId, playerArmies])

  const getSettlementName = (id: string | null) => {
    if (!id) return 'Unknown'
    const s = settlements.find(set => set.id === id)
    return s ? s.name : id
  }

  const selectedArmy = selectedArmyId ? armies[selectedArmyId] : null

  const troopTypes: TroopType[] = ['Infantry', 'Archer', 'Cavalry', 'Chariot']
  const TYPE_CHANGE_COST = 10

  const handleFastRecover = () => {
    if (!selectedArmy) return
    GameController.getInstance().fastRecoverArmy(selectedArmy.id)
  }

  const handleConfirmTypeChange = () => {
    if (!selectedArmy || !typeEditTroopId || !typeEditSelectedType) {
      setTypeEditTroopId(null)
      setTypeEditSelectedType(null)
      return
    }
    const troop = (selectedArmy.troops || []).find(t => t.id === typeEditTroopId)
    if (!troop) {
      setTypeEditTroopId(null)
      setTypeEditSelectedType(null)
      return
    }
    if (troop.type === typeEditSelectedType) {
      setTypeEditTroopId(null)
      setTypeEditSelectedType(null)
      return
    }
    GameController.getInstance().changeTroopType(selectedArmy.id, typeEditTroopId, typeEditSelectedType)
    setTypeEditTroopId(null)
    setTypeEditSelectedType(null)
  }

  const renderTroopCard = (troop: Troop | null, row: 0 | 1, col: 0 | 1 | 2) => {
    const isEditing = positionEditTroopId !== null
    const isTarget = isEditing && troop && troop.id === positionEditTroopId

    const handleClickPosition = () => {
      if (!selectedArmy) return
      if (!isEditing || !positionEditTroopId) return
      GameController.getInstance().swapTroopPosition(selectedArmy.id, positionEditTroopId, { row, col })
      setPositionEditTroopId(null)
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`
          w-28 h-28 border rounded-sm flex flex-col items-center justify-center relative transition-all duration-200
          ${troop ? (troop.stats.hp > 0 ? 'bg-antique-paper border-antique-gold shadow-md' : 'bg-antique-dark opacity-50 border-antique-wood') : 'bg-transparent border-dashed border-antique-wood/40'}
          ${positionEditTroopId ? 'cursor-pointer hover:bg-antique-wood/20' : ''}
        `}
        onClick={() => isEditing && positionEditTroopId && handleClickPosition()}
      >
        {troop && (
          <>
            <div className="text-xs font-serif font-bold text-antique-dark">{troop.type}</div>
            <div className="w-full px-2 mt-1">
              <div className="h-1 bg-antique-dark/30 w-full rounded-full overflow-hidden">
                <div
                  className="h-1 bg-antique-red rounded-full"
                  style={{ width: `${(troop.stats.hp / troop.stats.maxHp) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-[10px] mt-1 font-mono text-antique-wood">
              HP {troop.stats.hp}/{troop.stats.maxHp}
            </div>
            <div className="text-[10px] mt-0.5 font-mono text-gray-500">
              A{troop.stats.attack}/D{troop.stats.defense}
            </div>
            <div className="flex gap-1 mt-1">
              <button
                className="px-1 py-0.5 text-[10px] border border-antique-gold rounded-sm bg-antique-paper hover:bg-antique-gold"
                onClick={e => {
                  e.stopPropagation()
                  setPositionEditTroopId(null)
                  setTypeEditTroopId(troop.id)
                  setTypeEditSelectedType(troop.type as TroopType)
                }}
              >
                Type
              </button>
              <button
                className={`px-1 py-0.5 text-[10px] border rounded-sm ${
                  positionEditTroopId === troop.id
                    ? 'border-red-500 bg-red-900 text-antique-paper'
                    : 'border-antique-gold bg-antique-paper hover:bg-antique-gold'
                }`}
                onClick={e => {
                  e.stopPropagation()
                  if (positionEditTroopId === troop.id) {
                    setPositionEditTroopId(null)
                  } else {
                    setPositionEditTroopId(troop.id)
                  }
                }}
              >
                Pos
              </button>
            </div>
          </>
        )}
        {isTarget && (
          <div className="absolute inset-0 border-2 border-red-500 pointer-events-none" />
        )}
      </div>
    )
  }

  const renderTroopGrid = () => {
    if (!selectedArmy) return null
    const troops = selectedArmy.troops || []

    const getTroopAt = (row: 0 | 1, col: 0 | 1 | 2): Troop | null => {
      return troops.find(t => t.position.row === row && t.position.col === col) || null
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs text-antique-wood/80 mb-1">Front Line</div>
        <div className="flex gap-2 mb-2">
          {([0, 1, 2] as const).map(col => renderTroopCard(getTroopAt(0, col), 0, col))}
        </div>
        <div className="text-xs text-antique-wood/80 mb-1">Back Line</div>
        <div className="flex gap-2">
          {([0, 1, 2] as const).map(col => renderTroopCard(getTroopAt(1, col), 1, col))}
        </div>
        {positionEditTroopId && (
          <div className="mt-2 text-xs text-antique-red">
            Click a slot (including empty) to swap position.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-3/4 h-3/4 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-center mb-6 border-b-2 border-antique-gold pb-4">
          <h1 className="text-3xl font-bold text-antique-dark tracking-widest uppercase">{t('military.armies')}</h1>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-xl font-bold transition-colors">
            {t('common.close')}
          </button>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="w-1/2 overflow-y-auto">
            <table className="w-full bg-antique-paper rounded-sm shadow-sm border border-antique-gold">
              <thead className="bg-antique-wood/10 border-b border-antique-gold">
                <tr>
                  <th className="p-4 text-left font-bold text-antique-wood uppercase tracking-wide text-sm">ID</th>
                  <th className="p-4 text-left font-bold text-antique-wood uppercase tracking-wide text-sm">Status</th>
                  <th className="p-4 text-left font-bold text-antique-wood uppercase tracking-wide text-sm">Location</th>
                  <th className="p-4 text-left font-bold text-antique-wood uppercase tracking-wide text-sm">Destination</th>
                  <th className="p-4 text-left font-bold text-antique-wood uppercase tracking-wide text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {playerArmies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-antique-wood/60 italic">No active armies</td>
                  </tr>
                )}
                {playerArmies.map(army => {
                  const canMove = army.state === 'IDLE' || army.state === 'SIEGE'
                  const isSelectedForMove = selectedArmyIdForMove === army.id
                  const isSelected = selectedArmyId === army.id
                  return (
                  <tr
                    key={army.id}
                    className={`border-b border-antique-gold/30 hover:bg-antique-wood/5 transition-colors cursor-pointer ${
                      isSelected ? 'bg-antique-wood/10' : ''
                    }`}
                    onClick={() => setSelectedArmyId(army.id)}
                  >
                    <td className="p-4 font-mono text-sm font-bold text-antique-dark">{army.id.substring(0, 8)}...</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase border
                        ${army.state === 'IDLE' ? 'bg-antique-green/20 text-antique-green border-antique-green' : ''}
                        ${army.state === 'MOVING' ? 'bg-blue-100/50 text-blue-800 border-blue-800' : ''}
                        ${army.state === 'BATTLE' ? 'bg-antique-red/20 text-antique-red border-antique-red' : ''}
                        ${army.state === 'SIEGE' ? 'bg-antique-gold/20 text-antique-wood border-antique-wood' : ''}
                      `}>
                        {t(`military.${army.state.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="p-4 text-antique-dark font-medium">{getSettlementName(army.location)}</td>
                    <td className="p-4 text-antique-wood/80 italic">
                      {army.destination ? `-> ${getSettlementName(army.destination)}` : '-'}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          onSelectArmyForMove && onSelectArmyForMove(army.id)
                        }}
                        disabled={!canMove}
                        className={`px-3 py-1 text-xs font-bold rounded-sm border ${
                          isSelectedForMove
                            ? 'bg-antique-gold text-antique-dark border-antique-gold'
                            : 'bg-antique-wood text-antique-paper border-antique-gold hover:bg-antique-dark'
                        } ${!canMove ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Move
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          <div className="w-1/2 overflow-y-auto border-l border-antique-gold pl-4 relative">
            {selectedArmy ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-bold text-antique-dark">
                      {selectedArmy.name || selectedArmy.id}
                    </div>
                    <div className="text-xs text-antique-wood/80">
                      {getSettlementName(selectedArmy.location)}
                    </div>
                  </div>
                  <button
                    onClick={handleFastRecover}
                    className="px-3 py-1 text-xs font-bold rounded-sm border border-antique-gold bg-antique-green/20 text-antique-dark hover:bg-antique-green/40"
                  >
                    Fast Recover
                  </button>
                </div>

                <div className="bg-antique-paper rounded-sm shadow-sm border border-antique-gold p-3">
                  {renderTroopGrid()}
                </div>

                {typeEditTroopId && selectedArmy && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <div className="bg-antique-paper rounded-sm border border-antique-gold shadow-xl p-4 w-80">
                      <div className="text-sm font-bold text-antique-dark mb-2">
                        Change Troop Type
                      </div>
                      <div className="text-xs text-antique-wood/80 mb-2">
                        Cost: {TYPE_CHANGE_COST} cash
                      </div>
                      <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                        {troopTypes.map(tt => {
                          const stats = getDefaultTroopStatsForType(tt, false)
                          const isSelected = typeEditSelectedType === tt
                          return (
                            <button
                              key={tt}
                              className={`w-full text-left px-2 py-1 rounded-sm border text-xs ${
                                isSelected
                                  ? 'bg-antique-gold border-antique-gold text-antique-dark'
                                  : 'bg-antique-paper border-antique-gold/60 hover:bg-antique-wood/10'
                              }`}
                              onClick={() => setTypeEditSelectedType(tt)}
                            >
                              <div className="flex justify-between">
                                <span className="font-semibold">{tt}</span>
                                <span className="font-mono text-[10px]">
                                  HP {stats.hp} A{stats.attack}/D{stats.defense}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-3 py-1 text-xs rounded-sm border border-antique-gold bg-antique-paper hover:bg-antique-wood/20"
                          onClick={() => {
                            setTypeEditTroopId(null)
                            setTypeEditSelectedType(null)
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-3 py-1 text-xs rounded-sm border border-antique-gold bg-antique-gold text-antique-dark hover:bg-antique-paper"
                          onClick={handleConfirmTypeChange}
                          disabled={!typeEditSelectedType}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-antique-wood/60 italic text-sm">
                Select an army on the left to view its troops.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
