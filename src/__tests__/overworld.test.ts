import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { bootToOverworld, delay, dismissDialog, findPlayer, simulateKeyDown, simulateKeyUp } from './testing'

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

function findTileAnimations(scene: Phaser.Scene): {
  layer: Phaser.Tilemaps.TilemapLayer
  row: number
  col: number
  frames: { gid: number; duration: number }[]
  frameIndex: number
  elapsed: number
}[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (scene as any).tileAnimations
}

// TODO: Rewrite collision and animation tests for the new overworld-3 map.
describe.skip('tile collisions', () => {
  it('stops the player at set-collision tiles', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x

    // NOTE: Walk left for long enough to reach the building tiles (~8 tiles away).
    simulateKeyDown(game, 'a', 65)
    await delay(3000)
    simulateKeyUp(game, 'a', 65)

    // NOTE: Player should have been stopped by the building. If there were no collision,
    // the player would travel much further left (speed * 3s). The building wall is around
    // x=368, so the player should be stopped well before reaching x=0.
    const finalX = player.x
    expect(finalX).toBeLessThan(startX)
    expect(finalX).toBeGreaterThan(300)
  })

  it('blocks movement through kiwi tiles', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)

    // NOTE: Kiwi is at pixel (144, 160). Teleport player next to it and walk into it.
    player.setPosition(176, 160)
    await delay(50)

    simulateKeyDown(game, 'a', 65)
    await delay(500)
    simulateKeyUp(game, 'a', 65)

    // NOTE: Player should be stopped by the kiwi tile at x=144. Without collision
    // the player would pass through to a much lower x value.
    expect(player.x).toBeGreaterThan(140)
  })
})

describe.skip('tile animations', () => {
  it('swaps tile indices after the frame duration elapses', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const animations = findTileAnimations(scene)
    expect(animations.length).toBeGreaterThan(0)

    const anim = animations[0]

    // NOTE: Sample the tile index several times over a period longer than a full animation
    // cycle. With 2 frames at 100ms each, we should see at least two distinct indices.
    const observedIndices = new Set<number>()
    for (let sample = 0; sample < 5; sample++) {
      const tile = anim.layer.getTileAt(anim.col, anim.row)
      observedIndices.add(tile.index)
      await delay(60)
    }

    expect(observedIndices.size).toBeGreaterThanOrEqual(2)
  })

  it('still blocks player after an animation frame swap', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const animations = findTileAnimations(scene)
    const anim = animations[0]

    // NOTE: Wait for at least one animation frame swap.
    await delay(200)

    // NOTE: Teleport the player next to the animated tile and try to walk through it.
    const tilePixelX = anim.col * 16
    player.setPosition(tilePixelX + 24, anim.row * 16)
    await delay(50)

    simulateKeyDown(game, 'a', 65)
    await delay(500)
    simulateKeyUp(game, 'a', 65)

    // NOTE: The player should be blocked by the animated tile's Matter body.
    expect(player.x).toBeGreaterThan(tilePixelX)
  })
})
