import Phaser from 'phaser'
import { Direction, GBA_HEIGHT, DEPTH_JOYSTICK_BASE, DEPTH_JOYSTICK_KNOB } from '../../config'

// NOTE: Minimum drag distance (in game pixels) before registering a direction.
// Prevents accidental movement from tapping.
const DEADZONE = 4

// NOTE: Sized relative to the shorter game dimension (320px). Phaser's Scale.FIT
// stretches the canvas to fill the screen, so these scale up on all devices.
const JOYSTICK_BASE_RADIUS = Math.round(GBA_HEIGHT * 0.25)
const JOYSTICK_KNOB_RADIUS = Math.round(GBA_HEIGHT * 0.1)
const JOYSTICK_BASE_COLOR = 0xffffff
const JOYSTICK_BASE_ALPHA = 0.15
const JOYSTICK_KNOB_COLOR = 0xffffff
const JOYSTICK_KNOB_ALPHA = 0.4

export class TouchControls {
  private activeDirection: Direction = 'none'
  private originX = 0
  private originY = 0
  private base: Phaser.GameObjects.Graphics
  private knob: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.base = scene.add.graphics()
    this.base.fillStyle(JOYSTICK_BASE_COLOR, JOYSTICK_BASE_ALPHA)
    this.base.fillCircle(0, 0, JOYSTICK_BASE_RADIUS)
    this.base.setScrollFactor(0)
    this.base.setDepth(DEPTH_JOYSTICK_BASE)
    this.base.setVisible(false)

    this.knob = scene.add.graphics()
    this.knob.fillStyle(JOYSTICK_KNOB_COLOR, JOYSTICK_KNOB_ALPHA)
    this.knob.fillCircle(0, 0, JOYSTICK_KNOB_RADIUS)
    this.knob.setScrollFactor(0)
    this.knob.setDepth(DEPTH_JOYSTICK_KNOB)
    this.knob.setVisible(false)

    scene.input.on('pointerdown', this.handlePointerDown, this)
    scene.input.on('pointermove', this.handlePointerMove, this)
    scene.input.on('pointerup', this.handlePointerUp, this)
  }

  get direction(): Direction {
    return this.activeDirection
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.originX = pointer.x
    this.originY = pointer.y
    this.activeDirection = 'none'

    this.base.setPosition(pointer.x, pointer.y)
    this.base.setVisible(true)
    this.knob.setPosition(pointer.x, pointer.y)
    this.knob.setVisible(true)
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown) return
    this.activeDirection = _directionFromDelta(pointer.x - this.originX, pointer.y - this.originY)

    // NOTE: Clamp the knob position to the base radius so it doesn't drift
    // outside the circle when the finger drags far away.
    const deltaX = pointer.x - this.originX
    const deltaY = pointer.y - this.originY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const clampedDistance = Math.min(distance, JOYSTICK_BASE_RADIUS)

    if (distance > 0) {
      const scale = clampedDistance / distance
      this.knob.setPosition(this.originX + deltaX * scale, this.originY + deltaY * scale)
    }
  }

  private handlePointerUp(): void {
    this.activeDirection = 'none'
    this.base.setVisible(false)
    this.knob.setVisible(false)
  }
}

function _directionFromDelta(deltaX: number, deltaY: number): Direction {
  if (Math.abs(deltaX) < DEADZONE && Math.abs(deltaY) < DEADZONE) return 'none'

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX < 0 ? 'left' : 'right'
  }
  return deltaY < 0 ? 'up' : 'down'
}
