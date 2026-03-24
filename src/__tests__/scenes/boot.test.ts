import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../../main'
import { DEPTH_DIALOG, GBA_WIDTH, GBA_HEIGHT } from '../../config'
import {
  bootToOverworld,
  delay,
  dismissDialog,
  findPlayer,
  simulateKeyDown,
  simulatePointerDown,
  simulatePointerMove,
  simulatePointerUp,
  waitForScene,
} from '../testing'

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

describe('dialog integration', () => {
  it('dialog is visible on overworld start', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const container = scene.children.list.find(
      (child) => child instanceof Phaser.GameObjects.Container && child.depth === DEPTH_DIALOG,
    ) as Phaser.GameObjects.Container

    expect(container.visible).toBe(true)
  })

  it('dialog freezes player while open', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const player = findPlayer(scene)
    const startX = player.x
    const startY = player.y

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyDown(game, 'd', 68)

    expect(player.x).toBe(startX)
    expect(player.y).toBe(startY)
  })

  it('player unfreezes after dialog is dismissed', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyDown(game, 'd', 68)

    expect(player.x).toBeGreaterThan(startX)
  })
})

describe('touch integration', () => {
  it('dragging right moves player right', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(200)

    expect(player.x).toBeGreaterThan(startX)

    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
  })

  it('releasing pointer stops player', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(200)
    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(200)

    const player = findPlayer(scene)
    const posAfterRelease = player.x

    await delay(200)
    expect(player.x).toBe(posAfterRelease)
  })
})
