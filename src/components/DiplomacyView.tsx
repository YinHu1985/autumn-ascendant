import React from 'react'
import { useSelector } from 'react-redux'
import { selectCountries, selectPlayerCountryId } from '../store/gameState'
import { LocManager } from '../systems/LocManager'

interface DiplomacyViewProps {
  onClose: () => void
}

export default function DiplomacyView({ onClose }: DiplomacyViewProps) {
  const countries = useSelector(selectCountries)
  const playerId = useSelector(selectPlayerCountryId)
  const t = (key: string) => LocManager.getInstance().t(key)

  // Filter out player country
  const otherCountries = Object.values(countries).filter(c => c.id !== playerId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-3/4 h-3/4 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-center mb-6 border-b-2 border-antique-gold pb-4">
          <h1 className="text-3xl font-bold text-antique-dark tracking-widest uppercase">{t('diplomacy.title')}</h1>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-xl font-bold transition-colors">
            {t('common.close')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
          {otherCountries.map(country => (
            <div key={country.id} className="bg-antique-paper p-6 rounded-sm shadow-md border border-antique-gold hover:shadow-lg transition-shadow">
               <div className="flex items-center gap-4 mb-4 border-b border-antique-gold/50 pb-2">
                 <div className="w-10 h-10 rounded-full shadow-sm border border-antique-wood" style={{ backgroundColor: country.color }} />
                 <h2 className="text-xl font-bold text-antique-dark tracking-wide">{country.name}</h2>
               </div>
               
               <div className="space-y-4">
                 <div className="flex justify-between text-sm">
                   <span className="text-antique-wood italic">{t('diplomacy.relations')}</span>
                   <span className="font-bold text-antique-dark">Neutral</span>
                 </div>
                 {/* Placeholder for interactions */}
                 <button className="w-full py-2 bg-antique-wood/10 text-antique-wood/60 border border-antique-wood/30 rounded-sm cursor-not-allowed text-sm font-serif">
                   Declare War (Coming Soon)
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
