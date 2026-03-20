import Phaser from 'phaser'

export class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setSize(12, 12)
    this.setOffset(18, 32)
    this.setDepth(5)
    this.setCollideWorldBounds(true)
  }
}

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
