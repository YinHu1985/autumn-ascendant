import { Building } from '../types/Building'
import { buildings } from '../content/BuildingLoader'

export class BuildingRegistry {
  private static instance: BuildingRegistry
  private buildings: Map<string, Building> = new Map()

  private constructor() {
    this.registerBuildings()
  }

  static getInstance(): BuildingRegistry {
    if (!BuildingRegistry.instance) {
      BuildingRegistry.instance = new BuildingRegistry()
    }
    return BuildingRegistry.instance
  }

  registerBuilding(b: Building) {
    this.buildings.set(b.id, b)
  }

  getBuilding(id: string): Building | undefined {
    return this.buildings.get(id)
  }

  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values())
  }

  private registerBuildings() {
    buildings.forEach(b => this.registerBuilding(b))
  }
}
