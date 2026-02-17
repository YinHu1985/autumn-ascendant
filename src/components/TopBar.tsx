import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectDate, selectPaused, selectCountries, selectPlayerCountryId } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import GameController from '../controllers/GameController'

interface TopBarProps {
  onOpenView: (view: 'country' | 'tech' | 'ideas' | 'military' | 'diplomacy' | 'advisors' | 'warehouse') => void
}

export default function TopBar({ onOpenView }: TopBarProps) {
  const date = useSelector(selectDate)
  const paused = useSelector(selectPaused)
  const countries = useSelector(selectCountries)
  const playerId = useSelector(selectPlayerCountryId)
  const country = countries[playerId]
  const [lang, setLang] = useState(LocManager.getInstance().getLanguage())
  const [speed, setSpeedState] = useState(1)

  // Subscribe to language changes
  useEffect(() => {
    return LocManager.getInstance().subscribe(() => {
      setLang(LocManager.getInstance().getLanguage())
    })
  }, [])

  const t = (key: string) => LocManager.getInstance().t(key)

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'zh' : 'en'
    LocManager.getInstance().setLanguage(newLang)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault() // Prevent scrolling
        togglePause()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [paused])

  const togglePause = () => {
    GameController.getInstance().setPaused(!paused)
  }

  const setSpeed = (newSpeed: number) => {
      setSpeedState(newSpeed)
      GameController.getInstance().setGameSpeed(newSpeed)
  }

  return (
    <div className="h-16 bg-antique-dark text-antique-white flex items-center px-4 justify-between shadow-lg z-50 border-b-2 border-antique-gold font-serif">
      <div className="font-bold text-xl tracking-widest text-antique-gold drop-shadow-sm">Autumn Ascendant</div>
      
      <div className="flex gap-2 mr-4">
        <button onClick={() => onOpenView('country')} className="px-3 py-1 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors">{t('view.country')}</button>
        <button onClick={() => onOpenView('tech')} className="px-3 py-1 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors">{t('view.tech')}</button>
        <button onClick={() => onOpenView('ideas')} className="px-3 py-1 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors">{t('view.ideas')}</button>
        <button onClick={() => onOpenView('military')} className="px-3 py-1 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors">{t('view.military')}</button>
        <button onClick={() => onOpenView('diplomacy')} className="px-3 py-1 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors">{t('view.diplomacy')}</button>
        <button onClick={() => onOpenView('warehouse')} className="px-3 py-1 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors">{t('view.warehouse')}</button>
        <button onClick={() => onOpenView('advisors')} className="px-3 py-1 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors">{t('view.advisors') || 'Advisors'}</button>
      </div>

      {country && (
        <div className="flex gap-4 text-sm font-mono text-antique-gold items-center bg-antique-wood bg-opacity-30 px-3 py-1 rounded border border-antique-gold/30">
            <span title={t('country.gold')}>💰 {Math.floor(country.resources.cash)}</span>
            <span title={t('resource.eng_practice')} className="text-blue-300">📐 {Math.floor(country.resources.engineering_practice || 0)}</span>
            <span title={t('resource.mil_practice')} className="text-red-300">⚔️ {Math.floor(country.resources.military_practice || 0)}</span>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div className="text-lg font-serif text-antique-paper">
          {t('ui.year')} {date.year} / {t('ui.month')} {date.month.toString().padStart(2, '0')} / {t('ui.day')} {date.day.toString().padStart(2, '0')}
        </div>
        
        <button 
          onClick={toggleLanguage}
          className="px-3 py-2 bg-antique-wood hover:bg-antique-paper hover:text-antique-dark rounded-sm text-sm font-bold border border-antique-gold transition-colors"
        >
          {lang === 'en' ? '中文' : 'English'}
        </button>

        <button 
          onClick={togglePause}
          className={`px-4 py-2 rounded-sm font-bold border border-antique-gold transition-colors ${paused ? 'bg-antique-green hover:bg-green-700' : 'bg-antique-red hover:bg-red-900'}`}
        >
          {paused ? t('ui.play') : t('ui.pause')}
        </button>

        <div className="flex bg-antique-wood border border-antique-gold rounded-sm overflow-hidden ml-2">
          {[1, 2, 4, 8, 16].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs font-bold border-r last:border-r-0 border-antique-gold ${
                speed === s ? 'bg-antique-gold text-antique-dark' : 'hover:bg-antique-paper hover:text-antique-dark'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      
      <div>
        {/* Resource summary could go here */}
      </div>
    </div>
  )
}
