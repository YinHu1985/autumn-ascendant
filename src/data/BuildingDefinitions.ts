import { Building } from '../types/Building'

const createBuilding = (
  id: string,
  name: string,
  cost: { gold: number, metal?: number, food?: number },
  modifierTarget: string,
  value: number = 1
): Building => ({
  id: `bldg_${id}`,
  name,
  description: `${name} building.`,
  cost,
  modifiers: [{
    id: `mod_bldg_${id}`,
    name: `${name} Production`,
    targetAttribute: modifierTarget,
    operator: 'add_flat',
    value
  }]
})

const forestry: Building = {
  id: 'bldg_forestry',
  name: 'Forestry',
  description: 'Produces logs from rural labor.',
  cost: { gold: 100 },
  modifiers: [],
  monthlyMaintenance: 1,
  inputStockpile: {},
  outputStockpile: { logs: 5 },
  requiredProduct: 'logs',
}

const lumberMill: Building = {
  id: 'bldg_lumber_mill',
  name: 'Lumber Mill',
  description: 'Turns logs into lumber.',
  cost: { gold: 150 },
  modifiers: [],
  monthlyMaintenance: 2,
  inputStockpile: { logs: 4 },
  outputStockpile: { lumber: 2 },
}

const furnitureWorkshop: Building = {
  id: 'bldg_furniture_workshop',
  name: 'Furniture Workshop',
  description: 'Uses lumber to produce furniture.',
  cost: { gold: 200 },
  modifiers: [],
  monthlyMaintenance: 3,
  inputStockpile: { lumber: 3 },
  outputStockpile: { furniture: 1 },
}

export const buildings: Building[] = [
  createBuilding('sishu', '私塾 (Private School)', { gold: 100 }, 'monthly_tradition_confucianism'),
  createBuilding('daoguan', '道观 (Taoist Temple)', { gold: 100 }, 'monthly_tradition_taoism'),
  createBuilding('lvlingfu', '律令府 (Law Office)', { gold: 150 }, 'monthly_tradition_legalism'),
  createBuilding('mozhe', '墨者行会 (Mohist Guild)', { gold: 120, metal: 50 }, 'monthly_tradition_mohism'),
  createBuilding('yanwuchang', '演武场 (Drill Ground)', { gold: 200, food: 100 }, 'monthly_tradition_military'),
  createBuilding('nongshe', '农社 (Farming Society)', { gold: 80, food: 50 }, 'monthly_tradition_agricultural'),
  createBuilding('zonghengguan', '纵横馆 (Diplomacy Hall)', { gold: 150 }, 'monthly_tradition_diplomacy'),
  createBuilding('biantan', '辩坛 (Debate Platform)', { gold: 100 }, 'monthly_tradition_logicians'),
  createBuilding('zajiayuan', '杂家院 (Misc Courtyard)', { gold: 100 }, 'monthly_tradition_misc'),
  createBuilding('gongfang', '工坊 (Workshop)', { gold: 200, metal: 100 }, 'monthly_engineering_practice', 5),
  createBuilding('bingying', '兵营 (Barracks)', { gold: 300, food: 200 }, 'monthly_military_practice', 5),
  forestry,
  lumberMill,
  furnitureWorkshop,
]
