import { Idea } from '../types/Idea'
import { Condition } from '../systems/ConditionSystem'
import { RawIdea } from '../types/RawData'
import rawIdeas from '../data/ideas.json'

const createIdea = (raw: RawIdea): Idea => {
  const ideaId = `idea_${raw.id}`
  const prereqs = raw.prerequisites || []
  const excludes = raw.excludes || []
  const modifierTarget = raw.modifierTarget || 'stability'

  let condition: Condition | undefined

  // Priority: raw.condition > prereqs/excludes
  if (raw.condition) {
    condition = raw.condition
  } else {
    // Build condition from prereqs and excludes
    const conditions: Condition[] = []

    // Prereqs: ACTOR.adoptedIdeas contains X
    prereqs.forEach(pid => {
      conditions.push({
        scope: 'ACTOR',
        path: 'adoptedIdeas',
        op: 'contains',
        value: `idea_${pid}`
      })
    })

    // Excludes: ACTOR.adoptedIdeas NOT contains Y
    excludes.forEach(eid => {
      conditions.push({
        scope: 'ACTOR',
        path: 'adoptedIdeas',
        op: 'not_contains',
        value: `idea_${eid}`
      })
    })

    if (conditions.length === 1) {
      condition = conditions[0]
    } else if (conditions.length > 1) {
      condition = { AND: conditions }
    }
  }

  return {
    id: ideaId,
    name: raw.name || `idea.${raw.id}.name`,
    description: raw.description || `idea.${raw.id}.desc`,
    school: raw.school,
    cost: raw.cost,
    condition, 
    rewardModifiers: [{
      id: `mod_idea_${raw.id}`,
      name: `${raw.name || `idea.${raw.id}.name`} Effect`,
      targetAttribute: modifierTarget,
      operator: 'add_percent',
      value: 0.05
    }]
  }
}

export const ideas: Idea[] = (rawIdeas as RawIdea[]).map(createIdea)
