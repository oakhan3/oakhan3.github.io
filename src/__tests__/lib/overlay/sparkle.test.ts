import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { SparkleOverlay, type SparkleConfig } from '../../../lib/overlay/SparkleOverlay'
import { GBA_WIDTH, GBA_HEIGHT, DEPTH_SPARKLE } from '../../../config'
import { createMinimalGame, waitForScene, delay, countVisiblePixels, findRenderTextureByDepth } from '../../testing'

const MAP_WIDTH = GBA_WIDTH
const MAP_HEIGHT = GBA_HEIGHT

// NOTE: Fast cycle so sparkles appear reliably within the test window.
const TEST_CONFIG: SparkleConfig = {
  count: 20,
  radius: 3,
  minCycleMs: 100,
  maxCycleMs: 300,
  maxAlpha: 1,
  fallSpeed: 0.01,
  swayAmplitude: 0,
  swaySpeed: 0,
}

class SparkleTestScene extends Phaser.Scene {
  private overlay!: SparkleOverlay

  constructor() {
    super({ key: 'SparkleTestScene' })
  }

  create() {
    this.overlay = new SparkleOverlay(this, MAP_WIDTH, MAP_HEIGHT, TEST_CONFIG)
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

describe('sparkle overlay', () => {
  it('sparkle render texture is present and visible', async () => {
    game = createMinimalGame([SparkleTestScene])
    const scene = await waitForScene(game, 'SparkleTestScene')
    await delay(100)

    // NOTE: SparkleOverlay renders at DEPTH_SPARKLE.
    const sparkle = findRenderTextureByDepth(scene, DEPTH_SPARKLE)
    expect(sparkle).toBeDefined()
    expect(sparkle.visible).toBe(true)
  })

  it('sparkles have visible pixels after a short wait', async () => {
    game = createMinimalGame([SparkleTestScene])
    const scene = await waitForScene(game, 'SparkleTestScene')

    // NOTE: Wait for sparkles to fade in — they start at random sine phases.
    await delay(600)

    const sparkle = findRenderTextureByDepth(scene, DEPTH_SPARKLE)
    expect(countVisiblePixels(sparkle, 4)).toBeGreaterThan(0)
  })

  it('sparkle pixel counts change over time as particles drift', async () => {
    game = createMinimalGame([SparkleTestScene])
    const scene = await waitForScene(game, 'SparkleTestScene')
    await delay(300)

    const sparkle = findRenderTextureByDepth(scene, DEPTH_SPARKLE)

    const samples: number[] = []
    for (let step = 0; step < 5; step++) {
      samples.push(countVisiblePixels(sparkle, 4))
      await delay(300)
    }

    expect(new Set(samples).size).toBeGreaterThan(1)
  }, 8000)
})
