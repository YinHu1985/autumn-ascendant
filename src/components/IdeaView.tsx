import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCountries, selectPlayerCountryId } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import { IdeaRegistry } from '../systems/IdeaRegistry'
import GameController from '../controllers/GameController'
import { School, SCHOOLS } from '../types/Country'
import { checkCommandAllowed } from '../systems/CommandRules'
import type { GameState } from '../store/gameState'

interface IdeaViewProps {
  onClose: () => void
}

export default function IdeaView({ onClose }: IdeaViewProps) {
  const countries = useSelector(selectCountries)
  const playerId = useSelector(selectPlayerCountryId)
  const country = countries[playerId]
  const gameState = useSelector((state: { gameState: GameState }) => state.gameState)
  const t = (key: string) => LocManager.getInstance().t(key)
  const registry = IdeaRegistry.getInstance()
  
  const [activeSchool, setActiveSchool] = useState<School>('confucianism')
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0)

  if (!country) return null

  const slots = country.ideaSlots || []
  const equippedIds = slots.filter((x): x is string => typeof x === 'string')

  const getIdeaCheck = (ideaId: string) => {
    const idea = registry.getIdea(ideaId)
    if (!idea) {
      return {
        status: 'locked' as const,
        reasons: ['Idea definition missing'],
      }
    }
    const command = {
      type: 'EQUIP_IDEA_SLOT' as const,
      payload: { countryId: playerId, slotIndex: selectedSlotIndex, ideaId },
    }
    const result = checkCommandAllowed(gameState, command)
    const status = equippedIds.includes(ideaId)
      ? ('adopted' as const)
      : result.allowed
      ? ('available' as const)
      : ('locked' as const)
    return { status, reasons: result.reasons }
  }

  const handleEquip = (ideaId: string) => {
    GameController.getInstance().equipIdeaSlot(playerId, selectedSlotIndex, ideaId)
  }

  const handleUnlockSlot = () => {
    GameController.getInstance().unlockIdeaSlot(playerId)
  }

  const handleUnequip = (index: number) => {
    GameController.getInstance().unequipIdeaSlot(playerId, index)
  }

  const ideas = registry.getIdeasBySchool(activeSchool)
  const currentTradition = country.resources.tradition?.[activeSchool] || 0
  const maxSlots = 12

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-3/4 h-3/4 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-center mb-6 border-b-2 border-antique-gold pb-4">
          <h1 className="text-4xl font-bold text-antique-dark tracking-widest uppercase">{t('idea.title')}</h1>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-2xl font-bold transition-colors">
            {t('common.close')}
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg text-antique-dark font-bold">
              {t('idea.slots')}: {slots.length}/{maxSlots}
            </span>
            <button
              onClick={handleUnlockSlot}
              disabled={slots.length >= maxSlots}
              className={`px-3 py-1 text-sm font-bold uppercase rounded-sm border transition-colors
                ${slots.length < maxSlots
                  ? 'bg-antique-wood text-antique-white hover:bg-antique-dark border-antique-gold'
                  : 'bg-gray-400 text-gray-200 border-gray-500 cursor-not-allowed'
                }`}
            >
              {t('idea.unlockSlot')}
            </button>
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {Array.from({ length: slots.length }).map((_, index) => {
              const ideaId = slots[index]
              const idea = ideaId ? registry.getIdea(ideaId) : null
              const isSelected = selectedSlotIndex === index
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSlotIndex(index)}
                  className={`px-3 py-2 rounded-sm border text-xs flex flex-col items-center min-w-[120px] ${
                    isSelected ? 'border-antique-gold bg-antique-paper' : 'border-antique-wood bg-antique-white'
                  }`}
                >
                  <span className="font-bold uppercase mb-1">
                    {t('idea.slot')} {index + 1}
                  </span>
                  <span className="text-[11px] text-antique-dark">
                    {idea ? idea.name : t('idea.empty')}
                  </span>
                  {idea && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleUnequip(index)
                      }}
                      className="mt-1 text-[10px] underline text-antique-red"
                    >
                      {t('idea.unequip')}
                    </button>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* School Tabs */}
        <div className="flex overflow-x-auto space-x-2 mb-4 border-b border-antique-gold pb-2">
          {SCHOOLS.map(school => (
            <button
              key={school}
              onClick={() => setActiveSchool(school)}
              className={`px-3 py-1 font-bold uppercase tracking-wide transition-colors whitespace-nowrap text-sm ${
                activeSchool === school 
                  ? 'bg-antique-gold text-antique-dark rounded-sm' 
                  : 'text-antique-wood hover:bg-antique-paper'
              }`}
            >
              {t(`school.${school}`)}
            </button>
          ))}
        </div>

        {/* Tradition Display */}
        <div className="mb-4 text-center">
            <span className="text-lg text-antique-dark font-bold">
                {t(`school.${activeSchool}`)} {t('resource.tradition')}: {Math.floor(currentTradition)}
            </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {ideas.map(idea => {
                const { status, reasons } = getIdeaCheck(idea.id)
                const tooltip = reasons.join('\n')
                return (
                  <div
                    key={idea.id}
                    title={status === 'locked' && tooltip ? tooltip : undefined}
                    className={`
                    p-4 rounded-sm border-2 flex flex-col justify-between h-48 transition-all
                    ${status === 'adopted' ? 'bg-antique-paper border-antique-green' : ''}
                    ${status === 'available' ? 'bg-antique-white border-antique-gold shadow-md' : ''}
                    ${status === 'locked' ? 'bg-gray-200 border-gray-400 opacity-75 grayscale' : ''}
                  `}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-antique-dark leading-tight">{idea.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-sm font-bold uppercase border whitespace-nowrap
                          ${status === 'adopted' ? 'bg-antique-green text-antique-white border-antique-green' : ''}
                          ${status === 'available' ? 'bg-antique-gold text-antique-dark border-antique-gold' : ''}
                          ${status === 'locked' ? 'bg-gray-400 text-gray-700 border-gray-500' : ''}
                        `}>
                          {t(`idea.${status}`)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 italic">{idea.description}</p>
                      
                      {status !== 'adopted' && (
                        <div className="text-sm text-antique-wood mb-2 font-serif">
                          <span className="font-bold uppercase">{t('idea.cost')}:</span>
                          <span className="ml-2 text-purple-700 font-bold">{idea.cost} Tradition</span>
                        </div>
                      )}
                      
                      {/* Prereqs */}
                      {idea.prerequisites.length > 0 && (
                         <div className="text-xs text-gray-500 mt-1">
                           Req: {idea.prerequisites.map(p => registry.getIdea(p)?.name).join(', ')}
                         </div>
                      )}
                    </div>

                    {status === 'available' && (
                      <button 
                        onClick={() => handleEquip(idea.id)}
                        disabled={currentTradition < idea.cost}
                        className={`w-full py-2 font-bold rounded-sm border transition-colors uppercase tracking-wide mt-2
                            ${currentTradition >= idea.cost 
                                ? 'bg-antique-wood text-antique-white hover:bg-antique-dark border-antique-gold'
                                : 'bg-gray-400 text-gray-200 border-gray-500 cursor-not-allowed'
                            }
                        `}
                      >
                        {t('idea.adopt')}
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
