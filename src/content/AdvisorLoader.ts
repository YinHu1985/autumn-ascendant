import { Advisor } from '../types/Advisor'
import rawAdvisorData from '../data/advisors.json'
import { RawAdvisor } from '../types/RawData'

const ADVISOR_DATA: RawAdvisor[] = rawAdvisorData as RawAdvisor[]

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const generateInitialAdvisors = (settlementIds: string[]): Advisor[] => {
  return ADVISOR_DATA.map((data) => {
    // Random location if settlements provided
    const location = settlementIds.length > 0 ? getRandom(settlementIds) : null

    return {
      ...data,
      name: data.name || `advisor.${data.id}.name`,
      biography: data.biography || `advisor.${data.id}.desc`,
      level: data.level as 1 | 2 | 3 | 4 | 5,
      location,
      ownerId: null, // Initially unhired
    }
  })
}
