import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCountries, selectPlayerCountryId } from '../store/gameState'
import { LocManager } from '../systems/LocManager'
import { IdeaRegistry } from '../systems/IdeaRegistry'
import GameController from '../controllers/GameController'
import { School, SCHOOLS } from '../types/Country'
import { checkCommandAllowed } from '../systems/CommandRules'
import { extractIdeaRequirements } from '../utils/ConditionUtils'
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
  
  const [selectedSchools, setSelectedSchools] = useState<School[]>(['confucianism', 'taoism', 'legalism', 'mohism', 'military'])
  const [showEquipped, setShowEquipped] = useState(true)
  const [showAvailable, setShowAvailable] = useState(true)
  const [showLocked, setShowLocked] = useState(true)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0)
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null)
  const [focusedIdeaIds, setFocusedIdeaIds] = useState<string[] | null>(null)

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

  const allIdeas = registry.getAllIdeas()
  const filteredIdeas = useMemo(() => {
    if (focusedIdeaIds && focusedIdeaIds.length > 0) {
      const wanted = new Set(focusedIdeaIds)
      return allIdeas.filter(i => wanted.has(i.id))
    }
    return allIdeas.filter(i => selectedSchools.includes(i.school as School))
  }, [allIdeas, selectedSchools, focusedIdeaIds])
  const ideasWithStatus = useMemo(() => {
    return filteredIdeas
      .map(i => ({ idea: i, check: getIdeaCheck(i.id) }))
      .filter(x => (x.check.status === 'adopted' && showEquipped) || (x.check.status === 'available' && showAvailable) || (x.check.status === 'locked' && showLocked))
  }, [filteredIdeas, showEquipped, showAvailable, showLocked])
  const currentTraditionBySchool = country.resources.tradition || {} as Record<School, number>
  const maxSlots = 12
  const toggleSchool = (s: School) => {
    setSelectedSchools(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  const goals = useMemo(() => {
    return allIdeas.filter(i => i.cost === 0 && extractIdeaRequirements(i.condition).length > 0)
  }, [allIdeas])
  const activeGoal = useMemo(() => goals.find(g => g.id === activeGoalId) || null, [goals, activeGoalId])
  const clearFocus = () => {
    setFocusedIdeaIds(null)
    setActiveGoalId(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-5/6 h-5/6 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-center mb-4 border-b-2 border-antique-gold pb-3">
          <h1 className="text-4xl font-bold text-antique-dark tracking-widest uppercase">{t('idea.title')}</h1>
          <button onClick={onClose} className="text-antique-wood hover:text-antique-red text-2xl font-bold transition-colors">
            {t('common.close')}
          </button>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {goals.map(g => {
              const reqs = extractIdeaRequirements(g.condition)
              const met = reqs.filter(id => equippedIds.includes(id)).length
              const total = reqs.length
              const reqNames = reqs.map(id => {
                const idea = registry.getIdea(id)
                return idea ? t(idea.name) : id
              })
              const tooltip = `${t(g.name)}\n${t(g.description)}\n需要：${reqNames.join('，')}`
              return (
                <button
                  key={g.id}
                  title={tooltip}
                  onClick={() => {
                    setActiveGoalId(g.id)
                    setFocusedIdeaIds(reqs)
                    setShowLocked(true)
                    setShowAvailable(true)
                    setShowEquipped(true)
                  }}
                  className={`${activeGoalId === g.id ? 'bg-antique-gold text-antique-dark' : 'bg-antique-paper text-antique-dark hover:bg-antique-white'} flex items-center gap-2 px-3 py-2 rounded-sm border border-antique-gold whitespace-nowrap`}
                >
                  <span className="font-bold">{t(g.name)}</span>
                  <span className="text-xs text-antique-wood">{met}/{total}</span>
                </button>
              )
            })}
          </div>
          {activeGoal && (
            <div className="mt-2 p-3 rounded-sm border border-antique-gold bg-antique-paper">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-antique-dark">{t(activeGoal.name)}</div>
                  <div className="text-sm text-antique-wood mt-1">{t(activeGoal.description)}</div>
                </div>
                <button
                  onClick={clearFocus}
                  className="px-3 py-1 text-xs font-bold uppercase rounded-sm border bg-antique-wood text-antique-white hover:bg-antique-dark border-antique-gold"
                >
                  清除筛选
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {extractIdeaRequirements(activeGoal.condition).map(id => {
                  const idea = registry.getIdea(id)
                  const met = equippedIds.includes(id)
                  return (
                    <button
                      key={id}
                      onClick={() => setFocusedIdeaIds([id])}
                      className={`${met ? 'bg-antique-green text-antique-white border-antique-green' : 'bg-antique-white text-antique-dark border-antique-gold'} px-2 py-1 rounded-sm border text-xs`}
                      title={idea ? `${t(idea.name)}\n${t(idea.description)}` : id}
                    >
                      {idea ? t(idea.name) : id}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-3 flex-1 min-h-0">
          <div className="w-64 flex-shrink-0 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg text-antique-dark font-bold">{t('idea.slots')}: {slots.length}/{maxSlots}</span>
              <button
                onClick={handleUnlockSlot}
                disabled={slots.length >= maxSlots}
                className={`${slots.length < maxSlots ? 'bg-antique-wood text-antique-white hover:bg-antique-dark border-antique-gold' : 'bg-gray-400 text-gray-200 border-gray-500 cursor-not-allowed'} px-3 py-1 text-sm font-bold uppercase rounded-sm border transition-colors`}
              >
                {t('idea.unlockSlot')}
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto min-h-0 pr-1">
              {Array.from({ length: slots.length }).map((_, index) => {
                const ideaId = slots[index]
                const idea = ideaId ? registry.getIdea(ideaId) : null
                const isSelected = selectedSlotIndex === index
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedSlotIndex(index)}
                    className={`${isSelected ? 'border-antique-gold bg-antique-paper' : 'border-antique-wood bg-antique-white'} w-full px-3 py-2 rounded-sm border text-xs flex gap-2 items-start`}
                  >
                    <div className="w-8 h-8 rounded-sm border border-antique-gold bg-antique-wood/20 flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col items-start">
                      <span className="font-bold uppercase">{t('idea.slot')} {index + 1}</span>
                      <span className="text-[11px] text-antique-dark truncate">{idea ? t(idea.name) : t('idea.empty')}</span>
                      {idea && (
                        <span className="text-[10px] text-antique-wood">{t(`school.${idea.school}`)}</span>
                      )}
                      {idea && (
                        <span
                          onClick={e => {
                            e.stopPropagation()
                            handleUnequip(index)
                          }}
                          className="mt-1 text-[10px] underline text-antique-red"
                        >
                          {t('idea.unequip')}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="mb-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {SCHOOLS.map(school => (
                  <button
                    key={school}
                    onClick={() => toggleSchool(school)}
                    className={`${selectedSchools.includes(school) ? 'bg-antique-gold text-antique-dark' : 'bg-antique-paper text-antique-wood hover:bg-antique-white'} px-3 py-1 rounded-sm border border-antique-gold text-sm font-bold uppercase tracking-wide`}
                  >
                    {t(`school.${school}`)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-antique-dark">
                <span className="font-bold">状态</span>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={showEquipped} onChange={e => setShowEquipped(e.target.checked)} />
                  <span className="text-antique-dark">已装备</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={showAvailable} onChange={e => setShowAvailable(e.target.checked)} />
                  <span className="text-antique-dark">可采用</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={showLocked} onChange={e => setShowLocked(e.target.checked)} />
                  <span className="text-antique-dark">未解锁</span>
                </label>
                {focusedIdeaIds && (
                  <button
                    onClick={clearFocus}
                    className="ml-2 px-2 py-1 text-xs rounded-sm border border-antique-gold bg-antique-paper text-antique-dark hover:bg-antique-white"
                  >
                    清除目标筛选
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideasWithStatus.map(({ idea, check }) => {
                  const status = check.status
                  const reasons = check.reasons
                  const tooltip = reasons.join('\n')
                  const currentTradition = currentTraditionBySchool[idea.school as School] || 0
                  return (
                    <div
                      key={idea.id}
                      title={status === 'locked' && tooltip ? tooltip : undefined}
                      className={`${status === 'adopted' ? 'bg-antique-paper border-antique-green' : ''} ${status === 'available' ? 'bg-antique-white border-antique-gold shadow-md' : ''} ${status === 'locked' ? 'bg-gray-200 border-gray-400 opacity-75 grayscale' : ''} p-4 rounded-sm border-2 flex flex-col justify-between h-48 transition-all`}
                    >
                      <div>
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-12 h-12 rounded-sm border border-antique-gold bg-antique-wood/20 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-lg text-antique-dark leading-tight">{t(idea.name)}</h3>
                              <span className={`${status === 'adopted' ? 'bg-antique-green text-antique-white border-antique-green' : ''} ${status === 'available' ? 'bg-antique-gold text-antique-dark border-antique-gold' : ''} ${status === 'locked' ? 'bg-gray-400 text-gray-700 border-gray-500' : ''} text-xs px-2 py-1 rounded-sm font-bold uppercase border whitespace-nowrap`}>
                                {t(`idea.${status}`)}
                              </span>
                            </div>
                            <div className="text-xs text-antique-wood mt-1 font-bold uppercase">{t(`school.${idea.school}`)}</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2 italic">{t(idea.description)}</p>
                        {status !== 'adopted' && (
                          <div className="text-sm text-antique-wood mb-2 font-serif">
                            <span className="font-bold uppercase">{t('idea.cost')}:</span>
                            <span className="ml-2 text-purple-700 font-bold">{idea.cost} Tradition</span>
                          </div>
                        )}
                        {extractIdeaRequirements(idea.condition).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Req: {extractIdeaRequirements(idea.condition).map(p => registry.getIdea(p)?.name).join(', ')}
                          </div>
                        )}
                      </div>
                      {status === 'available' && (
                        <button
                          onClick={() => handleEquip(idea.id)}
                          disabled={currentTradition < idea.cost}
                          className={`${currentTradition >= idea.cost ? 'bg-antique-wood text-antique-white hover:bg-antique-dark border-antique-gold' : 'bg-gray-400 text-gray-200 border-gray-500 cursor-not-allowed'} w-full py-2 font-bold rounded-sm border transition-colors uppercase tracking-wide mt-2`}
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

      </div>
    </div>
  )
}
