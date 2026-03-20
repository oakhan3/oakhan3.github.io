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

export function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite {
  const bodies = scene.physics.world.bodies.getArray()
  const playerBody = bodies.find((body) => {
    const gameObject = body.gameObject as Phaser.Physics.Arcade.Sprite
    return gameObject?.texture?.key === 'player'
  })
  return playerBody!.gameObject as Phaser.Physics.Arcade.Sprite
}
