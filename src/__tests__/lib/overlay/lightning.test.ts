import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { LightningOverlay, type LightningConfig } from '../../../lib/overlay/LightningOverlay'
import { GBA_WIDTH, GBA_HEIGHT, DEPTH_LIGHTNING, TILE_SIZE } from '../../../config'
import { createMinimalGame, waitForScene, delay, countVisiblePixels, findRenderTextureByDepth } from '../../testing'

const MAP_WIDTH = GBA_WIDTH
const MAP_HEIGHT = GBA_HEIGHT

// NOTE: Short interval so the bolt fires quickly within the test window.
const TEST_CONFIG: LightningConfig = {
  targetTileX: Math.floor(GBA_WIDTH / TILE_SIZE / 2),
  targetTileY: Math.floor(GBA_HEIGHT / TILE_SIZE / 2),
  minIntervalMs: 100,
  maxIntervalMs: 200,
  boltDurationMs: 500,
  fadeMs: 100,
  displacementInitial: 20,
  displacementDecay: 0.5,
  subdivisionDepth: 4,
  branchProbability: 0.3,
  branchLengthRatio: 0.3,
  branchSubdivisionDepth: 2,
  mainBoltWidth: 2,
  branchBoltWidth: 1,
  boltColor: 'rgba(255, 255, 255, 1)',
  glowColor: 'rgba(180, 180, 255, 0.4)',
  glowWidth: 6,
}

class LightningTestScene extends Phaser.Scene {
  private overlay!: LightningOverlay

  constructor() {
    super({ key: 'LightningTestScene' })
  }

  create() {
    this.overlay = new LightningOverlay(this, MAP_WIDTH, MAP_HEIGHT, TEST_CONFIG)
  }

  update() {
    this.overlay.update()
  }
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('lightning overlay', () => {
  it('lightning render texture is present and visible', async () => {
    game = createMinimalGame([LightningTestScene])
    const scene = await waitForScene(game, 'LightningTestScene')
    await delay(100)

    // NOTE: LightningOverlay renders at DEPTH_LIGHTNING.
    const lightning = findRenderTextureByDepth(scene, DEPTH_LIGHTNING)
    expect(lightning).toBeDefined()
    expect(lightning.visible).toBe(true)
  })

  it('bolt draws visible pixels when it strikes', async () => {
    game = createMinimalGame([LightningTestScene])
    const scene = await waitForScene(game, 'LightningTestScene')

    const lightning = findRenderTextureByDepth(scene, DEPTH_LIGHTNING)

    let sawBolt = false
    for (let step = 0; step < 20; step++) {
      if (countVisiblePixels(lightning, 4) > 0) {
        sawBolt = true
        break
      }
      await delay(50)
    }

    expect(sawBolt).toBe(true)
  }, 5000)
})
