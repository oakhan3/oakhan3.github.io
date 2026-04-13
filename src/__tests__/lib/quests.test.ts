import { describe, it, expect, beforeEach } from 'vitest'
import { QuestSystem } from '../../lib/quests'
import type { Quest } from '../../lib/quests'

const QUESTS: Quest[] = [
  { name: ['kiwi-sign'], label: 'Find Kiwi' },
  { name: ['office-sign', 'office'], label: 'Find Omar at work' },
  { name: ['github-sign'], label: "Find Omar's GitHub" },
]

describe('QuestSystem', () => {
  let system: QuestSystem

  beforeEach(() => {
    system = new QuestSystem(QUESTS)
  })

  it('returns the quest on first completion', () => {
    const result = system.complete('kiwi-sign')
    expect(result).toEqual({ name: ['kiwi-sign'], label: 'Find Kiwi' })
  })

  it('returns null for an unknown name', () => {
    expect(system.complete('unknown-sign')).toBeNull()
  })

  it('returns null when already completed via the same name', () => {
    system.complete('kiwi-sign')
    expect(system.complete('kiwi-sign')).toBeNull()
  })

  it('marks the quest complete when triggered by any name in the list', () => {
    const result = system.complete('office')
    expect(result).toEqual({ name: ['office-sign', 'office'], label: 'Find Omar at work' })
  })

  it('returns null when already completed via a different trigger', () => {
    system.complete('office-sign')
    expect(system.complete('office')).toBeNull()
  })

  it('reports the quest as complete after completing', () => {
    system.complete('office-sign')
    expect(system.isComplete('office-sign')).toBe(true)
  })

  it('reports the quest as complete via any trigger name', () => {
    system.complete('office-sign')
    expect(system.isComplete('office')).toBe(true)
  })

  it('reports the quest as incomplete before completing', () => {
    expect(system.isComplete('office-sign')).toBe(false)
  })

  it('returns all quests with correct completed flags', () => {
    system.complete('kiwi-sign')
    const all = system.getAll()
    expect(all).toEqual([
      { name: ['kiwi-sign'], label: 'Find Kiwi', completed: true },
      { name: ['office-sign', 'office'], label: 'Find Omar at work', completed: false },
      { name: ['github-sign'], label: "Find Omar's GitHub", completed: false },
    ])
  })
})
