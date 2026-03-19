import { describe, it, expect, afterEach } from 'vitest'
import { createGame, GAME_CONFIG } from '../main'
import { GBA_WIDTH, GBA_HEIGHT } from '../config'

function waitForScene(game: Phaser.Game, sceneKey: string): Promise<Phaser.Scene> {
  return new Promise((resolve) => {
    const check = () => {
      const scene = game.scene.getScene(sceneKey)
      if (scene && game.scene.isActive(sceneKey)) {
        resolve(scene)
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  })
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function simulateKeyPress(game: Phaser.Game): void {
  // Phaser's KeyboardManager registers onKeyDown as a native event handler.
  // Calling it directly queues the event and triggers MANAGER_PROCESS,
  // which causes Phaser to process the keyboard input on the next step.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyboard = (game.input as any).keyboard as { onKeyDown: (event: KeyboardEvent) => void }
  keyboard.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }))
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('game config', () => {
  it('uses GBA native resolution', () => {
    expect(GAME_CONFIG.scale?.width).toBe(GBA_WIDTH)
    expect(GAME_CONFIG.scale?.height).toBe(GBA_HEIGHT)
  })

  it('enables pixel art rendering', () => {
    expect(GAME_CONFIG.pixelArt).toBe(true)
    expect(GAME_CONFIG.roundPixels).toBe(true)
  })

  it('uses arcade physics with no gravity', () => {
    expect(GAME_CONFIG.physics?.default).toBe('arcade')
    expect(GAME_CONFIG.physics?.arcade?.gravity).toEqual({ x: 0, y: 0 })
  })
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
    simulateKeyPress(game)

    const overworldScene = await waitForScene(game, 'OverworldScene')
    expect(overworldScene).toBeDefined()
    expect(game.scene.isActive('BootScene')).toBe(false)
  })
})
