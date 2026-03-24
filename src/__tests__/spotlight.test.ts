import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { DEPTH_LIGHTING, TILE_SIZE } from '../config'
import { bootToOverworld, delay, dismissDialog } from './testing'

// NOTE: World-space pixel positions of specific light types from FIXED_LIGHTS.
// Lamp pool sits at the end of the cone (source Y + LAMP_CONE_HEIGHT of 40).
// Window glow is drawn directly at the source position.
const LAMP_POOL_CENTER_X = 26 * TILE_SIZE + 3
const LAMP_POOL_CENTER_Y = 9 * TILE_SIZE + 3 + 40
const WINDOW_GLOW_CENTER_X = Math.floor(34.5 * TILE_SIZE)
const WINDOW_GLOW_CENTER_Y = 17 * TILE_SIZE

// NOTE: Animation tests read at the EDGE of each light (~75% radius from
// center) where the gradient is actively transitioning. At the center, the
// gradient is fully bright and tiny radius changes don't shift the pixel.
const LAMP_EDGE_X = LAMP_POOL_CENTER_X + 38
const LAMP_EDGE_Y = LAMP_POOL_CENTER_Y
// NOTE: Window glow radius is 40px scaled from BRUSH_BASE_RADIUS of 80.
// The actual drawn radius on the canvas is ~40px. At 75% out (30px) it's
// still fully bright. Push to 90% (36px) to hit the gradient transition.
const WINDOW_EDGE_X = WINDOW_GLOW_CENTER_X + 36
const WINDOW_EDGE_Y = WINDOW_GLOW_CENTER_Y

function findOverlayTextures(scene: Phaser.Scene): {
  multiply: Phaser.GameObjects.RenderTexture
  add: Phaser.GameObjects.RenderTexture
  sparkle: Phaser.GameObjects.RenderTexture
  lightning: Phaser.GameObjects.RenderTexture
} {
  const renderTextures = scene.children.list.filter(
    (child) => child instanceof Phaser.GameObjects.RenderTexture,
  ) as Phaser.GameObjects.RenderTexture[]
  return {
    multiply: renderTextures.find((texture) => texture.depth === DEPTH_LIGHTING)!,
    add: renderTextures.find((texture) => texture.depth === DEPTH_LIGHTING + 1)!,
    sparkle: renderTextures.find((texture) => texture.depth === DEPTH_LIGHTING + 2)!,
    lightning: renderTextures.find((texture) => texture.depth === DEPTH_LIGHTING + 3)!,
  }
}

// NOTE: Reads a pixel from the final composited game canvas. Converts world
// coords to screen coords using the camera scroll offset. Works in Canvas
// renderer mode where RenderTexture.snapshotPixel does not.
function readCanvasPixel(
  game: Phaser.Game,
  scene: Phaser.Scene,
  worldX: number,
  worldY: number,
): { r: number; g: number; b: number; a: number } {
  const camera = scene.cameras.main
  const screenX = Math.floor(worldX - camera.scrollX)
  const screenY = Math.floor(worldY - camera.scrollY)
  const context = game.canvas.getContext('2d')
  if (!context) return { r: 0, g: 0, b: 0, a: 0 }
  const imageData = context.getImageData(screenX, screenY, 1, 1)
  return { r: imageData.data[0], g: imageData.data[1], b: imageData.data[2], a: imageData.data[3] }
}

function getTextureCanvas(renderTexture: Phaser.GameObjects.RenderTexture): HTMLCanvasElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (renderTexture as any).texture.getSourceImage() as HTMLCanvasElement
}

// NOTE: Reads a pixel directly from a RenderTexture's internal canvas.
// Uses world coords (no camera offset) since the texture covers the full map.
// Needed because the game canvas getImageData doesn't reflect ADD blend mode.
function readTexturePixel(
  renderTexture: Phaser.GameObjects.RenderTexture,
  worldX: number,
  worldY: number,
): { r: number; g: number; b: number; a: number } {
  const canvas = getTextureCanvas(renderTexture)
  if (!canvas) return { r: 0, g: 0, b: 0, a: 0 }
  const context = canvas.getContext('2d')
  if (!context) return { r: 0, g: 0, b: 0, a: 0 }
  const imageData = context.getImageData(Math.floor(worldX), Math.floor(worldY), 1, 1)
  return { r: imageData.data[0], g: imageData.data[1], b: imageData.data[2], a: imageData.data[3] }
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('spotlight overlay', () => {
  it('lighting overlay is visible on the scene', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const { multiply, add } = findOverlayTextures(scene)
    expect(multiply).toBeDefined()
    expect(add).toBeDefined()
    expect(multiply.visible).toBe(true)
    expect(add.visible).toBe(true)
  })

  it('lighting persists across multiple frames', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    await delay(500)

    const { multiply, add } = findOverlayTextures(scene)
    expect(multiply.visible).toBe(true)
    expect(add.visible).toBe(true)
  })

  it('lamp light brightness varies over time', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    // NOTE: Sample 5 times over 2s. Two snapshots can land on the same
    // animation value; multiple samples ensure we catch variation.
    const samples: string[] = []
    for (let step = 0; step < 5; step++) {
      const pixel = readCanvasPixel(game, scene, LAMP_EDGE_X, LAMP_EDGE_Y)
      samples.push(`${pixel.r},${pixel.g},${pixel.b}`)
      await delay(400)
    }

    const uniqueValues = new Set(samples)
    expect(uniqueValues.size).toBeGreaterThan(1)
  })

  it('window glow brightness varies over time', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    // NOTE: Read from the ADD layer's internal canvas directly. The game
    // canvas getImageData doesn't reflect ADD blend mode compositing, so
    // readCanvasPixel returns all-white for glow positions.
    const { add } = findOverlayTextures(scene)

    // NOTE: Sample 8 times over 4s. The pulse animation is slow (~3s cycle)
    // so a longer window is needed to reliably catch sine variation across
    // different random seed assignments.
    const samples: string[] = []
    for (let step = 0; step < 8; step++) {
      const pixel = readTexturePixel(add, WINDOW_EDGE_X, WINDOW_EDGE_Y)
      samples.push(`${pixel.r},${pixel.g},${pixel.b}`)
      await delay(500)
    }

    const uniqueValues = new Set(samples)
    expect(uniqueValues.size).toBeGreaterThan(1)
  })

  it('window position has color on the glow layer', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const { add } = findOverlayTextures(scene)
    const pixel = readTexturePixel(add, WINDOW_GLOW_CENTER_X, WINDOW_GLOW_CENTER_Y)

    const hasColor = pixel.r > 0 || pixel.g > 0 || pixel.b > 0
    expect(hasColor).toBe(true)
  })

  it('lamp position is not pure black on the game canvas', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const pixel = readCanvasPixel(game, scene, LAMP_POOL_CENTER_X, LAMP_POOL_CENTER_Y)

    const hasColor = pixel.r > 0 || pixel.g > 0 || pixel.b > 0
    expect(hasColor).toBe(true)
  })
})

// NOTE: Counts non-transparent pixels on a RenderTexture's internal canvas.
// Scans every Nth pixel (stride) to keep it fast on large textures.
function countVisiblePixels(renderTexture: Phaser.GameObjects.RenderTexture, stride: number): number {
  const canvas = getTextureCanvas(renderTexture)
  const context = canvas.getContext('2d')
  if (!context) return 0
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  let count = 0
  for (let index = 3; index < imageData.data.length; index += 4 * stride) {
    if (imageData.data[index] > 0) count++
  }
  return count
}

describe('sparkle overlay', () => {
  it('sparkle overlay is visible on the scene', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const { sparkle } = findOverlayTextures(scene)
    expect(sparkle).toBeDefined()
    expect(sparkle.visible).toBe(true)
  })

  it('sparkles have visible pixels on the overlay', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    // NOTE: Wait for some sparkles to fade in — they start at random phases
    // so some may be in the invisible half of their sine cycle initially.
    await delay(1000)

    const { sparkle } = findOverlayTextures(scene)
    const visible = countVisiblePixels(sparkle, 4)
    expect(visible).toBeGreaterThan(0)
  })

  it('sparkle positions change over time', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const { sparkle } = findOverlayTextures(scene)

    // NOTE: Sample 5 times over 2.5s. Sparkles drift downward and sway, so
    // the pixel pattern on the texture should differ across readings.
    const samples: number[] = []
    for (let step = 0; step < 5; step++) {
      samples.push(countVisiblePixels(sparkle, 4))
      await delay(500)
    }

    const uniqueValues = new Set(samples)
    expect(uniqueValues.size).toBeGreaterThan(1)
  })
})

describe('lightning overlay', () => {
  it('lightning overlay is visible on the scene', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const { lightning } = findOverlayTextures(scene)
    expect(lightning).toBeDefined()
    expect(lightning.visible).toBe(true)
  })

  it('lightning bolt draws visible pixels when it strikes', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const { lightning } = findOverlayTextures(scene)

    // NOTE: Lightning fires at random intervals (3-8s) and lasts 120ms.
    // Poll every 100ms for up to 10s to reliably catch a strike.
    let sawBolt = false
    for (let step = 0; step < 100; step++) {
      const visible = countVisiblePixels(lightning, 4)
      if (visible > 0) {
        sawBolt = true
        break
      }
      await delay(100)
    }

    expect(sawBolt).toBe(true)
  }, 15000) // NOTE: Extended timeout because the bolt may not fire until 8s in.
})
