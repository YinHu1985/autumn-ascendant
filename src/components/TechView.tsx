import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCountries, selectPlayerCountryId } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import { TechRegistry } from '../systems/TechRegistry'
import GameController from '../controllers/GameController'
import { getTechName } from '../utils/localizationUtils'
import { TechCategory } from '../types/Technology'
import { checkCommandAllowed } from '../systems/CommandRules'
import { extractTechRequirements } from '../utils/ConditionUtils'
import type { GameState } from '../store/gameState'

interface TechViewProps {
  onClose: () => void
}

export default function TechView({ onClose }: TechViewProps) {
  const countries = useSelector(selectCountries)
  const playerId = useSelector(selectPlayerCountryId)
  const country = countries[playerId]
  const gameState = useSelector((state: { gameState: GameState }) => state.gameState)
  const t = (key: string) => LocManager.getInstance().t(key)
  const registry = TechRegistry.getInstance()
  
  const [activeTab, setActiveTab] = useState<TechCategory>('production')

  if (!country) return null

  const getTechCheck = (techId: string) => {
    const tech = registry.getTech(techId)
    if (!tech) {
      return {
        status: 'locked' as const,
        reasons: ['Tech definition missing'],
      }
    }
    const command = {
      type: 'RESEARCH_TECH' as const,
      payload: { countryId: playerId, techId },
    }
    const result = checkCommandAllowed(gameState, command)
    const status = country.researchedTechs.includes(techId)
      ? ('researched' as const)
      : result.allowed
      ? ('available' as const)
      : ('locked' as const)
    return { status, reasons: result.reasons }
  }

  const handleResearch = (techId: string) => {
    GameController.getInstance().researchTech(playerId, techId)
  }

  const tabs: TechCategory[] = ['production', 'military', 'secret']
  const techs = registry.getTechsByCategory(activeTab)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-3/4 h-3/4 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-center mb-6 border-b-2 border-antique-gold pb-4">
          <h1 className="text-4xl font-bold text-antique-dark tracking-widest uppercase">{t('tech.tree')}</h1>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-2xl font-bold transition-colors">
            {t('common.close')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-4 border-b border-antique-gold">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold uppercase tracking-wide transition-colors ${
                activeTab === tab 
                  ? 'bg-antique-gold text-antique-dark border-t border-l border-r border-antique-gold rounded-t' 
                  : 'text-antique-wood hover:bg-antique-paper'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {techs.map(tech => {
                const { status, reasons } = getTechCheck(tech.id)
                const tooltip = reasons.join('\n')
                return (
                  <div
                    key={tech.id}
                    title={status === 'locked' && tooltip ? tooltip : undefined}
                    className={`
                    p-4 rounded-sm border-2 flex flex-col justify-between h-56 transition-all
                    ${status === 'researched' ? 'bg-antique-paper border-antique-green' : ''}
                    ${status === 'available' ? 'bg-antique-white border-antique-gold shadow-md' : ''}
                    ${status === 'locked' ? 'bg-gray-200 border-gray-400 opacity-75 grayscale' : ''}
                  `}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-antique-dark leading-tight">{t(tech.name)}</h3>
                        <span className={`text-xs px-2 py-1 rounded-sm font-bold uppercase border whitespace-nowrap
                          ${status === 'researched' ? 'bg-antique-green text-antique-white border-antique-green' : ''}
                          ${status === 'available' ? 'bg-antique-gold text-antique-dark border-antique-gold' : ''}
                          ${status === 'locked' ? 'bg-gray-400 text-gray-700 border-gray-500' : ''}
                        `}>
                          {t(`tech.${status}`)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 italic">{t(tech.description)}</p>
                      
                      {/* Cost */}
                      {status !== 'researched' && (
                        <div className="text-sm text-antique-wood mb-2 font-serif grid grid-cols-2 gap-1">
                          {tech.cost.gold && <span className="text-antique-gold font-bold">{tech.cost.gold} Cash</span>}
                          {tech.cost.engineering_practice && <span className="text-blue-600 font-bold">{tech.cost.engineering_practice} Eng.Prac</span>}
                          {tech.cost.military_practice && <span className="text-red-600 font-bold">{tech.cost.military_practice} Mil.Prac</span>}
                        </div>
                      )}
                      
                      {/* Prereqs */}
                      {extractTechRequirements(tech.condition).length > 0 && (
                         <div className="text-xs text-gray-500 mt-1">
                           Req: {extractTechRequirements(tech.condition).map(p => {
                             const reqTech = registry.getTech(p)
                             return reqTech ? t(reqTech.name) : p
                           }).join(', ')}
                         </div>
                      )}
                    </div>

                    {status === 'available' && (
                      <button 
                        onClick={() => handleResearch(tech.id)}
                        className="w-full py-2 bg-antique-wood text-antique-white font-bold rounded-sm hover:bg-antique-dark border border-antique-gold transition-colors uppercase tracking-wide mt-2"
                      >
                        {t('tech.research')}
                      </button>
                    )}
                  </div>
                )
             })}
          </div>
        </div>
      </div>
    </div>
  )
}
