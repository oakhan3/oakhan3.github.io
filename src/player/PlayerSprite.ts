import Phaser from 'phaser'

export class PlayerSprite extends Phaser.Physics.Matter.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene.matter.world, x, y, 'player', 0)
    scene.add.existing(this)
    // NOTE: 12x12 rectangle body at the player's feet. Zero friction for
    // top-down RPG movement where velocity is set directly each frame.
    this.setRectangle(12, 12)
    this.setFixedRotation()
    this.setFriction(0)
    this.setFrictionAir(0)
    this.setFrictionStatic(0)
    this.setDepth(5)
  }
}

// NOTE: No walk-left animation — walk-right is reused with setFlipX(true) in the controller.
export function createPlayerAnimations(scene: Phaser.Scene): void {
  scene.anims.create({
    key: 'walk-down',
    frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1,
  })
  scene.anims.create({
    key: 'walk-right',
    frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
    frameRate: 8,
    repeat: -1,
  })
  scene.anims.create({
    key: 'walk-up',
    frames: scene.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
    frameRate: 8,
    repeat: -1,
  })
}
