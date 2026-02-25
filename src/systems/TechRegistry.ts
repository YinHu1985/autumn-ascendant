import { Technology } from '../types/Technology'
import { allTechs } from '../content/TechLoader'

export class TechRegistry {
  private static instance: TechRegistry
  private techs: Map<string, Technology> = new Map()

  private constructor() {
    this.registerCoreTechs()
  }

  static getInstance(): TechRegistry {
    if (!TechRegistry.instance) {
      TechRegistry.instance = new TechRegistry()
    }
    return TechRegistry.instance
  }

  registerTech(tech: Technology) {
    this.techs.set(tech.id, tech)
  }

  getTech(id: string): Technology | undefined {
    return this.techs.get(id)
  }

  getAllTechs(): Technology[] {
    return Array.from(this.techs.values())
  }

  getTechsByCategory(category: string): Technology[] {
    return this.getAllTechs().filter(t => t.category === category)
  }

  private registerCoreTechs() {
    allTechs.forEach(tech => this.registerTech(tech))
  }
}
