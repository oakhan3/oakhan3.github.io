import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1b2e')

    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY

    this.add
      .text(centerX, centerY - 20, "PROF. OAK'S WORLD", {
        fontFamily: '"Press Start 2P"',
        fontSize: '20px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5)

    const prompt = this.add
      .text(centerX, centerY + 20, 'PRESS ANY KEY', {
        fontFamily: '"Press Start 2P"',
        fontSize: '15px',
        color: '#a0aec0',
      })
      .setOrigin(0.5)

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    this.input.keyboard!.on('keydown', () => {
      this.scene.start('PreloadScene')
    })

    this.input.on('pointerdown', () => {
      this.scene.start('PreloadScene')
    })
  }
}
