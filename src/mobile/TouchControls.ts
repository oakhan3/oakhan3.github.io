import Phaser from 'phaser'
import { GBA_WIDTH, GBA_HEIGHT } from '../config'

const CENTER_X = GBA_WIDTH / 2
const CENTER_Y = GBA_HEIGHT / 2
const TAP_THRESHOLD = 200

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

export class TouchControls {
  private activeDirection: Direction = 'none'
  private tapListeners: Array<() => void> = []
  private pointerDownTime = 0

  constructor(scene: Phaser.Scene) {
    scene.input.on('pointerdown', this.handlePointerDown, this)
    scene.input.on('pointermove', this.handlePointerMove, this)
    scene.input.on('pointerup', this.handlePointerUp, this)
  }

  get direction(): Direction {
    return this.activeDirection
  }

  onTap(listener: () => void): void {
    this.tapListeners.push(listener)
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.pointerDownTime = pointer.downTime
    this.updateDirection(pointer)
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown) return
    this.updateDirection(pointer)
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const holdDuration = pointer.upTime - this.pointerDownTime

    if (holdDuration < TAP_THRESHOLD) {
      for (const listener of this.tapListeners) {
        listener()
      }
    }

    this.activeDirection = 'none'
  }

  private updateDirection(pointer: Phaser.Input.Pointer): void {
    // NOTE: Use game-space coords (pointer.x/y are already in game resolution via Phaser's scaling).
    const deltaX = pointer.x - CENTER_X
    const deltaY = pointer.y - CENTER_Y

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.activeDirection = deltaX < 0 ? 'left' : 'right'
    } else {
      this.activeDirection = deltaY < 0 ? 'up' : 'down'
    }
  }
}
