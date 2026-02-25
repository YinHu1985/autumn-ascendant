import { Condition } from '../systems/ConditionSystem'
import { TechCategory } from './Technology'
import { School } from './Country'

// Relaxed format for JSON input
export interface RawTechnology {
  id: string
  name: string
  category: TechCategory
  cost?: number
  prerequisites?: string[]
  excludes?: string[]
  condition?: Condition
  modifierTarget?: string
}

export interface RawIdea {
  id: string
  name: string
  school: School
  cost: number
  prerequisites?: string[]
  excludes?: string[]
  condition?: Condition
  modifierTarget?: string
}

export interface RawEventOption {
  text: string
  effectCommand?: { type: string, payload: any } // Optional command to dispatch
}

export interface RawEvent {
  id: string
  title: string
  description: string
  options: RawEventOption[]
  condition?: Condition // The "trigger" condition in JSON logic
  maxFires?: number
  isRandom?: boolean
  mtth?: number
}

export interface RawAdvisor {
  id: string
  name: string
  level: number
  specialAbilities: string[]
  biography: string
  portrait: string
}

export interface RawBuilding {
  id: string
  name: string
  description?: string
  cost: { gold: number, metal?: number, food?: number }
  modifiers?: Array<{
    id: string
    name: string
    targetAttribute: string
    operator: 'add_flat' | 'add_percent' | 'multiply'
    value: number
  }>
  monthlyMaintenance?: number
  inputStockpile?: Record<string, number>
  outputStockpile?: Record<string, number>
  requiredProduct?: string
}

export interface RawResource {
  id: string
  basePrice: number
}
