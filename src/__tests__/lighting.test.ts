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

function findLightingTextures(scene: Phaser.Scene): {
  multiply: Phaser.GameObjects.RenderTexture
  add: Phaser.GameObjects.RenderTexture
} {
  const renderTextures = scene.children.list.filter(
    (child) => child instanceof Phaser.GameObjects.RenderTexture,
  ) as Phaser.GameObjects.RenderTexture[]
  return {
    multiply: renderTextures.find((texture) => texture.depth === DEPTH_LIGHTING)!,
    add: renderTextures.find((texture) => texture.depth === DEPTH_LIGHTING + 1)!,
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

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe.skip('lighting overlay', () => {
  it('lighting overlay is visible on the scene', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const { multiply, add } = findLightingTextures(scene)
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

    const { multiply, add } = findLightingTextures(scene)
    expect(multiply.visible).toBe(true)
    expect(add.visible).toBe(true)
  })

  it('lamp light brightness varies over time', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const pixelBefore = readCanvasPixel(game, scene, LAMP_EDGE_X, LAMP_EDGE_Y)

    await delay(1500)

    const pixelAfter = readCanvasPixel(game, scene, LAMP_EDGE_X, LAMP_EDGE_Y)

    // NOTE: Flicker animation should cause at least one RGB channel to shift.
    console.log('LAMP before:', pixelBefore, 'after:', pixelAfter)
    const changed = pixelBefore.r !== pixelAfter.r || pixelBefore.g !== pixelAfter.g || pixelBefore.b !== pixelAfter.b
    expect(changed).toBe(true)
  })

  it('window glow brightness varies over time', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const pixelBefore = readCanvasPixel(game, scene, WINDOW_EDGE_X, WINDOW_EDGE_Y)

    await delay(2000)

    const pixelAfter = readCanvasPixel(game, scene, WINDOW_EDGE_X, WINDOW_EDGE_Y)

    // NOTE: Pulse animation should cause at least one RGB channel to shift.
    console.log('WINDOW before:', pixelBefore, 'after:', pixelAfter)
    const changed = pixelBefore.r !== pixelAfter.r || pixelBefore.g !== pixelAfter.g || pixelBefore.b !== pixelAfter.b
    expect(changed).toBe(true)
  })

  it('window position is not pure black on the game canvas', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const pixel = readCanvasPixel(game, scene, WINDOW_GLOW_CENTER_X, WINDOW_GLOW_CENTER_Y)

    // NOTE: The window glow light draws to both layers. The composited result
    // at the window position should have visible color, not pure black.
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
