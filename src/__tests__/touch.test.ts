import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { PLAYER_SPEED, GBA_WIDTH, GBA_HEIGHT } from '../config'
import { bootToOverworld, delay, dismissDialog, findPlayer, simulatePointerDown, simulatePointerUp } from './testing'

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('touch controls', () => {
  it('moves player right when holding right side of screen', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    // NOTE: Click right of center to move right.
    simulatePointerDown(game, GBA_WIDTH - 10, GBA_HEIGHT / 2)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(PLAYER_SPEED)
    expect(body.velocity.y).toBe(0)

    simulatePointerUp(game, GBA_WIDTH - 10, GBA_HEIGHT / 2)
  })

  it('moves player left when holding left side of screen', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    simulatePointerDown(game, 10, GBA_HEIGHT / 2)
    await delay(100)

    const player = findPlayer(scene)
    const body = player.body as Phaser.Physics.Arcade.Body
    expect(body.velocity.x).toBe(-PLAYER_SPEED)

    simulatePointerUp(game, 10, GBA_HEIGHT / 2)
  })

  it('stops player when pointer is released', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    simulatePointerDown(game, GBA_WIDTH - 10, GBA_HEIGHT / 2)
    await delay(100)
    simulatePointerUp(game, GBA_WIDTH - 10, GBA_HEIGHT / 2)
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

    // NOTE: Quick tap (down + immediate up) should act as Enter.
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerUp(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    // NOTE: First tap rushes text, second tap dismisses.
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerUp(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    expect(container.visible).toBe(false)
  })
})
