import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectCountries, selectPlayerCountryId } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import { TechRegistry } from '../systems/TechRegistry'
import { IdeaRegistry } from '../systems/IdeaRegistry'
import { Modifier } from '../types/Modifier'

interface CountryViewProps {
  onClose: () => void
}

export default function CountryView({ onClose }: CountryViewProps) {
  const countries = useSelector(selectCountries)
  const playerId = useSelector(selectPlayerCountryId)
  const country = countries[playerId]
  const t = (key: string) => LocManager.getInstance().t(key)

  const activeModifiers = useMemo(() => {
    if (!country) return []
    const mods: { source: string, modifier: Modifier }[] = []

    // Techs
    country.researchedTechs.forEach(techId => {
      const tech = TechRegistry.getInstance().getTech(techId)
      if (tech && tech.rewardModifiers) {
        tech.rewardModifiers.forEach(mod => {
          mods.push({ source: tech.name, modifier: mod })
        })
      }
    })

    // Ideas
    country.adoptedIdeas.forEach(ideaId => {
      const idea = IdeaRegistry.getInstance().getIdea(ideaId)
      if (idea && idea.rewardModifiers) {
        idea.rewardModifiers.forEach(mod => {
          mods.push({ source: idea.name, modifier: mod })
        })
      }
    })

    return mods
  }, [country])

  if (!country) return null

  const formatValue = (val: number) => Math.floor(val).toLocaleString()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-3/4 h-3/4 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-center mb-6 border-b-2 border-antique-gold pb-4">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full shadow-sm border border-antique-wood" style={{ backgroundColor: country.color }} />
             <h1 className="text-4xl font-bold text-antique-dark tracking-widest uppercase">{country.name}</h1>
          </div>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-2xl font-bold transition-colors">
            {t('common.close')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8 h-full overflow-hidden">
          {/* Left Column: Resources & Variables */}
          <div className="bg-antique-paper p-6 rounded-sm shadow-md border border-antique-gold flex flex-col overflow-hidden">
            <h2 className="text-2xl font-bold text-antique-dark mb-4 border-b border-antique-wood pb-2">{t('country.resources')} & Variables</h2>
            
            <div className="overflow-y-auto pr-2 space-y-6">
                {/* Main Resources */}
                <div>
                    <h3 className="text-lg font-bold text-antique-wood mb-2 uppercase text-xs tracking-wider">Base Resources</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between p-2 bg-antique-white rounded-sm border border-antique-gold/30">
                            <span className="text-antique-dark font-semibold">{t('country.gold')}</span>
                            <span className="font-bold text-antique-gold">{formatValue(country.resources.cash)}</span>
                        </div>
                    </div>
                </div>

                {/* Practice */}
                <div>
                    <h3 className="text-lg font-bold text-antique-wood mb-2 uppercase text-xs tracking-wider">Practice Points</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between p-2 bg-antique-white rounded-sm border border-antique-gold/30">
                            <span className="text-antique-dark font-semibold">Engineering</span>
                            <span className="font-bold text-blue-600">{formatValue(country.resources.engineering_practice)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-antique-white rounded-sm border border-antique-gold/30">
                            <span className="text-antique-dark font-semibold">Military</span>
                            <span className="font-bold text-red-600">{formatValue(country.resources.military_practice)}</span>
                        </div>
                    </div>
                </div>

                {/* Traditions */}
                <div>
                    <h3 className="text-lg font-bold text-antique-wood mb-2 uppercase text-xs tracking-wider">Traditions</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(country.resources.tradition || {}).map(([school, value]) => (
                            <div key={school} className="flex justify-between p-2 bg-antique-white/50 rounded-sm border border-antique-gold/20 text-sm">
                                <span className="text-antique-dark capitalize">{school}</span>
                                <span className="font-mono text-antique-wood">{formatValue(value as number)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Modifiers & Overview */}
          <div className="flex flex-col gap-6 h-full overflow-hidden">
             {/* Modifiers Section */}
             <div className="bg-antique-paper p-6 rounded-sm shadow-md border border-antique-gold flex-1 flex flex-col overflow-hidden">
                <h2 className="text-2xl font-bold text-antique-dark mb-4 border-b border-antique-wood pb-2">Active Modifiers</h2>
                <div className="overflow-y-auto pr-2">
                    {activeModifiers.length === 0 ? (
                        <p className="text-antique-wood italic text-center py-4">No active modifiers</p>
                    ) : (
                        <div className="space-y-2">
                            {activeModifiers.map((item, idx) => (
                                <div key={idx} className="bg-antique-white p-3 rounded-sm border border-antique-gold/40 flex flex-col">
                                    <div className="flex justify-between items-baseline border-b border-antique-gold/20 pb-1 mb-1">
                                        <span className="font-bold text-antique-dark text-sm">{item.modifier.name || item.modifier.id}</span>
                                        <span className="text-xs text-antique-wood/80 uppercase tracking-wider">{item.source}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-antique-wood">{item.modifier.targetAttribute}</span>
                                        <span className={`font-mono font-bold ${item.modifier.value >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {item.modifier.operator === 'add_percent' 
                                                ? `${item.modifier.value > 0 ? '+' : ''}${Math.round(item.modifier.value * 100)}%`
                                                : `${item.modifier.value > 0 ? '+' : ''}${item.modifier.value}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>

             {/* Overview Stats */}
             <div className="bg-antique-paper p-6 rounded-sm shadow-md border border-antique-gold h-1/3 flex flex-col">
                <h2 className="text-xl font-bold text-antique-dark mb-4 border-b border-antique-wood pb-2">Statistics</h2>
                <div className="space-y-2 overflow-y-auto">
                   <p className="text-antique-wood">Technologies: <span className="font-bold text-antique-dark">{country.researchedTechs.length}</span></p>
                   <p className="text-antique-wood">Ideas Adopted: <span className="font-bold text-antique-dark">{country.adoptedIdeas.length}</span></p>
                   <p className="text-antique-wood">Capital: <span className="font-bold text-antique-dark">{country.capitalId}</span></p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
