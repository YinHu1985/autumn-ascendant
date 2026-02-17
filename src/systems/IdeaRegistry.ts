import { Idea } from '../types/Idea'
import { ideas } from '../data/IdeaDefinitions'

export class IdeaRegistry {
  private static instance: IdeaRegistry
  private ideas: Map<string, Idea> = new Map()

  private constructor() {
    this.registerIdeas()
  }

  static getInstance(): IdeaRegistry {
    if (!IdeaRegistry.instance) {
      IdeaRegistry.instance = new IdeaRegistry()
    }
    return IdeaRegistry.instance
  }

  registerIdea(idea: Idea) {
    this.ideas.set(idea.id, idea)
  }

  getIdea(id: string): Idea | undefined {
    return this.ideas.get(id)
  }

  getAllIdeas(): Idea[] {
    return Array.from(this.ideas.values())
  }

  getIdeasBySchool(school: string): Idea[] {
    return this.getAllIdeas().filter(i => i.school === school)
  }

  private registerIdeas() {
    ideas.forEach(idea => this.registerIdea(idea))
  }
}
