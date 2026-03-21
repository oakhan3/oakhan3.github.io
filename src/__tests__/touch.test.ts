import { describe, it, expect, afterEach } from 'vitest'
import { createGame } from '../main'
import { GBA_WIDTH, GBA_HEIGHT, DEPTH_JOYSTICK_BASE, DEPTH_JOYSTICK_KNOB, DEPTH_DIALOG } from '../config'
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

// NOTE: Joystick base is depth 90, knob is depth 91. Find them by depth among
// the scene's Graphics children.
function findJoystick(scene: Phaser.Scene): {
  base: Phaser.GameObjects.Graphics
  knob: Phaser.GameObjects.Graphics
} {
  const graphics = scene.children.list.filter(
    (child) => child instanceof Phaser.GameObjects.Graphics,
  ) as Phaser.GameObjects.Graphics[]
  return {
    base: graphics.find((graphic) => graphic.depth === DEPTH_JOYSTICK_BASE)!,
    knob: graphics.find((graphic) => graphic.depth === DEPTH_JOYSTICK_KNOB)!,
  }
}

describe('touch controls', () => {
  it('moves player right when dragging right', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x

    // NOTE: Touch down at center, drag right past the deadzone (8px).
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(200)

    expect(player.x).toBeGreaterThan(startX)

    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
  })

  it('moves player left when dragging left', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 - 20, GBA_HEIGHT / 2)
    await delay(200)

    expect(player.x).toBeLessThan(startX)

    simulatePointerUp(game, GBA_WIDTH / 2 - 20, GBA_HEIGHT / 2)
  })

  it('does not move within the deadzone', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const player = findPlayer(scene)
    const startX = player.x
    const startY = player.y

    // NOTE: Drag only 3px, which is within the 4px deadzone.
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 3, GBA_HEIGHT / 2)
    await delay(200)

    expect(player.x).toBe(startX)
    expect(player.y).toBe(startY)

    simulatePointerUp(game, GBA_WIDTH / 2 + 5, GBA_HEIGHT / 2)
  })

  it('stops player when pointer is released', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(200)
    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    await delay(200)

    const player = findPlayer(scene)
    const posAfterRelease = player.x

    // NOTE: Wait a bit more and verify player hasn't moved further.
    await delay(200)
    expect(player.x).toBe(posAfterRelease)
  })

  it('tap dismisses dialog', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await delay(100)

    const container = scene.children.list.find(
      (child) => child instanceof Phaser.GameObjects.Container && child.depth === DEPTH_DIALOG,
    ) as Phaser.GameObjects.Container

    // NOTE: First pointerdown rushes text, second pointerdown dismisses.
    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    expect(container.visible).toBe(false)
  })

  it('shows joystick on touch and hides on release', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const { base, knob } = findJoystick(scene)
    expect(base.visible).toBe(false)
    expect(knob.visible).toBe(false)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    expect(base.visible).toBe(true)
    expect(knob.visible).toBe(true)

    simulatePointerUp(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    expect(base.visible).toBe(false)
    expect(knob.visible).toBe(false)
  })

  it('knob follows drag direction', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    const { base, knob } = findJoystick(scene)
    const originX = GBA_WIDTH / 2
    const originY = GBA_HEIGHT / 2

    simulatePointerDown(game, originX, originY)
    simulatePointerMove(game, originX + 20, originY)
    await delay(50)

    // NOTE: Base stays at origin, knob moves toward the drag direction.
    expect(base.x).toBe(originX)
    expect(base.y).toBe(originY)
    expect(knob.x).toBeGreaterThan(originX)
    expect(knob.y).toBe(originY)

    simulatePointerUp(game, originX + 20, originY)
  })
})
