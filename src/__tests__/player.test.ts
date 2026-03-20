import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { PLAYER_SPEED } from '../config'
import { bootToOverworld, delay, dismissDialog, simulateKeyDown, simulateKeyUp, findPlayer } from './testing'

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
    await dismissDialog(game)

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
    await dismissDialog(game)

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
    await dismissDialog(game)

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
