import Phaser from 'phaser'
import { PlayerSprite } from './PlayerSprite'
import { PLAYER_SPEED, Direction } from '../../config'
import { TouchControls } from '../mobile/TouchControls'

const IDLE_FRAME: Record<Direction, number> = {
  down: 1,
  up: 4,
  left: 7,
  right: 10,
  none: 1,
}

export class PlayerController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd: Record<string, Phaser.Input.Keyboard.Key>
  private player: PlayerSprite
  private frozen = false
  private touchControls: TouchControls
  private currentFacing: Direction = 'down'

  constructor(scene: Phaser.Scene, player: PlayerSprite, touchControls: TouchControls) {
    this.player = player
    this.touchControls = touchControls
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: scene.input.keyboard!.addKey('W'),
      A: scene.input.keyboard!.addKey('A'),
      S: scene.input.keyboard!.addKey('S'),
      D: scene.input.keyboard!.addKey('D'),
    }
  }

  update(): void {
    // NOTE: Must explicitly zero velocity each frame while frozen — Matter bodies
    // retain momentum from the previous frame otherwise.
    if (this.frozen) {
      this.player.setVelocity(0, 0)
      this.player.anims.stop()
      this.player.setFrame(IDLE_FRAME[this.currentFacing])
      return
    }

    let velocityX = 0
    let velocityY = 0

    const touchDirection = this.touchControls.direction

    // NOTE: else-if chain enforces 4-directional movement — no diagonal.
    if (this.cursors.left.isDown || this.wasd.A.isDown || touchDirection === 'left') {
      velocityX = -PLAYER_SPEED
    } else if (this.cursors.right.isDown || this.wasd.D.isDown || touchDirection === 'right') {
      velocityX = PLAYER_SPEED
    } else if (this.cursors.up.isDown || this.wasd.W.isDown || touchDirection === 'up') {
      velocityY = -PLAYER_SPEED
    } else if (this.cursors.down.isDown || this.wasd.S.isDown || touchDirection === 'down') {
      velocityY = PLAYER_SPEED
    }

    this.player.setVelocity(velocityX, velocityY)

    if (velocityX < 0) {
      this.currentFacing = 'left'
      this.player.anims.play('walk-left', true)
    } else if (velocityX > 0) {
      this.currentFacing = 'right'
      this.player.anims.play('walk-right', true)
    } else if (velocityY < 0) {
      this.currentFacing = 'up'
      this.player.anims.play('walk-up', true)
    } else if (velocityY > 0) {
      this.currentFacing = 'down'
      this.player.anims.play('walk-down', true)
    } else {
      this.player.anims.stop()
      this.player.setFrame(IDLE_FRAME[this.currentFacing])
    }
  }

  get facing(): Direction {
    return this.currentFacing
  }

  freeze(): void {
    this.frozen = true
  }

  unfreeze(): void {
    this.frozen = false
  }

  isFrozen(): boolean {
    return this.frozen
  }
}
