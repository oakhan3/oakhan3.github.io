import Phaser from 'phaser'

export class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#4a8c5c')

    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, 'Coming Soon!!!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#fff',
      })
      .setOrigin(0.5)
  }
}
