export type ModifierOperator = 'add_flat' | 'add_percent' | 'multiply'

export interface Modifier {
  id: string
  name: string
  targetAttribute: string
  operator: ModifierOperator
  value: number
}
