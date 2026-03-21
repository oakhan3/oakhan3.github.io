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
        fontSize: '6px',
        color: '#a0aec0',
      })
      .setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      progressBar.width = (barWidth - 2) * value
    })

    this.load.image('tiny-realm', 'assets/tilesets/tiny-realm.png')
    this.load.image('grass', 'assets/tilesets/grass.png')
    this.load.image('cliff', 'assets/tilesets/cliff.png')
    this.load.image('path', 'assets/tilesets/path.png')
    this.load.image('water', 'assets/tilesets/water.png')
    this.load.image('parrot-blue', 'assets/tilesets/parrot-blue.png')
    this.load.image('supercar-blue', 'assets/tilesets/supercar-blue.png')
    this.load.tilemapTiledJSON('overworld-map', 'assets/maps/overworld-v2.json')
    this.load.spritesheet('player', 'assets/sprites/player.png', {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT,
    })
  }

  create() {
    this.scene.start('OverworldScene')
  }
}
