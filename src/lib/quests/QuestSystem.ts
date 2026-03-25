export interface Quest {
  name: string
  label: string
}

export class QuestSystem {
  private quests: Quest[]
  private completed: Set<string>

  constructor(quests: Quest[]) {
    this.quests = quests
    this.completed = new Set()
  }

  // Returns the quest if it was newly completed, null if unknown or already done.
  complete(name: string): Quest | null {
    const quest = this.quests.find((quest) => quest.name === name)
    if (!quest) return null
    if (this.completed.has(name)) return null
    this.completed.add(name)
    return quest
  }

  isComplete(name: string): boolean {
    return this.completed.has(name)
  }

  getAll(): Array<Quest & { completed: boolean }> {
    return this.quests.map((quest) => ({ ...quest, completed: this.completed.has(quest.name) }))
  }
}
