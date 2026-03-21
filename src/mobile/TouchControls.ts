import Phaser from 'phaser'
import { Direction } from '../config'

// NOTE: Minimum drag distance (in game pixels) before registering a direction.
// Prevents accidental movement from tapping.
const DEADZONE = 8

export class TouchControls {
  private activeDirection: Direction = 'none'
  private originX = 0
  private originY = 0

  constructor(scene: Phaser.Scene) {
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
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown) return
    this.activeDirection = _directionFromDelta(pointer.x - this.originX, pointer.y - this.originY)
  }

  private handlePointerUp(): void {
    this.activeDirection = 'none'
  }
}

function _directionFromDelta(deltaX: number, deltaY: number): Direction {
  if (Math.abs(deltaX) < DEADZONE && Math.abs(deltaY) < DEADZONE) return 'none'

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX < 0 ? 'left' : 'right'
  }
  return deltaY < 0 ? 'up' : 'down'
}
