import { describe, it, expect, beforeEach } from 'vitest'
import { QuestSystem } from '../../lib/quests'
import type { Quest } from '../../lib/quests'

const QUESTS: Quest[] = [
  { name: 'kiwi-sign', label: 'Find Kiwi' },
  { name: 'office-sign', label: 'Find Omar at work' },
  { name: 'github-sign', label: "Find Omar's GitHub" },
]

describe('QuestSystem', () => {
  let system: QuestSystem

  beforeEach(() => {
    system = new QuestSystem(QUESTS)
  })

  it('complete returns the quest on first completion', () => {
    const result = system.complete('kiwi-sign')
    expect(result).toEqual({ name: 'kiwi-sign', label: 'Find Kiwi' })
  })

  it('complete returns null for an unknown name', () => {
    expect(system.complete('unknown-sign')).toBeNull()
  })

  it('complete returns null when already completed', () => {
    system.complete('kiwi-sign')
    expect(system.complete('kiwi-sign')).toBeNull()
  })

  it('isComplete returns true after completing', () => {
    system.complete('office-sign')
    expect(system.isComplete('office-sign')).toBe(true)
  })

  it('isComplete returns false before completing', () => {
    expect(system.isComplete('office-sign')).toBe(false)
  })

  it('getAll returns all quests with correct completed flags', () => {
    system.complete('kiwi-sign')
    const all = system.getAll()
    expect(all).toEqual([
      { name: 'kiwi-sign', label: 'Find Kiwi', completed: true },
      { name: 'office-sign', label: 'Find Omar at work', completed: false },
      { name: 'github-sign', label: "Find Omar's GitHub", completed: false },
    ])
  })
})
