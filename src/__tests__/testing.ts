import { PlayerController } from '../lib/player'
import { GBA_WIDTH, GBA_HEIGHT } from '../config'

export function waitForScene(game: Phaser.Game, sceneKey: string): Promise<Phaser.Scene> {
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

export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export function simulateKeyDown(game: Phaser.Game, key: string, keyCode: number): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyboard = (game.input as any).keyboard as { onKeyDown: (event: KeyboardEvent) => void }
  keyboard.onKeyDown(new KeyboardEvent('keydown', { key, keyCode, bubbles: true }))
}

export function simulateKeyUp(game: Phaser.Game, key: string, keyCode: number): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyboard = (game.input as any).keyboard as { onKeyUp: (event: KeyboardEvent) => void }
  keyboard.onKeyUp(new KeyboardEvent('keyup', { key, keyCode, bubbles: true }))
}

export function simulateKeyPress(game: Phaser.Game, key: string, keyCode: number): void {
  simulateKeyDown(game, key, keyCode)
  simulateKeyUp(game, key, keyCode)
}

export async function bootToOverworld(game: Phaser.Game): Promise<Phaser.Scene> {
  await waitForScene(game, 'BootScene')
  await delay(100)
  simulateKeyDown(game, 'Enter', 13)
  return waitForScene(game, 'OverworldScene')
}

// NOTE: Space twice — first press rushes the typewriter text, second press closes the dialog.
export async function dismissDialog(game: Phaser.Game): Promise<void> {
  await delay(100)
  simulateKeyPress(game, ' ', 32)
  await delay(100)
  simulateKeyPress(game, ' ', 32)
  await delay(100)
}

// NOTE: Phaser transforms pageX/pageY through scaleManager.transformX/Y which applies:
// (pageX - canvasBounds.left) * displayScale.x. We reverse this to convert game-space
// coords into page coords that Phaser will transform back correctly.
function gameToPageCoords(game: Phaser.Game, gameX: number, gameY: number): { pageX: number; pageY: number } {
  const bounds = game.canvas.getBoundingClientRect()
  const scaleX = game.scale.displayScale.x
  const scaleY = game.scale.displayScale.y
  return {
    pageX: gameX / scaleX + bounds.left,
    pageY: gameY / scaleY + bounds.top,
  }
}

// NOTE: Dispatch on the canvas so event.target === game.canvas. Phaser's InputPlugin checks
// pointer.downElement === game.canvas before emitting POINTER_DOWN; without this, it emits
// POINTER_DOWN_OUTSIDE and scene listeners never fire.
export function simulatePointerDown(game: Phaser.Game, gameX: number, gameY: number): void {
  const { pageX, pageY } = gameToPageCoords(game, gameX, gameY)
  game.canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: pageX, clientY: pageY, button: 0, bubbles: true }))
}

export function simulatePointerUp(game: Phaser.Game, gameX: number, gameY: number): void {
  const { pageX, pageY } = gameToPageCoords(game, gameX, gameY)
  game.canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: pageX, clientY: pageY, button: 0, bubbles: true }))
}

export function simulatePointerMove(game: Phaser.Game, gameX: number, gameY: number): void {
  const { pageX, pageY } = gameToPageCoords(game, gameX, gameY)
  game.canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: pageX, clientY: pageY, button: 0, bubbles: true }))
}

export function findPlayerController(scene: Phaser.Scene): PlayerController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (scene as any).playerController
}

export function findPlayer(scene: Phaser.Scene): Phaser.Physics.Matter.Sprite {
  return scene.children.list.find(
    (child) => child instanceof Phaser.Physics.Matter.Sprite && child.texture.key === 'player',
  ) as Phaser.Physics.Matter.Sprite
}

export function createMinimalGame(
  scenes: Phaser.Types.Core.GameConfig['scene'],
  opts: { physics?: boolean } = {},
): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GBA_WIDTH,
      height: GBA_HEIGHT,
    },
    physics: opts.physics ? { default: 'matter', matter: { gravity: { x: 0, y: 0 }, debug: false } } : undefined,
    fps: { smoothStep: false },
    scene: scenes,
  })
}

// NOTE: Reads a pixel from the final composited game canvas. Converts world
// coords to screen coords using the camera scroll offset.
export function readCanvasPixel(
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

// NOTE: Accesses the internal canvas of a RenderTexture for pixel inspection.
// Needed because ADD-blended layers don't show up via game canvas getImageData.
export function getTextureCanvas(renderTexture: Phaser.GameObjects.RenderTexture): HTMLCanvasElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (renderTexture as any).texture.getSourceImage() as HTMLCanvasElement
}

export function readTexturePixel(
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

export function countVisiblePixels(renderTexture: Phaser.GameObjects.RenderTexture, stride: number): number {
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

export function findRenderTextureByDepth(scene: Phaser.Scene, depth: number): Phaser.GameObjects.RenderTexture {
  return scene.children.list.find(
    (child) => child instanceof Phaser.GameObjects.RenderTexture && child.depth === depth,
  ) as Phaser.GameObjects.RenderTexture
}
