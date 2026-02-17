import { LocManager } from '../systems/LocManager'
import { Settlement } from '../types/Settlement'
import { Technology } from '../types/Technology'

/**
 * Gets the localized name for a settlement.
 * Pattern: settlement.{id}.name
 * Fallback: settlement.name
 */
export const getSettlementName = (settlement: Settlement): string => {
  const loc = LocManager.getInstance()
  const key = `settlement.${settlement.id}.name`
  return loc.hasKey(key) ? loc.t(key) : settlement.name
}

/**
 * Gets the localized name for a technology.
 * Pattern: tech.{id}.name
 * Fallback: tech.name
 */
export const getTechName = (tech: Technology): string => {
  const loc = LocManager.getInstance()
  const key = `tech.${tech.id}.name`
  return loc.hasKey(key) ? loc.t(key) : tech.name
}

/**
 * Gets the localized description for a technology.
 * Pattern: tech.{id}.desc
 * Fallback: tech.description
 */
export const getTechDescription = (tech: Technology): string => {
  const loc = LocManager.getInstance()
  const key = `tech.${tech.id}.desc`
  return loc.hasKey(key) ? loc.t(key) : tech.description
}
