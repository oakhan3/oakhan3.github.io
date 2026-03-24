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

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('touch controls', () => {
  it('joystick appears on pointer down and hides on release', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

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

  it('knob moves right of base when dragging right', async () => {
    game = createMinimalGame([TouchTestScene])
    const scene = (await waitForScene(game, 'TouchTestScene')) as TouchTestScene

    const originX = GBA_WIDTH / 2
    const originY = GBA_HEIGHT / 2

    simulatePointerDown(game, originX, originY)
    simulatePointerMove(game, originX + 20, originY)
    await delay(50)

    const { base, knob } = findJoystick(scene)
    // NOTE: Knob should be to the right of the base and at the same height.
    expect(knob.x).toBeGreaterThan(base.x)
    expect(knob.y).toBeCloseTo(base.y, 0)

    simulatePointerUp(game, originX + 20, originY)
  })
})
