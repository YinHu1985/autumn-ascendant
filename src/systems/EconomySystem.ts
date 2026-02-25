import { GameState } from '../store/gameState'
import { ModifierRegistry } from './ModifierRegistry'
import { SCHOOLS, School, ResourceId } from '../types/Country'
import { BuildingRegistry } from './BuildingRegistry'

/**
 * Process economy for all settlements and update country resources
 * Triggered monthly
 */
export function processEconomy(state: GameState): void {
  const registry = ModifierRegistry.getInstance()
  const settlements = state.settlements
  const buildingRegistry = BuildingRegistry.getInstance()

  // Accumulate production per country
  // Using a temporary map to store deltas
  const countryDeltas: Record<string, { 
    cash: number, 
    engineering_practice: number,
    military_practice: number,
    tradition: Record<School, number>,
    stockpile: Record<string, number>
  }> = {}

  for (const settlement of settlements) {
    const ownerId = settlement.ownerId
    if (!ownerId || !state.countries[ownerId]) continue
    const country = state.countries[ownerId]

    if (!countryDeltas[ownerId]) {
      countryDeltas[ownerId] = { 
        cash: 0,
        engineering_practice: 0, military_practice: 0,
        tradition: SCHOOLS.reduce((acc, s) => ({...acc, [s]: 0}), {} as Record<School, number>),
        stockpile: {}
      }
    }

    // Base Production Rules
    // Urban Pop -> Cash (1 per 1000)
    const baseCash = settlement.population.urban / 1000

    // Rural Pop -> Local Product (1 per 1000)
    if (settlement.localProduct) {
      const baseResource = settlement.population.rural / 1000
      const finalResource = registry.calculateValue(baseResource, `production_${settlement.localProduct}`, settlement.id)
      const current = countryDeltas[ownerId].stockpile[settlement.localProduct] || 0
      countryDeltas[ownerId].stockpile[settlement.localProduct] = current + finalResource
    }

    // Apply Modifiers
    const finalCash = registry.calculateValue(baseCash, 'production_gold', settlement.id)

    const finalEng = registry.calculateValue(0, 'monthly_engineering_practice', settlement.id)
    const finalMil = registry.calculateValue(0, 'monthly_military_practice', settlement.id)

    countryDeltas[ownerId].cash += finalCash
    countryDeltas[ownerId].engineering_practice += finalEng
    countryDeltas[ownerId].military_practice += finalMil

    SCHOOLS.forEach(school => {
      const val = registry.calculateValue(0, `monthly_tradition_${school}`, settlement.id)
      countryDeltas[ownerId].tradition[school] += val
    })

    if (settlement.buildings && settlement.buildings.length > 0) {
      const resources = country.resources
      settlement.buildings.forEach(bid => {
        const building = buildingRegistry.getBuilding(bid)
        if (!building) return

        if (building.monthlyMaintenance) {
          resources.cash -= building.monthlyMaintenance
        }

        if (building.inputStockpile || building.outputStockpile) {
          const inputs = building.inputStockpile || {}
          let canRun = true
          for (const [rid, amount] of Object.entries(inputs)) {
            const key = rid as ResourceId
            const current = resources.stockpile[key] ?? 0
            if (current - (amount || 0) < 0) {
              canRun = false
              break
            }
          }

          if (canRun) {
            for (const [rid, amount] of Object.entries(inputs)) {
              const key = rid as ResourceId
              resources.stockpile[key] -= amount || 0
            }
            const outputs = building.outputStockpile || {}
            for (const [rid, amount] of Object.entries(outputs)) {
              const key = rid as ResourceId
              resources.stockpile[key] += amount || 0
            }
          }
        }
      })
    }
  }

  // Apply updates to state
  for (const [countryId, delta] of Object.entries(countryDeltas)) {
    const country = state.countries[countryId]
    if (country) {
      country.resources.cash += delta.cash
      
      country.resources.engineering_practice = (country.resources.engineering_practice || 0) + delta.engineering_practice
      country.resources.military_practice = (country.resources.military_practice || 0) + delta.military_practice
      
      if (!country.resources.tradition) {
        country.resources.tradition = SCHOOLS.reduce((acc, s) => ({...acc, [s]: 0}), {} as Record<School, number>)
      }
      SCHOOLS.forEach(school => {
        country.resources.tradition[school] = (country.resources.tradition[school] || 0) + delta.tradition[school]
      })

      // Apply stockpile deltas
      if (delta.stockpile) {
        for (const [rid, amount] of Object.entries(delta.stockpile)) {
          country.resources.stockpile[rid] = (country.resources.stockpile[rid] || 0) + amount
        }
      }
    }
  }

}
