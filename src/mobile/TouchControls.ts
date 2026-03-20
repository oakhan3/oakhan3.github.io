import Phaser from 'phaser'
import { GBA_WIDTH, GBA_HEIGHT } from '../config'

const CENTER_X = GBA_WIDTH / 2
const CENTER_Y = GBA_HEIGHT / 2
export type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

export class TouchControls {
  private activeDirection: Direction = 'none'

  constructor(scene: Phaser.Scene) {
    scene.input.on('pointerdown', this.handlePointerDown, this)
    scene.input.on('pointermove', this.handlePointerMove, this)
    scene.input.on('pointerup', this.handlePointerUp, this)
  }

  get direction(): Direction {
    return this.activeDirection
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.updateDirection(pointer)
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown) return
    this.updateDirection(pointer)
  }

  private handlePointerUp(): void {
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
