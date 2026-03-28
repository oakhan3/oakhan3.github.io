import Phaser from 'phaser'
import { DEPTH_PLAYER } from '../../config'

export interface PlayerAnimationConfig {
  spriteKey: string
  frameRate: number
  // NOTE: No left entries — left animations reuse the right frames with setFlipX(true).
  animations: {
    idleDown: { key: string; frames: [number, number] }
    idleRight: { key: string; frames: [number, number] }
    idleUp: { key: string; frames: [number, number] }
    walkDown: { key: string; frames: [number, number] }
    walkRight: { key: string; frames: [number, number] }
    walkUp: { key: string; frames: [number, number] }
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

export function createPlayerAnimations(scene: Phaser.Scene, config: PlayerAnimationConfig): void {
  const { spriteKey, frameRate, animations } = config
  for (const anim of Object.values(animations)) {
    scene.anims.create({
      key: anim.key,
      frames: scene.anims.generateFrameNumbers(spriteKey, { start: anim.frames[0], end: anim.frames[1] }),
      frameRate,
      repeat: -1,
    })
  }
}
