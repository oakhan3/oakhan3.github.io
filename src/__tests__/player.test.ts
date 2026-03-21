import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import {
  bootToOverworld,
  delay,
  dismissDialog,
  simulateKeyDown,
  simulateKeyUp,
  findPlayer,
  findPlayerController,
} from './testing'

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

    const player = findPlayer(scene)
    const startX = player.x

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyUp(game, 'd', 68)

    expect(player.x).toBeGreaterThan(startX)
    expect(findPlayerController(scene).facing).toBe('right')
  })

  it('flips sprite when moving left', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x

    simulateKeyDown(game, 'a', 65)
    await delay(200)
    simulateKeyUp(game, 'a', 65)

    expect(player.x).toBeLessThan(startX)
    expect(player.flipX).toBe(true)
    expect(findPlayerController(scene).facing).toBe('left')
  })

  it('retains facing direction after stopping', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyUp(game, 'd', 68)
    await delay(100)

    expect(findPlayerController(scene).facing).toBe('right')
  })

  it('does not move when frozen', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)

    const player = findPlayer(scene)
    const startX = player.x
    const startY = player.y

    const controller = findPlayerController(scene)
    controller.freeze()

    simulateKeyDown(game, 'd', 68)
    await delay(200)
    simulateKeyUp(game, 'd', 68)

    expect(player.x).toBe(startX)
    expect(player.y).toBe(startY)

    controller.unfreeze()
  })
})
