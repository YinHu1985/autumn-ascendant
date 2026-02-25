import { Technology } from '../types/Technology'
import { Condition } from '../systems/ConditionSystem'
import { RawTechnology } from '../types/RawData'
import rawTechnologies from '../data/technologies.json'

const createTech = (raw: RawTechnology): Technology => {
  const techId = `tech_${raw.id}`
  const costVal = raw.cost || 0
  const prereqs = raw.prerequisites || []
  const excludes = raw.excludes || []
  const modifierTarget = raw.modifierTarget || 'production_gold'

  let condition: Condition | undefined

  // Priority: raw.condition > prereqs/excludes
  if (raw.condition) {
    condition = raw.condition
  } else {
    // Build condition from prereqs and excludes
    const conditions: Condition[] = []
    
    // Prereqs: ACTOR.researchedTechs contains X
    prereqs.forEach(pid => {
      conditions.push({
        scope: 'ACTOR',
        path: 'researchedTechs',
        op: 'contains',
        value: `tech_${pid}`
      })
    })

    // Excludes: ACTOR.researchedTechs NOT contains Y
    excludes.forEach(eid => {
      conditions.push({
        scope: 'ACTOR',
        path: 'researchedTechs',
        op: 'not_contains',
        value: `tech_${eid}`
      })
    })

    if (conditions.length === 1) {
      condition = conditions[0]
    } else if (conditions.length > 1) {
      condition = { AND: conditions }
    }
  }

  return {
    id: techId,
    name: raw.name,
    description: `${raw.name} technology.`,
    category: raw.category,
    cost: raw.category === 'production' ? { engineering_practice: costVal } : 
          raw.category === 'military' ? { military_practice: costVal } : 
          { gold: costVal * 10 }, 
    condition, 
    rewardModifiers: [{
      id: `mod_${raw.id}`,
      name: `${raw.name} Bonus`,
      targetAttribute: modifierTarget,
      operator: 'add_percent',
      value: 0.01
    }]
  }
}

const allTechs = (rawTechnologies as RawTechnology[]).map(createTech)

export const productionTechs: Technology[] = allTechs.filter(t => t.category === 'production')
export const militaryTechs: Technology[] = allTechs.filter(t => t.category === 'military')
export const secretTechs: Technology[] = allTechs.filter(t => t.category === 'secret')

export { allTechs }
