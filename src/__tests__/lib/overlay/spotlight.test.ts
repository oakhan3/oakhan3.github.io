import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { SpotlightOverlay, type SpotlightConfig } from '../../../lib/overlay/spotlight/SpotlightOverlay'
import { DEPTH_LIGHTING, DEPTH_SPOTLIGHT_GLOW, GBA_WIDTH, GBA_HEIGHT } from '../../../config'
import { createMinimalGame, waitForScene, delay, readTexturePixel, findRenderTextureByDepth } from '../../testing'

// NOTE: Map fills GBA canvas exactly so world and screen coordinates coincide.
const MAP_WIDTH = GBA_WIDTH
const MAP_HEIGHT = GBA_HEIGHT

// NOTE: Two test lights at known positions — a flickering lamp and a pulsing window glow.
const LAMP_X = 100
const LAMP_Y = 100
const LAMP_RADIUS = 40
// NOTE: Sample at 75% radius from center to hit the gradient transition where animation is visible.
const LAMP_EDGE_X = LAMP_X + Math.round(LAMP_RADIUS * 0.75)
const LAMP_EDGE_Y = LAMP_Y

const GLOW_X = 300
const GLOW_Y = 100
const GLOW_RADIUS = 40
const GLOW_EDGE_X = GLOW_X + Math.round(GLOW_RADIUS * 0.9)
const GLOW_EDGE_Y = GLOW_Y

const TEST_CONFIG: SpotlightConfig = {
  ambientColor: 0x111111,
  playerLightRadius: 80,
  coneTypes: {},
  fixedLights: [
    { pixelX: LAMP_X, pixelY: LAMP_Y, radius: LAMP_RADIUS, color: 0xffffff, animation: 'flicker' },
    { pixelX: GLOW_X, pixelY: GLOW_Y, radius: GLOW_RADIUS, color: 0x8080ff, glow: true, animation: 'pulse' },
  ],
}

class SpotlightTestScene extends Phaser.Scene {
  private overlay!: SpotlightOverlay

  constructor() {
    super({ key: 'SpotlightTestScene' })
  }

  preload() {
    this.textures.generate('test-player', { data: ['1'], pixelWidth: 1 })
  }

  create() {
    const player = this.add.sprite(GBA_WIDTH / 2, GBA_HEIGHT / 2, 'test-player')
    this.overlay = new SpotlightOverlay(this, MAP_WIDTH, MAP_HEIGHT, player, TEST_CONFIG)
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

describe('spotlight overlay', () => {
  it('multiply and add render textures are present and visible', async () => {
    game = createMinimalGame([SpotlightTestScene])
    const scene = await waitForScene(game, 'SpotlightTestScene')
    await delay(100)

    const multiply = findRenderTextureByDepth(scene, DEPTH_LIGHTING)
    const add = findRenderTextureByDepth(scene, DEPTH_SPOTLIGHT_GLOW)

    expect(multiply).toBeDefined()
    expect(add).toBeDefined()
    expect(multiply.visible).toBe(true)
    expect(add.visible).toBe(true)
  })

  it('lamp brightness varies over time', async () => {
    game = createMinimalGame([SpotlightTestScene])
    const scene = await waitForScene(game, 'SpotlightTestScene')
    await delay(100)

    // NOTE: Read from the MULTIPLY layer's internal canvas directly. Without a tilemap
    // background in the minimal scene the composited game canvas shows no variation,
    // but the render texture itself reflects the animated lamp radius.
    const multiply = findRenderTextureByDepth(scene, DEPTH_LIGHTING)

    const samples: string[] = []
    for (let step = 0; step < 5; step++) {
      const pixel = readTexturePixel(multiply, LAMP_EDGE_X, LAMP_EDGE_Y)
      samples.push(`${pixel.r},${pixel.g},${pixel.b}`)
      await delay(400)
    }

    expect(new Set(samples).size).toBeGreaterThan(1)
  }, 8000)

  it('window glow brightness varies over time', async () => {
    game = createMinimalGame([SpotlightTestScene])
    const scene = await waitForScene(game, 'SpotlightTestScene')
    await delay(100)

    const add = findRenderTextureByDepth(scene, DEPTH_SPOTLIGHT_GLOW)

    const samples: string[] = []
    for (let step = 0; step < 8; step++) {
      const pixel = readTexturePixel(add, GLOW_EDGE_X, GLOW_EDGE_Y)
      samples.push(`${pixel.r},${pixel.g},${pixel.b}`)
      await delay(500)
    }

    expect(new Set(samples).size).toBeGreaterThan(1)
  }, 10000)

  it('window glow position has color on the add layer', async () => {
    game = createMinimalGame([SpotlightTestScene])
    const scene = await waitForScene(game, 'SpotlightTestScene')
    await delay(200)

    const add = findRenderTextureByDepth(scene, DEPTH_SPOTLIGHT_GLOW)
    const pixel = readTexturePixel(add, GLOW_X, GLOW_Y)

    expect(pixel.r > 0 || pixel.g > 0 || pixel.b > 0).toBe(true)
  })
})
