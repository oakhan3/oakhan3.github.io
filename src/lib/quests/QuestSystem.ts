export interface Quest {
  name: string[]
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
    const quest = this.quests.find((quest) => quest.name.includes(name))
    if (!quest) return null
    if (this.completed.has(quest.label)) return null
    this.completed.add(quest.label)
    return quest
  }

  isComplete(name: string): boolean {
    const quest = this.quests.find((quest) => quest.name.includes(name))
    return quest ? this.completed.has(quest.label) : false
  }

  // Returns true when all quests with a real label (non-'???') are completed.
  isAllComplete(): boolean {
    return this.quests.filter((quest) => quest.label !== '???').every((quest) => this.completed.has(quest.label))
  }

  getAll(): Array<Quest & { completed: boolean }> {
    return this.quests.map((quest) => ({ ...quest, completed: this.completed.has(quest.label) }))
  }
}
