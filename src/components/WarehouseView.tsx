import React from 'react'
import { useSelector } from 'react-redux'
import { selectCountries, selectPlayerCountryId } from '../store/gameState'
import { ResourceId } from '../types/Country'
import { getAllResourceIds, getResourcePrice } from '../content/ResourceLoader'
import GameController from '../controllers/GameController'
import { LocManager } from '../systems/LocManager'

interface WarehouseViewProps {
  onClose: () => void
}

export default function WarehouseView({ onClose }: WarehouseViewProps) {
  const countries = useSelector(selectCountries)
  const playerId = useSelector(selectPlayerCountryId)
  const country = countries[playerId]
  const t = (key: string) => LocManager.getInstance().t(key)

  if (!country) return null

  const formatAmount = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const resourceList: ResourceId[] = getAllResourceIds()

  const handleTrade = (resourceId: ResourceId, quantity: number) => {
    GameController.getInstance().tradeResource(playerId, resourceId, quantity)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 font-serif">
      <div className="bg-antique-white w-3/4 h-3/4 rounded-sm shadow-2xl flex flex-col p-6 border-4 border-double border-antique-wood">
        <div className="flex justify-between items-end mb-6 border-b-2 border-antique-gold pb-4">
          <div>
            <h1 className="text-4xl font-bold text-antique-dark tracking-widest uppercase">
              {t('view.warehouse')}
            </h1>
            <div className="mt-2 text-sm text-antique-wood">
              {t('country.gold')}:{" "}
              <span className="font-mono font-bold text-antique-dark">
                {formatAmount(country.resources.cash)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-antique-wood hover:text-antique-red text-2xl font-bold transition-colors"
          >
            {t('common.close')}
          </button>
        </div>

        <div className="flex-1 bg-antique-paper p-6 rounded-sm shadow-md border border-antique-gold overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourceList.map(id => {
              const value = country.resources.stockpile?.[id] ?? 0
              const basePrice = getResourcePrice(id)
              const buyPrice = basePrice
              const sellPrice = basePrice / 2
              const label = t(`resource.${id}`)
              return (
              <div
                key={id}
                className="flex flex-col justify-between p-3 bg-antique-white rounded-sm border border-antique-gold/40"
              >
                <div className="text-sm font-bold text-antique-dark uppercase tracking-wide">
                  {label}
                </div>
                <div className="mt-1 text-lg font-mono font-bold text-antique-wood text-right">
                  {formatAmount(value)}
                </div>
                <div className="mt-2 text-xs text-antique-wood flex justify-between">
                  <span>Buy: {formatAmount(buyPrice)}</span>
                  <span>Sell: {formatAmount(sellPrice)}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <button
                    onClick={() => handleTrade(id, 10)}
                    className="py-1 px-1 border border-antique-gold rounded-sm bg-antique-wood text-antique-white hover:bg-antique-dark transition-colors"
                  >
                    Buy 10
                  </button>
                  <button
                    onClick={() => handleTrade(id, 100)}
                    className="py-1 px-1 border border-antique-gold rounded-sm bg-antique-wood text-antique-white hover:bg-antique-dark transition-colors"
                  >
                    Buy 100
                  </button>
                  <button
                    onClick={() => handleTrade(id, 1000)}
                    className="py-1 px-1 border border-antique-gold rounded-sm bg-antique-wood text-antique-white hover:bg-antique-dark transition-colors"
                  >
                    Buy 1000
                  </button>
                  <button
                    onClick={() => handleTrade(id, -10)}
                    className="py-1 px-1 border border-antique-gold rounded-sm bg-antique-paper text-antique-dark hover:bg-antique-gold transition-colors"
                  >
                    Sell 10
                  </button>
                  <button
                    onClick={() => handleTrade(id, -100)}
                    className="py-1 px-1 border border-antique-gold rounded-sm bg-antique-paper text-antique-dark hover:bg-antique-gold transition-colors"
                  >
                    Sell 100
                  </button>
                  <button
                    onClick={() => handleTrade(id, -1000)}
                    className="py-1 px-1 border border-antique-gold rounded-sm bg-antique-paper text-antique-dark hover:bg-antique-gold transition-colors"
                  >
                    Sell 1000
                  </button>
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
