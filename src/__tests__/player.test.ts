import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { PLAYER_SPEED } from '../config'

function waitForScene(game: Phaser.Game, sceneKey: string): Promise<Phaser.Scene> {
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

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function simulateKeyPress(game: Phaser.Game): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyboard = (game.input as any).keyboard as { onKeyDown: (event: KeyboardEvent) => void }
  keyboard.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }))
}

function simulateKeyDown(game: Phaser.Game, key: string, keyCode: number): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyboard = (game.input as any).keyboard as { onKeyDown: (event: KeyboardEvent) => void }
  keyboard.onKeyDown(new KeyboardEvent('keydown', { key, keyCode, bubbles: true }))
}

function simulateKeyUp(game: Phaser.Game, key: string, keyCode: number): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyboard = (game.input as any).keyboard as { onKeyUp: (event: KeyboardEvent) => void }
  keyboard.onKeyUp(new KeyboardEvent('keyup', { key, keyCode, bubbles: true }))
}

async function bootToOverworld(game: Phaser.Game): Promise<Phaser.Scene> {
  await waitForScene(game, 'BootScene')
  await delay(100)
  simulateKeyPress(game)
  return waitForScene(game, 'OverworldScene')
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite {
  const bodies = scene.physics.world.bodies.getArray()
  const playerBody = bodies.find((body) => {
    const gameObject = body.gameObject as Phaser.Physics.Arcade.Sprite
    return gameObject?.texture?.key === 'player'
  })
  return playerBody!.gameObject as Phaser.Physics.Arcade.Sprite
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('player movement', () => {
  it('moves right when D key is pressed', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)

    simulateKeyDown(game, 'd', 68)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(PLAYER_SPEED)
    expect(body.velocity.y).toBe(0)

    simulateKeyUp(game, 'd', 68)
  })

  it('flips sprite when moving left', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)

    simulateKeyDown(game, 'a', 65)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(-PLAYER_SPEED)
    expect(player.flipX).toBe(true)

    simulateKeyUp(game, 'a', 65)
  })

  it('stops when no keys are pressed', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)

    simulateKeyDown(game, 'd', 68)
    await delay(100)
    simulateKeyUp(game, 'd', 68)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(0)
    expect(body.velocity.y).toBe(0)
  })

  it('does not move when frozen', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controller = (scene as any).playerController
    controller.freeze()

    simulateKeyDown(game, 'd', 68)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(0)
    expect(body.velocity.y).toBe(0)

    simulateKeyUp(game, 'd', 68)
    controller.unfreeze()
  })
})
