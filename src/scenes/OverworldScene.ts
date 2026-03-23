import Phaser from 'phaser'
import { PlayerSprite, createPlayerAnimations } from '../player/PlayerSprite'
import { PlayerController } from '../player/PlayerController'
import { DialogBox } from '../dialog/DialogBox'
import { TouchControls } from '../mobile/TouchControls'
import { LightingOverlay } from '../lighting/LightingOverlay'

interface LayerConfig {
  name: string
  collision?: 'fromGroup' | 'allTiles'
}

// NOTE: 'fromGroup' reads per-tile objectgroup collision shapes from the tileset in Tiled.
// 'allTiles' blocks every non-empty tile — used for Kiwi because its objectgroup shapes
// weren't picked up by setCollisionFromCollisionGroup() despite being defined in Tiled.
const LAYERS: LayerConfig[] = [
  { name: 'Ground' },
  { name: 'BackBackTree', collision: 'fromGroup' },
  { name: 'BackTree', collision: 'fromGroup' },
  { name: 'Tile Rise', collision: 'fromGroup' },
  { name: 'BeachFun', collision: 'fromGroup' },
  { name: 'Tile Layer 8', collision: 'fromGroup' },
  { name: 'Tile Layer 7', collision: 'fromGroup' },
]

interface TileAnimation {
  layer: Phaser.Tilemaps.TilemapLayer
  row: number
  col: number
  frames: { gid: number; duration: number }[]
  frameIndex: number
  elapsed: number
}

export class OverworldScene extends Phaser.Scene {
  private playerController!: PlayerController
  private tileAnimations: TileAnimation[] = []
  private lightingOverlay!: LightingOverlay

  constructor() {
    super({ key: 'OverworldScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'overworld-map' })
    // NOTE: Tileset names in the Tiled JSON match the Phaser cache keys from
    // PreloadScene, so a single arg is sufficient.
    const tilesets = [map.addTilesetImage('heliodor')!]

    const layers = _createLayers(map, tilesets)

    this.tileAnimations = _buildTileAnimations(map, layers)

    createPlayerAnimations(this)

    const spawnX = Math.floor(map.widthInPixels / 2)
    const spawnY = Math.floor(map.heightInPixels / 2)
    const player = new PlayerSprite(this, spawnX, spawnY)

    // NOTE: convertTilemapLayer reads Tiled objectgroup polygon shapes and creates
    // accurate Matter bodies instead of full-tile rectangles.
    for (const layer of layers) {
      this.matter.world.convertTilemapLayer(layer)
    }

    this.cameras.main.startFollow(player, true)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    this.lightingOverlay = new LightingOverlay(this, map.widthInPixels, map.heightInPixels, player)

    const touchControls = new TouchControls(this)
    this.playerController = new PlayerController(this, player, touchControls)

    const dialog = new DialogBox(this)
    this.playerController.freeze()
    dialog.show("Hi, I'm Omar Ali Khan! Welcome to my page.", () => this.playerController.unfreeze())
  }

  update(_time: number, delta: number) {
    this.playerController.update()
    this.lightingOverlay.update()
    _updateTileAnimations(this.tileAnimations, delta)
  }
}

function _createLayers(
  map: Phaser.Tilemaps.Tilemap,
  tilesets: Phaser.Tilemaps.Tileset[],
): Phaser.Tilemaps.TilemapLayer[] {
  const layers: Phaser.Tilemaps.TilemapLayer[] = []

  for (const config of LAYERS) {
    const layer = map.createLayer(config.name, tilesets)!

    // NOTE: Collision flags must be set BEFORE convertTilemapLayer() — only
    // tiles marked as colliding get converted to Matter bodies.
    if (config.collision === 'fromGroup') {
      layer.setCollisionFromCollisionGroup()
    } else if (config.collision === 'allTiles') {
      layer.setCollisionByExclusion([-1])
    }

    layers.push(layer)
  }

  return layers
}

function _buildTileAnimations(map: Phaser.Tilemaps.Tilemap, layers: Phaser.Tilemaps.TilemapLayer[]): TileAnimation[] {
  // NOTE: Build a lookup of GID -> animation frames from tileset data
  const animatedTiles = new Map<number, { firstgid: number; frames: { tileid: number; duration: number }[] }>()

  for (const tileset of map.tilesets) {
    const tileData = tileset.tileData as Record<string, { animation?: { tileid: number; duration: number }[] }>
    for (const [localId, data] of Object.entries(tileData)) {
      if (data.animation) {
        const gid = tileset.firstgid + parseInt(localId, 10)
        animatedTiles.set(gid, { firstgid: tileset.firstgid, frames: data.animation })
      }
    }
  }

  const animations: TileAnimation[] = []

  for (const layer of layers) {
    layer.forEachTile((tile) => {
      const animData = animatedTiles.get(tile.index)
      if (!animData) return

      animations.push({
        layer,
        row: tile.y,
        col: tile.x,
        frames: animData.frames.map((frame) => ({
          gid: animData.firstgid + frame.tileid,
          duration: frame.duration,
        })),
        frameIndex: 0,
        elapsed: 0,
      })
    })
  }

  return animations
}

function _updateTileAnimations(animations: TileAnimation[], delta: number) {
  for (const anim of animations) {
    anim.elapsed += delta
    const currentFrame = anim.frames[anim.frameIndex]
    if (anim.elapsed >= currentFrame.duration) {
      anim.elapsed -= currentFrame.duration
      anim.frameIndex = (anim.frameIndex + 1) % anim.frames.length
      // NOTE: putTileAt swaps the visual tile but the MatterTileBody created by
      // convertTilemapLayer persists. This works because all animation frames share
      // the same collision shape (full-tile blockers) (for now!).
      anim.layer.putTileAt(anim.frames[anim.frameIndex].gid, anim.col, anim.row)
    }
  }
}
