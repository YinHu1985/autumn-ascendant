import { useState } from 'react';
import { SoundManager } from '../systems/SoundManager';
import { LocManager } from '../systems/LocManager';

interface OptionsViewProps {
  onClose: () => void;
}

export default function OptionsView({ onClose }: OptionsViewProps) {
  const soundManager = SoundManager.getInstance();
  const loc = LocManager.getInstance();
  const t = (k: string) => loc.t(k);
  
  const [bgmVol, setBgmVol] = useState(soundManager.getBGMVolume());
  const [sfxVol, setSfxVol] = useState(soundManager.getSFXVolume());

  const handleBgmChange = (v: number) => {
    setBgmVol(v);
    soundManager.setBGMVolume(v);
  };

  const handleSfxChange = (v: number) => {
    setSfxVol(v);
    soundManager.setSFXVolume(v);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-96 p-6 rounded-sm shadow-2xl border-4 border-double border-antique-wood relative">
        <h2 className="text-2xl font-bold text-antique-dark mb-4 border-b-2 border-antique-gold pb-2 uppercase tracking-wider">{t('options.title')}</h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-antique-wood font-bold uppercase text-sm">{t('options.bgmVolume')}</label>
              <span className="text-xs text-antique-wood font-mono">{Math.round(bgmVol * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={bgmVol}
              onChange={(e) => handleBgmChange(parseFloat(e.target.value))}
              className="w-full accent-antique-gold h-2 bg-antique-wood/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-antique-wood font-bold uppercase text-sm">{t('options.sfxVolume')}</label>
              <span className="text-xs text-antique-wood font-mono">{Math.round(sfxVol * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={sfxVol}
              onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
              className="w-full accent-antique-gold h-2 bg-antique-wood/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-antique-wood text-antique-white rounded-sm font-bold hover:bg-antique-dark transition-colors border-2 border-antique-gold uppercase tracking-widest shadow-md active:transform active:translate-y-0.5"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
