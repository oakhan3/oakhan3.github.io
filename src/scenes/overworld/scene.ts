import Phaser from 'phaser'
import { PlayerSprite } from '../../lib/player'
import { PlayerController } from '../../lib/player'
import { DialogBox } from '../../lib/dialog'
import { TouchControls } from '../../lib/mobile'
import { SpotlightOverlay, LightningOverlay, SparkleOverlay } from '../../lib/overlay'
import { createSpotlightOverlay } from './overlays/spotlight'
import { createLightningOverlay } from './overlays/lightning'
import { createSparkleOverlay } from './overlays/sparkle'
import { createCollisions } from './collision'
import { createInteractionSystem, QUEST_DEFINITIONS } from './interaction'
import { setupPlayerAnimations } from './player'
import { InteractionSystem } from '../../lib/interaction'
import { QuestSystem, CompletionBanner, QuestOverlay } from '../../lib/quests'
import { DEPTH_QUEST_UI } from '../../config'

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
  { name: 'MiscOverlays', collision: 'fromGroup' },
  { name: 'StageLights', collision: 'fromGroup' },
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
  private spotlightOverlay!: SpotlightOverlay
  private sparkleOverlay!: SparkleOverlay
  private lightningOverlay!: LightningOverlay
  private interactionSystem!: InteractionSystem

  constructor() {
    super({ key: 'OverworldScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'overworld-map' })
    // NOTE: Tileset names in the Tiled JSON match the Phaser cache keys from
    // PreloadScene, so a single arg is sufficient.
    const heliodor = map.addTilesetImage('heliodor')
    if (!heliodor) throw new Error("Tileset 'heliodor' not found in the tilemap.")
    const tilesets = [heliodor]

    const layers = _createLayers(map, tilesets)

    this.tileAnimations = _buildTileAnimations(map, layers)

    setupPlayerAnimations(this)

    const spawnX = Math.floor(map.widthInPixels / 2)
    const spawnY = Math.floor(map.heightInPixels / 2)
    const player = new PlayerSprite(this, spawnX, spawnY)

    // NOTE: convertTilemapLayer reads Tiled objectgroup polygon shapes and creates
    // accurate Matter bodies instead of full-tile rectangles.
    for (const layer of layers) {
      this.matter.world.convertTilemapLayer(layer)
    }

    // NOTE: Object layer collisions — reads Collisions and Interactables layers
    // from the Tiled JSON and creates static Matter polygon bodies.
    createCollisions(this, map)

    this.cameras.main.startFollow(player, true)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    this.spotlightOverlay = createSpotlightOverlay(this, map.widthInPixels, map.heightInPixels, player)
    this.sparkleOverlay = createSparkleOverlay(this, map.widthInPixels, map.heightInPixels)
    this.lightningOverlay = createLightningOverlay(this, map.widthInPixels, map.heightInPixels)

    const touchControls = new TouchControls(this)
    this.playerController = new PlayerController(this, player, touchControls)

    const dialog = new DialogBox(this)

    const questSystem = new QuestSystem(QUEST_DEFINITIONS)
    const completionBanner = new CompletionBanner(this)
    const questOverlay = new QuestOverlay(this)

    // NOTE: Quest button in the top-right corner — styled like the dialog box.
    const isMobile = window.innerWidth < 768
    const btnFontSize = isMobile ? '8px' : '6px'
    const btnPadding = 6
    const btnHeight = isMobile ? 22 : 18
    const btnWidth = isMobile ? 72 : 60
    const btnX = this.scale.width - 8
    const btnY = 8

    const questBtnBg = this.add.graphics()
    questBtnBg.fillStyle(0x1e3a5f, 0.92)
    questBtnBg.fillRoundedRect(0, 0, btnWidth, btnHeight, 3)
    questBtnBg.lineStyle(2, 0xf97316, 1)
    questBtnBg.strokeRoundedRect(0, 0, btnWidth, btnHeight, 3)

    const questBtnLabel = this.add.text(btnPadding, btnPadding, 'Quests', {
      fontFamily: '"Press Start 2P"',
      fontSize: btnFontSize,
      color: '#e2e8f0',
    })

    const questIcon = this.add.container(btnX - btnWidth, btnY, [questBtnBg, questBtnLabel])
    questIcon.setScrollFactor(0)
    questIcon.setDepth(DEPTH_QUEST_UI)
    // NOTE: Zone provides a reliable hit area independent of font loading.
    const questZone = this.add.zone(btnX - btnWidth, btnY, btnWidth, btnHeight).setOrigin(0, 0)
    questZone.setScrollFactor(0)
    questZone.setDepth(DEPTH_QUEST_UI)
    questZone.setInteractive({ useHandCursor: true })
    questZone.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        // NOTE: Stop propagation so the scene-level 'pointerdown' dismiss listener on
        // QuestOverlay does not fire for this same click and immediately hide the overlay.
        event.stopPropagation()
        questOverlay.show(questSystem.getAll())
      },
    )

    if (window.innerWidth < 768) {
      this.cameras.main.setZoom(2)
      // NOTE: A second camera at zoom 1 renders UI elements (dialog, quest UI) so they
      // are not affected by the main camera's zoom. The main camera ignores
      // UI objects; the UI camera ignores everything else.
      const uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
      const uiObjects = [
        ...dialog.getGameObjects(),
        ...completionBanner.getGameObjects(),
        ...questOverlay.getGameObjects(),
        questIcon,
        questZone,
      ]
      this.cameras.main.ignore(uiObjects)
      const uiSet = new Set(uiObjects)
      uiCamera.ignore(this.children.list.filter((obj) => !uiSet.has(obj)))
    }

    this.interactionSystem = createInteractionSystem(
      this,
      map,
      player,
      this.playerController,
      dialog,
      (name: string) => {
        const quest = questSystem.complete(name)
        if (quest) completionBanner.show(quest.label)
      },
    )
    this.playerController.freeze()
    const signHint = window.innerWidth < 768 ? 'Tapping' : "Hitting 'Enter'"
    dialog.show(`Welcome, I'm Omar Ali Khan!\n\nTry ${signHint} on the signs!`, undefined, undefined, () => {
      this.playerController.unfreeze()
      questOverlay.show(questSystem.getAll())
    })
  }

  update(_time: number, delta: number) {
    this.playerController.update()
    this.interactionSystem.update()
    this.spotlightOverlay.update()
    this.sparkleOverlay.update()
    this.lightningOverlay.update()
    _updateTileAnimations(this.tileAnimations, delta)
  }
}

function _createLayers(
  map: Phaser.Tilemaps.Tilemap,
  tilesets: Phaser.Tilemaps.Tileset[],
): Phaser.Tilemaps.TilemapLayer[] {
  const layers: Phaser.Tilemaps.TilemapLayer[] = []

  for (const config of LAYERS) {
    const layer = map.createLayer(config.name, tilesets)
    if (!layer) throw new Error(`Tile layer '${config.name}' not found in the tilemap.`)

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
