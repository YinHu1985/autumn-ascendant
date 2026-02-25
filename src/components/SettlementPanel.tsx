import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectSettlements, selectCountries, selectPlayerCountryId } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import { getSettlementName } from '../utils/localizationUtils'
import BuildingConstructionModal from './BuildingConstructionModal'
import { BuildingRegistry } from '../systems/BuildingRegistry'

import GameController from '../controllers/GameController'

interface SettlementPanelProps {
  settlementId: string
  onClose: () => void
}

export default function SettlementPanel({ settlementId, onClose }: SettlementPanelProps) {
  const settlements = useSelector(selectSettlements)
  const countries = useSelector(selectCountries)
  const playerCountryId = useSelector(selectPlayerCountryId)
  const settlement = settlements.find(s => s.id === settlementId)
  const [lang, setLang] = useState(LocManager.getInstance().getLanguage())
  const [showBuildingModal, setShowBuildingModal] = useState(false)

  useEffect(() => {
    return LocManager.getInstance().subscribe(() => {
      setLang(LocManager.getInstance().getLanguage())
    })
  }, [])

  const t = (key: string) => LocManager.getInstance().t(key)
  const buildingRegistry = BuildingRegistry.getInstance()

  if (!settlement) return null

  const owner = countries[settlement.ownerId]
  const isPlayerOwned = owner && owner.id === playerCountryId

  // Assume base slots is 4 + urban dev / 10
  const maxSlots = 4 + Math.floor(settlement.development.urban / 10)
  const usedSlots = settlement.buildings ? settlement.buildings.length : 0
  const emptySlots = Math.max(0, maxSlots - usedSlots)

  return (
    <>
      {showBuildingModal && (
        <BuildingConstructionModal 
            settlementId={settlementId} 
            onClose={() => setShowBuildingModal(false)} 
        />
      )}
      <div className="fixed right-0 top-16 bottom-0 w-80 bg-antique-white shadow-xl border-l-4 border-double border-antique-wood overflow-y-auto p-4 z-40 transition-transform transform translate-x-0 font-serif">
        <div className="flex justify-between items-center mb-4 border-b-2 border-antique-gold pb-2">
          <h2 className="text-2xl font-bold text-antique-dark tracking-wide">{getSettlementName(settlement)}</h2>
          <button 
            onClick={onClose}
            className="text-antique-wood hover:text-antique-red font-bold text-xl"
          >
            ✕
          </button>
        </div>

      {/* Terrain Image Placeholder */}
      <div className="w-full h-40 bg-antique-paper rounded-sm mb-4 flex items-center justify-center border-2 border-antique-wood shadow-inner relative">
        <span className="text-antique-wood font-serif italic text-sm opacity-75">{t('settlement.terrain')} (Placeholder)</span>
      </div>

      <div className="space-y-4">
        {/* Owner Info */}
        <div className="bg-antique-paper p-3 rounded-sm shadow-md border border-antique-gold">
          <div className="text-sm text-antique-wood italic uppercase tracking-wider mb-1">Owner</div>
          <div className="font-bold flex items-center gap-2 text-antique-dark text-lg">
            {owner ? (
              <>
                <div className="w-4 h-4 rounded-full border border-antique-wood shadow-sm" style={{ backgroundColor: owner.color }} />
                {owner.name}
              </>
            ) : (
              <span className="text-antique-wood opacity-50">Unclaimed</span>
            )}
          </div>
        </div>

        {/* Local Product */}
        <div className="bg-antique-paper p-3 rounded-sm shadow-md border border-antique-gold">
          <h3 className="font-bold text-antique-dark mb-2 border-b border-antique-wood pb-1 uppercase tracking-wide text-sm">
            {t('settlement.local_product')}
          </h3>
          {settlement.localProduct ? (
            <div className="flex items-center gap-2 text-antique-dark">
              <span className="inline-flex items-center px-2 py-1 border border-antique-gold rounded-sm bg-antique-white text-sm font-bold">
                {t(`resource.${settlement.localProduct}`)}
              </span>
            </div>
          ) : (
            <div className="text-antique-wood text-sm italic">
              {t('settlement.no_local_product')}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-antique-paper p-3 rounded-sm shadow-md border border-antique-gold">
          <h3 className="font-bold text-antique-dark mb-2 border-b border-antique-wood pb-1 uppercase tracking-wide text-sm">{t('settlement.population')}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-antique-wood">{t('settlement.urban')}</div>
              <div className="font-serif font-bold text-lg text-antique-dark">{settlement.population.urban.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-antique-wood">{t('settlement.rural')}</div>
              <div className="font-serif font-bold text-lg text-antique-dark">{settlement.population.rural.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-antique-paper p-3 rounded-sm shadow-md border border-antique-gold">
          <h3 className="font-bold text-antique-dark mb-2 border-b border-antique-wood pb-1 uppercase tracking-wide text-sm">{t('settlement.development')}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-antique-wood">{t('settlement.urban')}</div>
              <div className="font-serif font-bold text-lg text-antique-dark">{settlement.development.urban}</div>
            </div>
            <div>
              <div className="text-antique-wood">{t('settlement.rural')}</div>
              <div className="font-serif font-bold text-lg text-antique-dark">{settlement.development.rural}</div>
            </div>
          </div>
        </div>

        {/* Buildings Slots */}
        <div className="bg-antique-paper p-3 rounded-sm shadow-md border border-antique-gold">
          <h3 className="font-bold text-antique-dark mb-2 border-b border-antique-wood pb-1 uppercase tracking-wide text-sm">{t('settlement.buildings')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Render existing buildings first */}
            {settlement.buildings && settlement.buildings.map((bId, idx) => {
               const b = buildingRegistry.getBuilding(bId)
               return (
                 <div key={`b-${idx}`} className="aspect-square bg-antique-gold border-2 border-antique-wood rounded-sm flex items-center justify-center text-xs text-antique-dark font-bold shadow-sm p-1 text-center leading-tight">
                   {b ? t(b.name) : bId}
                 </div>
               )
            })}
            
            {/* Empty slots */}
            {isPlayerOwned && Array.from({ length: emptySlots }).map((_, idx) => (
                <button 
                    key={`empty-${idx}`} 
                    onClick={() => setShowBuildingModal(true)}
                    className="aspect-square bg-transparent border-2 border-dashed border-antique-wood rounded-sm flex items-center justify-center text-2xl text-antique-wood hover:bg-antique-gold hover:text-antique-white transition-colors cursor-pointer opacity-50 hover:opacity-100"
                    title={t('building.construct')}
                >
                    +
                </button>
            ))}
            
            {!isPlayerOwned && Array.from({ length: emptySlots }).map((_, idx) => (
                <div 
                    key={`empty-${idx}`} 
                    className="aspect-square bg-transparent border-2 border-dashed border-antique-wood rounded-sm opacity-25"
                />
            ))}
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
