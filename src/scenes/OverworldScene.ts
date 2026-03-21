import Phaser from 'phaser'
import { PlayerSprite, createPlayerAnimations } from '../player/PlayerSprite'
import { PlayerController } from '../player/PlayerController'
import { DialogBox } from '../dialog/DialogBox'
import { TouchControls } from '../mobile/TouchControls'

const OPTIONAL_LAYERS = ['Decorations', 'Car', 'Kiwi', 'Collisions', 'AbovePlayer']

export class OverworldScene extends Phaser.Scene {
  private playerController!: PlayerController

  constructor() {
    super({ key: 'OverworldScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'overworld-map' })
    const tilesets = [
      map.addTilesetImage('tileset', 'tiny-realm')!,
      map.addTilesetImage('Grass_Middle', 'grass')!,
      map.addTilesetImage('Cliff_Tile', 'cliff')!,
      map.addTilesetImage('Path_Tile', 'path')!,
      map.addTilesetImage('Water_Tile', 'water')!,
      map.addTilesetImage('SpriteSheetBlue', 'parrot-blue')!,
      map.addTilesetImage('Blue_SUPERCAR_CLEAN_All_000-sheet-2', 'supercar-blue')!,
    ]

    map.createLayer('Ground', tilesets)
    map.createLayer('Buildings', tilesets)
    map.createLayer('Tree', tilesets)

    let collisionLayer: Phaser.Tilemaps.TilemapLayer | null = null

    for (const layerName of OPTIONAL_LAYERS) {
      const layer = map.createLayer(layerName, tilesets)
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

    const touchControls = new TouchControls(this)
    this.playerController = new PlayerController(this, player, touchControls)

    const dialog = new DialogBox(this)
    this.playerController.freeze()
    dialog.show("Hi, I'm Omar Ali Khan! Welcome to my page.", () => this.playerController.unfreeze())
  }

  update() {
    this.playerController.update()
  }
}
