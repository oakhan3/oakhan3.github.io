import Phaser from 'phaser'

const OPTIONAL_LAYERS = ['Decoration', 'Collisions', 'AbovePlayer']

export class OverworldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OverworldScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'overworld-map' })
    const tileset = map.addTilesetImage('overworld', 'overworld-tiles')!

    map.createLayer('Ground', tileset)
    map.createLayer('Buildings', tileset)

    for (const layerName of OPTIONAL_LAYERS) {
      const layer = map.createLayer(layerName, tileset)
      if (!layer) continue

      if (layerName === 'Collisions') {
        layer.setCollisionByExclusion([-1])
        layer.setVisible(false)
      }

      if (layerName === 'AbovePlayer') {
        layer.setDepth(10)
      }
    }

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
  }
}
