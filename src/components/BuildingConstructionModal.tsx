import React from 'react'
import { useSelector } from 'react-redux'
import { selectCountries, selectPlayerCountryId, selectSettlements } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import { BuildingRegistry } from '../systems/BuildingRegistry'
import GameController from '../controllers/GameController'

interface BuildingConstructionModalProps {
  settlementId: string
  onClose: () => void
}

export default function BuildingConstructionModal({ settlementId, onClose }: BuildingConstructionModalProps) {
  const countries = useSelector(selectCountries)
  const playerId = useSelector(selectPlayerCountryId)
  const settlements = useSelector(selectSettlements)
  const settlement = settlements.find(s => s.id === settlementId)
  const country = countries[playerId]
  
  const t = (key: string) => LocManager.getInstance().t(key)
  const registry = BuildingRegistry.getInstance()
  
  if (!country || !settlement) return null

  const buildings = registry.getAllBuildings()

  const handleConstruct = (buildingId: string) => {
    GameController.getInstance().constructBuilding(settlementId, buildingId)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-3/4 h-3/4 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-center mb-6 border-b-2 border-antique-gold pb-4">
          <h1 className="text-3xl font-bold text-antique-dark tracking-widest uppercase">{t('building.construct_title')}</h1>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-2xl font-bold transition-colors">
            {t('common.close')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {buildings.map(building => {
                const canAfford = 
                    (!building.cost.gold || country.resources.cash >= building.cost.gold)

                const hasRequiredProduct =
                  !building.requiredProduct ||
                  settlement.localProduct === building.requiredProduct

                const canBuildHere = canAfford && hasRequiredProduct

                return (
                  <div key={building.id} className="p-4 rounded-sm border-2 border-antique-gold bg-antique-white shadow-md flex flex-col justify-between h-48">
                    <div>
                      <h3 className="font-bold text-lg text-antique-dark mb-1">{building.name}</h3>
                      <p className="text-xs text-gray-600 mb-2 italic">{building.description}</p>
                      
                      <div className="text-sm text-antique-wood mb-2 font-serif grid grid-cols-2 gap-1">
                          {building.cost.gold && <span className="text-antique-gold font-bold">{building.cost.gold} Cash</span>}
                      </div>

                      {building.requiredProduct && (
                        <div className="text-xs text-antique-dark">
                          Requires local product: <span className="font-bold uppercase">{building.requiredProduct}</span>
                          {!hasRequiredProduct && (
                            <span className="text-antique-red ml-1">(not available here)</span>
                          )}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleConstruct(building.id)}
                      disabled={!canBuildHere}
                      className={`w-full py-2 font-bold rounded-sm border transition-colors uppercase tracking-wide mt-2
                          ${canBuildHere 
                              ? 'bg-antique-wood text-antique-white hover:bg-antique-dark border-antique-gold'
                              : 'bg-gray-400 text-gray-200 border-gray-500 cursor-not-allowed'
                          }
                      `}
                    >
                      {t('building.construct')}
                    </button>
                  </div>
                )
             })}
          </div>
        </div>
      </div>
    </div>
  )
}
