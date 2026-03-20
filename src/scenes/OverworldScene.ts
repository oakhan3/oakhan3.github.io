import Phaser from 'phaser'
import { PlayerSprite, createPlayerAnimations } from '../player/PlayerSprite'
import { PlayerController } from '../player/PlayerController'

const OPTIONAL_LAYERS = ['Decoration', 'Collisions', 'AbovePlayer']

export class OverworldScene extends Phaser.Scene {
  private playerController!: PlayerController

  constructor() {
    super({ key: 'OverworldScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'overworld-map' })
    const tileset = map.addTilesetImage('overworld', 'overworld-tiles')!

    map.createLayer('Ground', tileset)
    map.createLayer('Buildings', tileset)

    let collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null

    for (const layerName of OPTIONAL_LAYERS) {
      const layer = map.createLayer(layerName, tileset)
      if (!layer) continue

      if (layerName === 'Collisions') {
        layer.setCollisionByExclusion([-1])
        layer.setVisible(false)
        collisionLayer = layer
      }

      if (layerName === 'AbovePlayer') {
        layer.setDepth(10)
      }
    }

    createPlayerAnimations(this)

    const spawnX = Math.floor(map.widthInPixels / 2)
    const spawnY = Math.floor(map.heightInPixels / 2)
    const player = new PlayerSprite(this, spawnX, spawnY)

    if (collisionLayer) {
      this.physics.add.collider(player, collisionLayer)
    }

    this.cameras.main.startFollow(player, true)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    this.playerController = new PlayerController(this, player)
  }

  update() {
    this.playerController.update()
  }
}
