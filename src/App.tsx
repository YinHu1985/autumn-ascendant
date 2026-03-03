import React, { useEffect, useState } from 'react'
import TopBar from './components/TopBar'
// import WorldMap from './components/WorldMap'
import VectorMap, { MapMode } from './components/VectorMap'
import EventModal from './components/EventModal'
import BattleView from './components/BattleView'
import SettlementPanel from './components/SettlementPanel'
import DebugSettlementPanel from './components/DebugSettlementPanel'
import CountryView from './components/CountryView'
import TechView from './components/TechView'
import IdeaView from './components/IdeaView'
import MilitaryView from './components/MilitaryView'
import DiplomacyView from './components/DiplomacyView'
import GameController from './controllers/GameController'
import { registerCoreEvents } from './systems/EventManager'
import { LocManager } from './systems/LocManager'
import initialMap from './data/worldMap.json'
import initialArmies from './data/initialArmies.json'
import vectorMapData from './data/worldMapGeo.json'
import { generateInitialAdvisors } from './content/AdvisorLoader'
import AdvisorView from './components/AdvisorView'
import WarehouseView from './components/WarehouseView'
import OptionsView from './components/OptionsView'
import { SoundManager } from './systems/SoundManager'

import { COUNTRY_NAMES, COUNTRY_COLORS } from './content/CountryTags'
import { createEmptyStockpile } from './content/ResourceLoader'
import { useSelector } from 'react-redux'
import { selectArmies, selectPlayerCountryId, selectSettlements, selectActiveBattle } from './store/gameState'

// Fix Country interface mismatch in initialMap by initializing defaults if missing
// The JSON might not have researchedTechs yet.
const mapWithTechs = initialMap.map((s: any) => s) 

const initialCountries = [
  {
    id: 'QII',
    name: COUNTRY_NAMES.QII,
    color: COUNTRY_COLORS.QII,
    resources: { cash: 100, engineering_practice: 0, military_practice: 0, tradition: {}, stockpile: createEmptyStockpile() },
    researchedTechs: [],
    adoptedIdeas: [],
    ideaSlots: [],
    unlockedIdeas: []
  },
  {
    id: 'CHU',
    name: COUNTRY_NAMES.CHU,
    color: COUNTRY_COLORS.CHU,
    resources: { cash: 100, engineering_practice: 0, military_practice: 0, tradition: {}, stockpile: createEmptyStockpile() },
    researchedTechs: [],
    adoptedIdeas: [],
    ideaSlots: [],
    unlockedIdeas: []
  },
  {
    id: 'JIN',
    name: COUNTRY_NAMES.JIN,
    color: COUNTRY_COLORS.JIN,
    resources: { cash: 100, engineering_practice: 0, military_practice: 0, tradition: {}, stockpile: createEmptyStockpile() },
    researchedTechs: [],
    adoptedIdeas: [],
    ideaSlots: [],
    unlockedIdeas: []
  }
]

// Initialize events definitions on Main Thread (for UI display)
registerCoreEvents()

const MAP_ENABLED = true

type ActiveView = 'country' | 'tech' | 'ideas' | 'military' | 'diplomacy' | 'advisors' | 'warehouse' | 'options' | null

export default function App() {
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [mapMode, setMapMode] = useState<MapMode>('political')
  const [showConnections, setShowConnections] = useState(false)
  const [mapInteractionMode, setMapInteractionMode] = useState<'normal' | 'armyMove'>('normal')
  const [selectedArmyForMove, setSelectedArmyForMove] = useState<string | null>(null)
  const [validTargetSettlementIds, setValidTargetSettlementIds] = useState<string[]>([])

  const armies = useSelector(selectArmies)
  const settlements = useSelector(selectSettlements)
  const playerCountryId = useSelector(selectPlayerCountryId)
  const activeBattle = useSelector(selectActiveBattle)

  // Initialize SoundManager and handle music switching
  useEffect(() => {
    SoundManager.getInstance().playBGM('peace')
    return () => {
      SoundManager.getInstance().stopBGM()
    }
  }, [])

  useEffect(() => {
    if (activeBattle) {
      SoundManager.getInstance().playBGM('battle')
    } else {
      SoundManager.getInstance().playBGM('peace')
    }
  }, [activeBattle])

  // Auto-switch to Chinese when Debug Mode is enabled
  useEffect(() => {
    if (debugMode) {
      LocManager.getInstance().setLanguage('zh')
    }
  }, [debugMode])

  useEffect(() => {
    // Initialize GameController and load map
    const controller = GameController.getInstance()
    const settlementIds = initialMap.map(s => s.id)
    const initialAdvisors = generateInitialAdvisors(settlementIds)
    controller.loadMap(initialMap, initialCountries, initialArmies, initialAdvisors)
  }, [])

  const closeView = () => setActiveView(null)

  const cancelArmyMoveMode = () => {
    setMapInteractionMode('normal')
    setSelectedArmyForMove(null)
    setValidTargetSettlementIds([])
  }

  const computeValidTargets = (): string[] => {
    if (!playerCountryId) return []

    const isNeighborToPlayer = (targetId: string): boolean => {
      const targetSettlement = settlements.find(s => s.id === targetId)
      if (!targetSettlement) return false

      return settlements.some(s =>
        s.ownerId === playerCountryId &&
        (
          targetSettlement.connections.some(conn => {
            const target = typeof conn === 'string' ? conn : conn.targetId
            const type = typeof conn === 'string' ? 'normal' : conn.type
            return type !== 'disabled' && target === s.id
          }) ||
          s.connections.some(conn => {
            const target = typeof conn === 'string' ? conn : conn.targetId
            const type = typeof conn === 'string' ? 'normal' : conn.type
            return type !== 'disabled' && target === targetSettlement.id
          })
        )
      )
    }

    return settlements
      .filter(s => s.ownerId !== playerCountryId && isNeighborToPlayer(s.id))
      .map(s => s.id)
  }

  const handleSelectArmyForMove = (armyId: string) => {
    const targets = computeValidTargets()
    setSelectedArmyForMove(armyId)
    setValidTargetSettlementIds(targets)
    setMapInteractionMode('armyMove')
    setActiveView(null)
  }

  const handleProvinceSelect = (settlementId: string) => {
    if (mapInteractionMode === 'armyMove') return
    setSelectedSettlementId(settlementId)
  }

  const handleArmyMoveTargetSelect = (settlementId: string) => {
    if (mapInteractionMode !== 'armyMove') return
    if (!validTargetSettlementIds.includes(settlementId)) return
    GameController.getInstance().initiateAttack(settlementId)
    cancelArmyMoveMode()
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <TopBar onOpenView={setActiveView} />
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button 
            onClick={() => setDebugMode(!debugMode)}
            className={`px-3 py-1 rounded text-xs font-bold border ${
              debugMode ? 'bg-red-500 text-white border-red-600' : 'bg-gray-800 text-white border-gray-900'
            }`}
          >
            {debugMode ? 'DEBUG ON' : 'DEBUG OFF'}
          </button>
          
          <div className="flex bg-gray-800 rounded border border-gray-900 overflow-hidden">
            <button
              onClick={() => setMapMode('political')}
              className={`px-3 py-1 text-xs font-bold ${
                mapMode === 'political' ? 'bg-antique-gold text-antique-dark' : 'text-gray-400 hover:text-white'
              }`}
            >
              POLITICAL
            </button>
            <button
              onClick={() => setMapMode('terrain')}
              className={`px-3 py-1 text-xs font-bold ${
                mapMode === 'terrain' ? 'bg-antique-gold text-antique-dark' : 'text-gray-400 hover:text-white'
              }`}
            >
              TERRAIN
            </button>
          </div>

          <button
            onClick={() => setShowConnections(v => !v)}
            className={`px-3 py-1 rounded text-xs font-bold border ${
              showConnections ? 'bg-antique-gold text-antique-dark border-antique-gold' : 'bg-gray-800 text-gray-300 border-gray-900'
            }`}
          >
            ROADS
          </button>
        </div>

        {mapInteractionMode === 'armyMove' && selectedArmyForMove && (
          <div className="absolute top-20 left-4 z-50 px-3 py-2 rounded-sm bg-red-900 text-antique-paper border border-antique-gold shadow">
            <div className="text-xs font-bold tracking-wide uppercase">Army Move Mode</div>
            <div className="text-xs mt-1">Click a highlighted province to move this army.</div>
            <button
              onClick={cancelArmyMoveMode}
              className="mt-2 px-2 py-1 text-xs font-bold rounded-sm bg-antique-paper text-antique-dark border border-antique-gold hover:bg-antique-gold"
            >
              Cancel
            </button>
          </div>
        )}

        {/* <WorldMap onSettlementSelect={setSelectedSettlementId} /> */}
        {MAP_ENABLED && (
          <VectorMap 
            mapData={vectorMapData} 
            onProvinceSelect={handleProvinceSelect}
            width={4096} // Adjust based on your actual image size
            height={4096}
            debugMode={debugMode}
            mapMode={mapMode}
            showConnections={showConnections}
            selectedSettlementId={selectedSettlementId}
            interactionMode={mapInteractionMode}
            validTargetSettlementIds={validTargetSettlementIds}
            onTargetSelect={handleArmyMoveTargetSelect}
          />
        )}
        
        {selectedSettlementId && !debugMode && (
          <SettlementPanel 
            settlementId={selectedSettlementId} 
            onClose={() => setSelectedSettlementId(null)} 
          />
        )}

        {selectedSettlementId && debugMode && (
          <DebugSettlementPanel
            settlementId={selectedSettlementId} 
            onClose={() => setSelectedSettlementId(null)} 
          />
        )}
        
        {activeView === 'country' && <CountryView onClose={closeView} />}
        {activeView === 'tech' && <TechView onClose={closeView} />}
        {activeView === 'ideas' && <IdeaView onClose={closeView} />}
        {activeView === 'military' && (
          <MilitaryView
            onClose={closeView}
            onSelectArmyForMove={handleSelectArmyForMove}
            selectedArmyIdForMove={selectedArmyForMove}
          />
        )}
        {activeView === 'diplomacy' && <DiplomacyView onClose={closeView} />}
        {activeView === 'advisors' && <AdvisorView onClose={closeView} />}
        {activeView === 'warehouse' && <WarehouseView onClose={closeView} />}
        {activeView === 'options' && <OptionsView onClose={closeView} />}

        <EventModal />
        <BattleView />
      </div>
    </div>
  )
}
