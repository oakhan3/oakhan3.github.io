import Phaser from 'phaser'
import { PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT } from '../config'

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
        fontSize: '10px',
        color: '#a0aec0',
      })
      .setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      progressBar.width = (barWidth - 2) * value
    })

    const v = __GIT_SHA__
    this.load.image('heliodor', `assets/tilesets/heliodor.png?v=${v}`)
    this.load.image('computer-1', `assets/tilesets/computer-1.png?v=${v}`)
    this.load.image('supercar-blue', `assets/tilesets/supercar-blue.png?v=${v}`)
    this.load.image('dpad', `assets/controls/noun-d-pad-1670944.png?v=${v}`)
    this.load.image('dpad-highlight', `assets/controls/noun-d-pad-up-highlight.png?v=${v}`)
    this.load.tilemapTiledJSON('overworld-map', `assets/maps/overworld-3.json?v=${v}`)
    this.load.spritesheet('player', `assets/sprites/player.png?v=${v}`, {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT,
    })
  }

  create() {
    this.scene.start('OverworldScene')
  }
}
