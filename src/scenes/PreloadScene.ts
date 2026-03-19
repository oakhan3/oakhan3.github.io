import Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    const centerX = this.cameras.main.centerX
    const centerY = this.cameras.main.centerY
    const barWidth = 160
    const barHeight = 8

    const barBackground = this.add.rectangle(centerX, centerY, barWidth, barHeight, 0x2d3748)
    barBackground.setStrokeStyle(1, 0x4a5568)

    const progressBar = this.add.rectangle(centerX - barWidth / 2, centerY, 0, barHeight - 2, 0x48bb78)
    progressBar.setOrigin(0, 0.5)

    this.add
      .text(centerX, centerY - 16, 'LOADING...', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: '#a0aec0',
      })
      .setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      progressBar.width = (barWidth - 2) * value
    })
  }

  create() {
    this.scene.start('OverworldScene')
  }
}
