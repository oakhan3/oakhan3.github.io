import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { PLAYER_SPEED, GBA_WIDTH, GBA_HEIGHT } from '../config'
import {
  bootToOverworld,
  delay,
  dismissDialog,
  findPlayer,
  simulatePointerDown,
  simulatePointerMove,
  simulatePointerUp,
} from './testing'

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('touch controls', () => {
  it('moves player right when dragging right', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    // NOTE: Touch down at center, drag right past the deadzone (8px).
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(PLAYER_SPEED)
    expect(body.velocity.y).toBe(0)

    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
  })

  it('moves player left when dragging left', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 - 20, GBA_HEIGHT / 2)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(-PLAYER_SPEED)

    simulatePointerUp(game, GBA_WIDTH / 2 - 20, GBA_HEIGHT / 2)
  })

  it('does not move within the deadzone', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    // NOTE: Drag only 5px, which is within the 8px deadzone.
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 5, GBA_HEIGHT / 2)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(0)
    expect(body.velocity.y).toBe(0)

    simulatePointerUp(game, GBA_WIDTH / 2 + 5, GBA_HEIGHT / 2)
  })

  it('stops player when pointer is released', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(100)
    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(0)
    expect(body.velocity.y).toBe(0)
  })

  it('tap dismisses dialog', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const container = scene.children.list.find(
      (child) => child instanceof Phaser.GameObjects.Container && child.depth === 100,
    ) as Phaser.GameObjects.Container

    // NOTE: First pointerdown rushes text, second pointerdown dismisses.
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    expect(container.visible).toBe(false)
  })
})
