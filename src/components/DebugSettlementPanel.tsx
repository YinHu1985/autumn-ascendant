
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectSettlements, updateSettlement } from '../store/gameState'
import type { Settlement, TerrainType, Connection, ConnectionType } from '../types/Settlement'

import { LocManager } from '../systems/LocManager'

interface DebugSettlementPanelProps {
  settlementId: string
  onClose: () => void
}

const TERRAIN_OPTIONS: TerrainType[] = ['plain', 'forest', 'hills', 'mountains', 'water', 'marsh']
const CONNECTION_TYPES: ConnectionType[] = ['normal', 'river', 'disabled']

export default function DebugSettlementPanel({ settlementId, onClose }: DebugSettlementPanelProps) {
  const dispatch = useDispatch()
  const settlements = useSelector(selectSettlements)
  const settlement = settlements.find(s => s.id === settlementId)
  
  // Localization State
  const locManager = LocManager.getInstance()
  const currentLang = locManager.getLanguage()
  // We use local state for the input to avoid flickering, but commit on change
  // For 'zh' mode, we load the localized name. For 'en', we load settlement.name
  // Actually, settlement.name is the fallback. 
  // Let's just follow the rule: if 'zh', edit 'settlement.{id}.name'. If 'en', edit settlement.name
  
  // However, we need to know what to display.
  // Ideally, we want to edit the *localized* value if in ZH.
  
  const getEditableName = () => {
    if (currentLang === 'zh') {
       const key = `settlement.${settlementId}.name`
       // Use t() but we want the raw value if it exists, or empty if it falls back to key?
       // t() returns key if missing. 
       // But wait, if we are in ZH mode, we want to see the Chinese name.
       // If no Chinese name exists yet, it might return English name (if fallback logic existed) or key.
       // Our t() returns key if missing.
       // But getSettlementName utils returns settlement.name fallback.
       // Here we want to edit the override.
       return locManager.hasKey(key) ? locManager.t(key) : ''
    }
    return settlement?.name || ''
  }

  const [localName, setLocalName] = useState(getEditableName())

  // Update local name when settlement or lang changes
  useEffect(() => {
    if (settlement) {
      setLocalName(getEditableName())
    }
  }, [settlement?.id, currentLang])
  
  if (!settlement) return null

  // Local state for editing form, initialized with settlement data
  // Note: We'll dispatch updates immediately on change for live preview
  
  const handleNameChange = (val: string) => {
    setLocalName(val)
    if (currentLang === 'zh') {
       // Update Localization Override
       locManager.setOverride('zh', `settlement.${settlement.id}.name`, val)
    } else {
       // Update Model Name
       dispatch(updateSettlement({
         ...settlement,
         name: val
       }))
    }
  }

  const handleChange = (field: keyof Settlement, value: any) => {
    dispatch(updateSettlement({
      ...settlement,
      [field]: value
    }))
  }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    dispatch(updateSettlement({
      ...settlement,
      position: {
        ...settlement.position,
        [axis]: value
      }
    }))
  }

  const handleConnectionChange = (targetId: string, newType: ConnectionType) => {
    // 1. Update this settlement's connection
    const newConnections = settlement.connections.map(c => {
      // Normalize existing connection string to object if needed (migration handling)
      const connId = typeof c === 'string' ? c : c.targetId
      
      if (connId === targetId) {
        return { targetId, type: newType }
      }
      return typeof c === 'string' ? { targetId: c, type: 'normal' as const } : c
    })
    
    dispatch(updateSettlement({
      ...settlement,
      connections: newConnections
    }))

    // 2. Update the target settlement's connection (Bidirectional)
    const targetSettlement = settlements.find(s => s.id === targetId);
    if (targetSettlement) {
      const newTargetConnections = targetSettlement.connections.map(c => {
        const connId = typeof c === 'string' ? c : c.targetId
        if (connId === settlement.id) {
           return { targetId: settlement.id, type: newType }
        }
        return typeof c === 'string' ? { targetId: c, type: 'normal' as const } : c
      });
      
      dispatch(updateSettlement({
        ...targetSettlement,
        connections: newTargetConnections
      }))
    }
  }

  const handleExportMap = () => {
    // Create a blob from the current settlements data
    // We export the entire list, not just this one
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settlements, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "worldMap.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  const handleExportLoc = () => {
    // Export the merged localization file for the current language (likely ZH)
    const data = locManager.getMergedLocale(currentLang)
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${currentLang}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 bg-gray-100 shadow-xl border-l border-gray-300 overflow-y-auto p-4 z-50 font-sans text-sm text-gray-900">
      <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
        <h2 className="text-lg font-bold text-gray-800">Debug: {settlement.id} ({currentLang.toUpperCase()})</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500 font-bold">✕</button>
      </div>

      <div className="space-y-4">
        {/* Actions */}
        <div className="flex gap-2 mb-4">
           <button 
             onClick={handleExportMap}
             className="flex-1 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 text-xs"
           >
             Export Map JSON
           </button>
           <button 
             onClick={handleExportLoc}
             className="flex-1 py-1 bg-green-600 text-white rounded font-bold hover:bg-green-700 text-xs"
           >
             Export Loc ({currentLang.toUpperCase()})
           </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
            {currentLang === 'zh' ? 'Localized Name (ZH)' : 'Name (ID/Tag)'}
          </label>
          <input 
            type="text" 
            value={localName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder={currentLang === 'zh' ? 'Enter Chinese Name' : 'Enter Name'}
          />
          {currentLang === 'zh' && (
            <div className="text-xs text-gray-500 mt-1">
              Original ID: {settlement.id} <br/>
              Default Name: {settlement.name}
            </div>
          )}
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pos X</label>
            <input 
              type="number" 
              value={settlement.position.x}
              onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
              className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pos Y</label>
            <input 
              type="number" 
              value={settlement.position.y}
              onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
              className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Terrain */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Terrain</label>
          <select 
            value={settlement.terrain || 'plain'} 
            onChange={(e) => handleChange('terrain', e.target.value)}
            className="w-full border border-gray-300 p-1 rounded bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {TERRAIN_OPTIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Connections */}
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Connections</label>
          <div className="space-y-2 bg-white p-2 rounded border border-gray-300 max-h-60 overflow-y-auto">
            {settlement.connections.map(c => {
               const targetId = typeof c === 'string' ? c : c.targetId
               const type = typeof c === 'string' ? 'normal' : c.type
               return (
                 <div key={targetId} className="flex items-center justify-between border-b border-gray-100 pb-1 last:border-0">
                   <span className="text-xs truncate w-1/3 text-gray-700" title={targetId}>{targetId}</span>
                   <div className="flex gap-1">
                     {CONNECTION_TYPES.map(ct => (
                       <button
                         key={ct}
                         onClick={() => handleConnectionChange(targetId, ct)}
                         className={`px-2 py-0.5 text-[10px] rounded border ${
                           type === ct 
                             ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-sm' 
                             : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                         }`}
                       >
                         {ct}
                       </button>
                     ))}
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
