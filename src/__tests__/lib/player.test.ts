import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { PlayerSprite } from '../../lib/player/PlayerSprite'
import { PlayerController } from '../../lib/player/PlayerController'
import { TouchControls } from '../../lib/mobile/TouchControls'
import { GBA_WIDTH, GBA_HEIGHT } from '../../config'
import {
  createMinimalGame,
  waitForScene,
  delay,
  waitFor,
  simulateKeyDown,
  simulateKeyUp,
  createStubPlayerAnimations,
} from '../testing'

class PlayerTestScene extends Phaser.Scene {
  player!: PlayerSprite
  controller!: PlayerController

  constructor() {
    super({ key: 'PlayerTestScene' })
  }

  preload() {
    // NOTE: Generate a 48x48 placeholder so PlayerSprite's 'player' texture reference resolves.
    // Physics and position behavior are unaffected by the texture content.
    this.textures.generate('player', { data: ['1'], pixelWidth: 48 })
  }

  create() {
    createStubPlayerAnimations(this)
    const touchControls = new TouchControls(this)
    this.player = new PlayerSprite(this, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    this.controller = new PlayerController(this, this.player, touchControls)
  }

  update() {
    this.controller.update()
  }
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('player controller', () => {
  it('moves right when D is held', async () => {
    game = createMinimalGame([PlayerTestScene], { physics: true })
    const scene = (await waitForScene(game, 'PlayerTestScene')) as PlayerTestScene

    const startX = scene.player.x

    simulateKeyDown(game, 'd', 68)
    await waitFor(() => scene.player.x > startX)
    simulateKeyUp(game, 'd', 68)

    expect(scene.player.x).toBeGreaterThan(startX)
    expect(scene.controller.facing).toBe('right')
  })

  it('moves left and flips sprite when A is held', async () => {
    game = createMinimalGame([PlayerTestScene], { physics: true })
    const scene = (await waitForScene(game, 'PlayerTestScene')) as PlayerTestScene

    const startX = scene.player.x

    simulateKeyDown(game, 'a', 65)
    await waitFor(() => scene.player.x < startX)
    simulateKeyUp(game, 'a', 65)

    expect(scene.player.x).toBeLessThan(startX)
    expect(scene.player.flipX).toBe(true)
    expect(scene.controller.facing).toBe('left')
  })

  it('retains facing direction after stopping', async () => {
    game = createMinimalGame([PlayerTestScene], { physics: true })
    const scene = (await waitForScene(game, 'PlayerTestScene')) as PlayerTestScene

    simulateKeyDown(game, 'd', 68)
    await waitFor(() => scene.controller.facing === 'right')
    simulateKeyUp(game, 'd', 68)

    expect(scene.controller.facing).toBe('right')
  })

  it('does not move when frozen', async () => {
    game = createMinimalGame([PlayerTestScene], { physics: true })
    const scene = (await waitForScene(game, 'PlayerTestScene')) as PlayerTestScene

    const startX = scene.player.x
    const startY = scene.player.y

    scene.controller.freeze()

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyUp(game, 'd', 68)

    expect(scene.player.x).toBe(startX)
    expect(scene.player.y).toBe(startY)

    scene.controller.unfreeze()
  })

  it('resumes movement after unfreeze', async () => {
    game = createMinimalGame([PlayerTestScene], { physics: true })
    const scene = (await waitForScene(game, 'PlayerTestScene')) as PlayerTestScene

    scene.controller.freeze()
    scene.controller.unfreeze()

    const startX = scene.player.x

    simulateKeyDown(game, 'd', 68)
    await waitFor(() => scene.player.x > startX)
    simulateKeyUp(game, 'd', 68)

    expect(scene.player.x).toBeGreaterThan(startX)
  })
})
