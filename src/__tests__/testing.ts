import { PlayerController } from '../player/PlayerController'

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
