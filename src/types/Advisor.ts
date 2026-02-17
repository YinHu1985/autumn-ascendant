export interface Advisor {
  id: string
  name: string
  level: 1 | 2 | 3 | 4 | 5
  specialAbilities: string[] // Placeholder for now
  biography: string
  location: string | null // Settlement ID, null if not placed yet (though user said randomly put them)
  ownerId: string | null // Country ID, null if not hired
  portrait: string // URL or asset path
}
