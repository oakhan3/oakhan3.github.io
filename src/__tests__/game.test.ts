import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { waitForScene, delay, simulateKeyDown } from './testing'

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('game boot', () => {
  it('creates a game instance and starts BootScene', async () => {
    game = createGame()
    await waitForScene(game, 'BootScene')

    expect(game.scene.isActive('BootScene')).toBe(true)
  })

  it('registers all three scenes', async () => {
    game = createGame()
    await waitForScene(game, 'BootScene')

    expect(game.scene.getScene('BootScene')).toBeDefined()
    expect(game.scene.getScene('PreloadScene')).toBeDefined()
    expect(game.scene.getScene('OverworldScene')).toBeDefined()
  })
})

describe('scene transitions', () => {
  it('transitions from Boot through Preload to Overworld on key press', async () => {
    game = createGame()
    await waitForScene(game, 'BootScene')

    await delay(100)
    simulateKeyDown(game, 'Enter', 13)

    const overworldScene = await waitForScene(game, 'OverworldScene')
    expect(overworldScene).toBeDefined()
    expect(game.scene.isActive('BootScene')).toBe(false)
  })
})
