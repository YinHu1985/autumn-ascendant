import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveEventId, selectActiveEventContext } from '../store/gameState'
import { EventManager } from '../systems/EventManager'
import { LocManager } from '../systems/LocManager'
import GameController from '../controllers/GameController'
import type { RootState } from '../store'

export default function EventModal() {
  const activeEventId = useSelector(selectActiveEventId)
  const activeEventContext = useSelector(selectActiveEventContext)
  
  if (!activeEventId) return null

  const manager = EventManager.getInstance()
  const event = manager.getEventById(activeEventId)

  if (!event) return null

  const t = (key: string) => LocManager.getInstance().t(key)

  const handleOptionClick = (optionIndex: number) => {
    GameController.getInstance().resolveEvent(activeEventId, optionIndex)
  }

  // Format description with context
  let description = t(event.description)
  if (activeEventContext) {
    console.log('[EventModal] Context:', activeEventContext)
    Object.keys(activeEventContext).forEach(key => {
      description = description.replace(`{${key}}`, (activeEventContext as any)[key])
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] font-serif">
      <div className="bg-antique-white p-8 rounded-sm max-w-2xl w-full shadow-2xl border-4 border-double border-antique-wood relative">
        {/* Decorative corner accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-antique-gold"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-antique-gold"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-antique-gold"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-antique-gold"></div>

        <h2 className="text-3xl font-bold mb-6 text-antique-dark tracking-widest uppercase border-b-2 border-antique-gold pb-4 text-center">{t(event.title)}</h2>
        <div className="text-xl mb-10 font-medium leading-relaxed text-antique-dark/90 whitespace-pre-line text-center italic">
          {description}
        </div>
        
        <div className="flex flex-col gap-4">
          {event.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              className="group relative bg-antique-wood text-antique-white font-bold py-4 px-6 rounded-sm transition-all hover:bg-antique-paper hover:text-antique-dark border-2 border-antique-wood shadow-md hover:shadow-lg overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-between">
                <span>{t(option.text)}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-antique-red">❧</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
