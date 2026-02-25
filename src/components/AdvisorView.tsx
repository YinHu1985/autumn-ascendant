import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAdvisors, selectPlayerCountryId, selectSettlements } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import { Advisor } from '../types/Advisor'
import GameController from '../controllers/GameController'

interface AdvisorViewProps {
  onClose: () => void
}

export default function AdvisorView({ onClose }: AdvisorViewProps) {
  const advisors = useSelector(selectAdvisors)
  const playerId = useSelector(selectPlayerCountryId)
  const settlements = useSelector(selectSettlements)
  const t = (key: string) => LocManager.getInstance().t(key)

  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)

  // Derived state
  const hiredAdvisors = advisors.filter(a => a.ownerId === playerId)
  const availableAdvisors = advisors.filter(a => a.ownerId === null) // Or allow poaching later?
  const selectedAdvisor = advisors.find(a => a.id === selectedAdvisorId)

  const getSettlementName = (id: string | null) => {
    if (!id) return 'Unknown'
    const s = settlements.find(set => set.id === id)
    return s ? s.name : id
  }

  const handleHire = (advisor: Advisor) => {
    if (hiredAdvisors.length >= 5) {
      alert("You have reached the maximum number of advisors (5).")
      return
    }
    GameController.getInstance().hireAdvisor(advisor.id)
  }

  const handleFire = (advisor: Advisor) => {
      GameController.getInstance().fireAdvisor(advisor.id)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-5/6 h-5/6 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-antique-gold pb-4">
          <h1 className="text-3xl font-bold text-antique-dark tracking-widest uppercase">Advisors</h1>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-xl font-bold transition-colors">
            {t('common.close') || 'CLOSE'}
          </button>
        </div>

        {/* Hired Advisors Section */}
        <div className="mb-6">
            <h2 className="text-xl font-bold text-antique-wood uppercase mb-2">My Cabinet ({hiredAdvisors.length}/5)</h2>
            <div className="flex gap-4 p-4 bg-antique-paper border border-antique-gold rounded-sm min-h-[120px]">
                {hiredAdvisors.map(advisor => (
                    <div 
                        key={advisor.id}
                        onClick={() => setSelectedAdvisorId(advisor.id)}
                        className={`
                            w-24 flex flex-col items-center cursor-pointer transition-transform hover:scale-105
                            ${selectedAdvisorId === advisor.id ? 'ring-2 ring-antique-red' : ''}
                        `}
                    >
                        <div className="w-16 h-16 bg-antique-wood rounded-full border-2 border-antique-gold mb-1 overflow-hidden">
                             {/* Portrait Placeholder */}
                             <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-500">
                                {t(advisor.name)[0]}
                             </div>
                        </div>
                        <div className="text-sm font-bold text-antique-dark text-center leading-tight">{t(advisor.name)}</div>
                        <div className="text-xs text-antique-wood">Lv.{advisor.level}</div>
                    </div>
                ))}
                {hiredAdvisors.length === 0 && (
                    <div className="text-antique-wood/50 italic flex items-center justify-center w-full">
                        No advisors hired. Select a famous figure below to hire.
                    </div>
                )}
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-6 overflow-hidden">
            
            {/* List of Available Figures */}
            <div className="w-1/3 flex flex-col bg-antique-paper border border-antique-gold rounded-sm">
                <div className="p-3 bg-antique-wood/10 border-b border-antique-gold font-bold text-antique-wood uppercase">
                    Famous Figures
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {availableAdvisors.map(advisor => (
                        <div 
                            key={advisor.id}
                            onClick={() => setSelectedAdvisorId(advisor.id)}
                            className={`
                                p-2 mb-1 rounded cursor-pointer flex justify-between items-center border border-transparent
                                ${selectedAdvisorId === advisor.id ? 'bg-antique-gold/20 border-antique-gold' : 'hover:bg-antique-wood/5'}
                            `}
                        >
                            <span className="font-bold text-antique-dark">{t(advisor.name)}</span>
                            <span className="text-xs text-antique-wood bg-antique-white px-1 rounded border border-antique-wood/20">
                                Lv.{advisor.level}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Details Panel */}
            <div className="w-2/3 bg-antique-white border border-antique-wood p-6 rounded-sm relative overflow-y-auto">
                {selectedAdvisor ? (
                    <div className="flex flex-col h-full">
                        <div className="flex gap-6 mb-6">
                            {/* Portrait Large */}
                            <div className="w-32 h-32 bg-antique-wood rounded border-4 border-double border-antique-gold flex-shrink-0 flex items-center justify-center overflow-hidden">
                                <div className="text-4xl text-antique-white">{t(selectedAdvisor.name)[0]}</div>
                            </div>
                            
                            {/* Stats */}
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-antique-dark mb-2">{t(selectedAdvisor.name)}</h2>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-antique-wood uppercase text-xs">Level</span>
                                        <span className="font-bold text-xl">{selectedAdvisor.level} / 5</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-antique-wood uppercase text-xs">Location</span>
                                        <span className="font-bold">{getSettlementName(selectedAdvisor.location)}</span>
                                    </div>
                                    <div className="flex flex-col col-span-2">
                                        <span className="text-antique-wood uppercase text-xs">Status</span>
                                        <span className={`font-bold ${selectedAdvisor.ownerId ? 'text-green-600' : 'text-antique-wood/70'}`}>
                                            {selectedAdvisor.ownerId ? (selectedAdvisor.ownerId === playerId ? 'Hired by You' : 'Hired by Other') : 'Available'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Biography */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-antique-wood border-b border-antique-gold mb-2">Biography</h3>
                            <p className="text-antique-dark/80 italic leading-relaxed">
                                {t(selectedAdvisor.biography)}
                            </p>
                        </div>

                        {/* Abilities Placeholder */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-antique-wood border-b border-antique-gold mb-2">Special Abilities</h3>
                            <div className="flex gap-2">
                                {selectedAdvisor.specialAbilities.length > 0 ? (
                                    selectedAdvisor.specialAbilities.map((ability, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-antique-wood text-antique-white rounded text-sm">
                                            {ability}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-antique-wood/50 text-sm">No special abilities known.</span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto pt-4 border-t border-antique-gold/30 flex justify-end gap-4">
                            {selectedAdvisor.ownerId === playerId ? (
                                <button 
                                    onClick={() => handleFire(selectedAdvisor)}
                                    className="px-6 py-2 bg-red-800 text-white rounded hover:bg-red-700 font-bold uppercase shadow-md transition-colors"
                                >
                                    Dismiss
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleHire(selectedAdvisor)}
                                    disabled={!!selectedAdvisor.ownerId}
                                    className={`
                                        px-6 py-2 rounded font-bold uppercase shadow-md transition-colors
                                        ${selectedAdvisor.ownerId 
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                            : 'bg-antique-gold text-antique-dark hover:bg-antique-white border border-antique-gold'}
                                    `}
                                >
                                    {selectedAdvisor.ownerId ? 'Unavailable' : 'Hire Advisor'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-antique-wood/50 italic">
                        Select a figure to view details
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
