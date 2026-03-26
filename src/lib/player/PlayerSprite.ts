import Phaser from 'phaser'
import { DEPTH_PLAYER } from '../../config'

export interface PlayerAnimationConfig {
  spriteKey: string
  frameRate: number
  animations: {
    down: { key: string; frames: [number, number] }
    right: { key: string; frames: [number, number] }
    up: { key: string; frames: [number, number] }
  }
}

export class PlayerSprite extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene.matter.world, x, y, 'player', 0)
    scene.add.existing(this)
    // NOTE: Small rectangle body at the player's feet. Zero friction for
    // top-down RPG movement where velocity is set directly each frame.
    this.setRectangle(12, 12)
    this.setFixedRotation()
    this.setFriction(0)
    this.setFrictionAir(0)
    this.setFrictionStatic(0)
    this.setDepth(DEPTH_PLAYER)
  }
}

// NOTE: No walk-left animation — walk-right is reused with setFlipX(true) in the controller.
export function createPlayerAnimations(scene: Phaser.Scene, config: PlayerAnimationConfig): void {
  const { spriteKey, frameRate, animations } = config
  scene.anims.create({
    key: animations.down.key,
    frames: scene.anims.generateFrameNumbers(spriteKey, {
      start: animations.down.frames[0],
      end: animations.down.frames[1],
    }),
    frameRate,
    repeat: -1,
  })
  scene.anims.create({
    key: animations.right.key,
    frames: scene.anims.generateFrameNumbers(spriteKey, {
      start: animations.right.frames[0],
      end: animations.right.frames[1],
    }),
    frameRate,
    repeat: -1,
  })
  scene.anims.create({
    key: animations.up.key,
    frames: scene.anims.generateFrameNumbers(spriteKey, {
      start: animations.up.frames[0],
      end: animations.up.frames[1],
    }),
    frameRate,
    repeat: -1,
  })
}
