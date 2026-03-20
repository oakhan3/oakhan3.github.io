import Phaser from 'phaser'
import { PlayerSprite } from './PlayerSprite'
import { PLAYER_SPEED } from '../config'

export class PlayerController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd: Record<string, Phaser.Input.Keyboard.Key>
  private player: PlayerSprite
  private frozen = false

  constructor(scene: Phaser.Scene, player: PlayerSprite) {
    this.player = player
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: scene.input.keyboard!.addKey('W'),
      A: scene.input.keyboard!.addKey('A'),
      S: scene.input.keyboard!.addKey('S'),
      D: scene.input.keyboard!.addKey('D'),
    }
  }

  update(): void {
    if (this.frozen) {
      this.player.setVelocity(0, 0)
      this.player.anims.stop()
      return
    }

    let velocityX = 0
    let velocityY = 0

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -PLAYER_SPEED
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = PLAYER_SPEED
    } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -PLAYER_SPEED
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = PLAYER_SPEED
    }

    this.player.setVelocity(velocityX, velocityY)

    if (velocityX < 0) {
      this.player.setFlipX(true)
      this.player.anims.play('walk-right', true)
    } else if (velocityX > 0) {
      this.player.setFlipX(false)
      this.player.anims.play('walk-right', true)
    } else if (velocityY < 0) {
      this.player.setFlipX(false)
      this.player.anims.play('walk-up', true)
    } else if (velocityY > 0) {
      this.player.setFlipX(false)
      this.player.anims.play('walk-down', true)
    } else {
      this.player.anims.stop()
    }
  }

  freeze(): void {
    this.frozen = true
  }

  unfreeze(): void {
    this.frozen = false
  }
}
