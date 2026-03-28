import Phaser from 'phaser'
import {
  Direction,
  GBA_HEIGHT,
  DEPTH_JOYSTICK_BASE,
  DEPTH_JOYSTICK_KNOB,
  TOUCH_DEADZONE_PX,
  isMobile,
} from '../../config'

// NOTE: Sized relative to the shorter game dimension (320px). Phaser's Scale.FIT
// stretches the canvas to fill the screen, so these scale up on all devices.
const DPAD_SIZE = Math.round(GBA_HEIGHT * (isMobile() ? 0.7 : 0.35))
const DPAD_ALPHA = 0.3
const JOYSTICK_SCALE = isMobile() ? 1 : 0.5
const JOYSTICK_KNOB_RADIUS = Math.round(GBA_HEIGHT * 0.1 * JOYSTICK_SCALE)
const JOYSTICK_BASE_RADIUS = Math.round(GBA_HEIGHT * 0.25 * JOYSTICK_SCALE)
const JOYSTICK_KNOB_COLOR = 0xffffff
const JOYSTICK_KNOB_ALPHA = 0.4

export class TouchControls {
  private activeDirection: Direction = 'none'
  private originX = 0
  private originY = 0
  private dpad: Phaser.GameObjects.Image
  private dpadHighlight: Phaser.GameObjects.Image
  private knob: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.dpad = scene.add.image(0, 0, 'dpad')
    this.dpad.setDisplaySize(DPAD_SIZE, DPAD_SIZE)
    this.dpad.setScrollFactor(0)
    this.dpad.setDepth(DEPTH_JOYSTICK_BASE)
    this.dpad.setAlpha(DPAD_ALPHA)
    this.dpad.setVisible(false)

    this.dpadHighlight = scene.add.image(0, 0, 'dpad-highlight')
    this.dpadHighlight.setDisplaySize(DPAD_SIZE, DPAD_SIZE)
    this.dpadHighlight.setScrollFactor(0)
    this.dpadHighlight.setDepth(DEPTH_JOYSTICK_BASE)
    this.dpadHighlight.setAlpha(DPAD_ALPHA)
    this.dpadHighlight.setVisible(false)

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

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.dpad, this.dpadHighlight, this.knob]
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.originX = pointer.x
    this.originY = pointer.y
    this.activeDirection = 'none'

    this.dpad.setPosition(pointer.x, pointer.y)
    this.dpad.setVisible(true)
    this.dpadHighlight.setPosition(pointer.x, pointer.y)
    this.knob.setPosition(pointer.x, pointer.y)
    this.knob.setVisible(true)
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown) return
    this.activeDirection = _directionFromDelta(pointer.x - this.originX, pointer.y - this.originY)
    _updateHighlight(this.dpadHighlight, this.activeDirection)

    // NOTE: Clamp the knob position to the base radius so it doesn't drift
    // outside the dpad when the finger drags far away.
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
    this.dpad.setVisible(false)
    this.dpadHighlight.setVisible(false)
    this.knob.setVisible(false)
  }
}

function _updateHighlight(highlight: Phaser.GameObjects.Image, direction: Direction): void {
  const angles: Record<Direction, number | null> = { up: 0, right: 90, down: 180, left: 270, none: null }
  const angle = angles[direction]
  if (angle === null) {
    highlight.setVisible(false)
  } else {
    highlight.setAngle(angle)
    highlight.setVisible(true)
  }
}

function _directionFromDelta(deltaX: number, deltaY: number): Direction {
  if (Math.abs(deltaX) < TOUCH_DEADZONE_PX && Math.abs(deltaY) < TOUCH_DEADZONE_PX) return 'none'

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX < 0 ? 'left' : 'right'
  }
  return deltaY < 0 ? 'up' : 'down'
}
