import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { TouchControls } from '../../lib/mobile/TouchControls'
import { GBA_WIDTH, GBA_HEIGHT, DEPTH_JOYSTICK_BASE, DEPTH_JOYSTICK_KNOB } from '../../config'
import {
  createMinimalGame,
  waitForScene,
  delay,
  simulatePointerDown,
  simulatePointerMove,
  simulatePointerUp,
} from '../testing'

class TouchTestScene extends Phaser.Scene {
  touchControls!: TouchControls

  constructor() {
    super({ key: 'TouchTestScene' })
  }

  create() {
    this.touchControls = new TouchControls(this)
  }
}

function findControls(scene: Phaser.Scene): {
  dpad: Phaser.GameObjects.Image
  knob: Phaser.GameObjects.Graphics
} {
  return {
    dpad: scene.children.list.find(
      (child) => child instanceof Phaser.GameObjects.Image && child.depth === DEPTH_JOYSTICK_BASE,
    ) as Phaser.GameObjects.Image,
    knob: scene.children.list.find(
      (child) => child instanceof Phaser.GameObjects.Graphics && child.depth === DEPTH_JOYSTICK_KNOB,
    ) as Phaser.GameObjects.Graphics,
  }
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('touch controls', () => {
  it('dpad and knob appear on pointer down and hide on release', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    const { dpad, knob } = findControls(scene)
    expect(dpad.visible).toBe(false)
    expect(knob.visible).toBe(false)

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    expect(dpad.visible).toBe(true)
    expect(knob.visible).toBe(true)

    simulatePointerUp(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    await delay(50)

    expect(dpad.visible).toBe(false)
    expect(knob.visible).toBe(false)
  })

  it('direction is none within the 4px deadzone', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 3, GBA_HEIGHT / 2)

    expect(scene.touchControls.direction).toBe('none')

    simulatePointerUp(game, GBA_WIDTH / 2 + 3, GBA_HEIGHT / 2)
  })

  it('direction is right when dragging right past deadzone', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)

    expect(scene.touchControls.direction).toBe('right')

    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
  })

  it('direction is left when dragging left past deadzone', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 - 20, GBA_HEIGHT / 2)

    expect(scene.touchControls.direction).toBe('left')

    simulatePointerUp(game, GBA_WIDTH / 2 - 20, GBA_HEIGHT / 2)
  })

  it('direction is up when dragging up past deadzone', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2, GBA_HEIGHT / 2 - 20)

    expect(scene.touchControls.direction).toBe('up')

    simulatePointerUp(game, GBA_WIDTH / 2, GBA_HEIGHT / 2 - 20)
  })

  it('direction is down when dragging down past deadzone', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2, GBA_HEIGHT / 2 + 20)

    expect(scene.touchControls.direction).toBe('down')

    simulatePointerUp(game, GBA_WIDTH / 2, GBA_HEIGHT / 2 + 20)
  })

  it('direction resets to none on pointer up', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    simulatePointerDown(game, GBA_WIDTH / 2, GBA_HEIGHT / 2)
    simulatePointerMove(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)
    simulatePointerUp(game, GBA_WIDTH / 2 + 20, GBA_HEIGHT / 2)

    expect(scene.touchControls.direction).toBe('none')
  })

  it('knob moves right of dpad when dragging right', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    const originX = GBA_WIDTH / 2
    const originY = GBA_HEIGHT / 2

    simulatePointerDown(game, originX, originY)
    simulatePointerMove(game, originX + 20, originY)
    await delay(50)

    const { dpad, knob } = findControls(scene)
    expect(knob.x).toBeGreaterThan(dpad.x)
    expect(knob.y).toBeCloseTo(dpad.y, 0)

    simulatePointerUp(game, originX + 20, originY)
  })
})
