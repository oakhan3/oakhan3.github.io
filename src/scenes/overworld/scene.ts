import Phaser from 'phaser'
import { PlayerSprite } from '../../lib/player'
import { PlayerController } from '../../lib/player'
import { DialogBox } from '../../lib/dialog'
import { TouchControls } from '../../lib/mobile'
import { SpotlightOverlay, LightningOverlay, SparkleOverlay } from '../../lib/overlay'
import { createSpotlightOverlay } from './overlays/spotlight'
import { createLightningOverlay } from './overlays/lightning'
import { createSparkleOverlay } from './overlays/sparkle'
import { flags } from '../../game-flags'
import { createInteractionSystem } from './interaction'
import { QUEST_DEFINITIONS, CONGRATULATORY_MESSAGE } from './interaction-data'
import { TileAnimation, buildTileAnimations, updateTileAnimations } from './tile-animations'
import { setupPlayerAnimations } from './player'
import { InteractionSystem } from '../../lib/interaction'
import { QuestSystem, CompletionBanner, QuestOverlay, CongratulatoryOverlay, QuestButton } from '../../lib/quests'
import { isMobile, DEPTH_ABOVE_PLAYER } from '../../config'

interface LayerConfig {
  name: string
  collision?: boolean
  depth?: number
}

const LAYERS: LayerConfig[] = [
  { name: 'Ground' },
  { name: 'BackBackTree', collision: true },
  { name: 'BackTree', collision: true },
  { name: 'Inaccessible Area' },
  { name: 'Tile Rise', collision: true },
  { name: 'BeachFun', collision: true },
  { name: 'MiscOverlays', collision: true },
  { name: 'StageLights' },
  { name: 'AbovePlayer', depth: DEPTH_ABOVE_PLAYER },
]

export class OverworldScene extends Phaser.Scene {
  private playerController!: PlayerController
  private tileAnimations: TileAnimation[] = []
  private spotlightOverlay?: SpotlightOverlay
  private sparkleOverlay?: SparkleOverlay
  private lightningOverlay?: LightningOverlay
  private interactionSystem!: InteractionSystem
  private completionBanner!: CompletionBanner
  private questOverlay!: QuestOverlay
  private questSystem!: QuestSystem
  private congratulatoryOverlay!: CongratulatoryOverlay

  constructor() {
    super({ key: 'OverworldScene' })
  }

  create() {
    const map = this.make.tilemap({ key: 'overworld-map' })
    // NOTE: Tileset names in the Tiled JSON match the Phaser cache keys from
    // PreloadScene, so a single arg is sufficient.
    const heliodor = map.addTilesetImage('heliodor')
    if (!heliodor) throw new Error("Tileset 'heliodor' not found in the tilemap.")
    const computer1 = map.addTilesetImage('computer-1')
    if (!computer1) throw new Error("Tileset 'computer-1' not found in the tilemap.")
    const supercarBlue = map.addTilesetImage('supercar-blue')
    if (!supercarBlue) throw new Error("Tileset 'supercar-blue' not found in the tilemap.")
    const tilesets = [heliodor, computer1, supercarBlue]

    const { allLayers, collisionLayers } = _createLayers(map, tilesets)

    this.tileAnimations = buildTileAnimations(map, allLayers)

    setupPlayerAnimations(this)

    const spawnX = 28 * 16
    const spawnY = 22 * 16
    const player = new PlayerSprite(this, spawnX, spawnY)

    // NOTE: Only convert layers that have collision defined — layers without
    // collision shapes (e.g. AbovePlayer) cause a null body crash in Matter.
    for (const layer of collisionLayers) {
      this.matter.world.convertTilemapLayer(layer)
    }

    this.cameras.main.startFollow(player, true)
    if (isMobile()) this.cameras.main.setFollowOffset(0, -115)
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    if (!flags.disableOverlays) {
      this.spotlightOverlay = createSpotlightOverlay(this, map.widthInPixels, map.heightInPixels, player)
      this.sparkleOverlay = createSparkleOverlay(this, map.widthInPixels, map.heightInPixels)
      this.lightningOverlay = createLightningOverlay(this, map.widthInPixels, map.heightInPixels)
    }

    const touchControls = new TouchControls(this)
    this.playerController = new PlayerController(this, player, touchControls)

    const dialog = new DialogBox(this)

    this.questSystem = new QuestSystem(QUEST_DEFINITIONS)
    this.completionBanner = new CompletionBanner(this)
    this.questOverlay = new QuestOverlay(this)
    this.congratulatoryOverlay = new CongratulatoryOverlay(this)

    const questButton = new QuestButton(this, this.questOverlay, this.questSystem)

    _setupCameras(
      this,
      touchControls,
      dialog,
      this.completionBanner,
      this.questOverlay,
      this.congratulatoryOverlay,
      questButton.getGameObjects(),
    )

    this.interactionSystem = createInteractionSystem(
      this,
      map,
      player,
      this.playerController,
      dialog,
      (name: string) => {
        const quest = this.questSystem.complete(name)
        if (quest) this.completionBanner.show(quest.label)
      },
      (() => {
        let shown = false
        return (name: string) => {
          // NOTE: Show congratulations after the interaction dialog closes so it
          // does not get overwritten by the interaction dialog itself.
          // Guard with a flag so it only fires once.
          if (!shown && this.questSystem.isComplete(name) && this.questSystem.isAllComplete()) {
            shown = true
            this.congratulatoryOverlay.show(CONGRATULATORY_MESSAGE)
          }
        }
      })(),
    )

    this.playerController.freeze()
    dialog.show(`Hi, I'm Omar Ali Khan,\nwelcome to my World!`, undefined, undefined, () => {
      this.playerController.unfreeze()
      this.questOverlay.show(this.questSystem.getAll())
    })
  }

  update(_time: number, delta: number) {
    if (flags.collectFrameTimes) {
      const now = performance.now()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bench = (window as any).__benchmark
      if (bench._lastFrameTime !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;((window as any).__frameTimes as number[]).push(now - bench._lastFrameTime)
      }
      bench._lastFrameTime = now
    }
    this.playerController.update()
    this.interactionSystem.update()
    if (flags.collectSpotlightTimes && this.spotlightOverlay) {
      const start = performance.now()
      this.spotlightOverlay.update()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).__spotlightTimes as number[]).push(performance.now() - start)
    } else {
      this.spotlightOverlay?.update()
    }
    this.sparkleOverlay?.update()
    this.lightningOverlay?.update()
    updateTileAnimations(this.tileAnimations, delta)
  }
}

function _setupCameras(
  scene: Phaser.Scene,
  touchControls: TouchControls,
  dialog: DialogBox,
  completionBanner: CompletionBanner,
  questOverlay: QuestOverlay,
  congratulatoryOverlay: CongratulatoryOverlay,
  questButtonObjects: Phaser.GameObjects.GameObject[],
): void {
  if (!isMobile()) return

  scene.cameras.main.setZoom(2)
  // NOTE: A second camera at zoom 1 renders UI elements (dialog, quest UI) so they
  // are not affected by the main camera's zoom. The main camera ignores
  // UI objects; the UI camera ignores everything else.
  const uiCamera = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height)
  const uiObjects = [
    ...touchControls.getGameObjects(),
    ...dialog.getGameObjects(),
    ...completionBanner.getGameObjects(),
    ...questOverlay.getGameObjects(),
    ...congratulatoryOverlay.getGameObjects(),
    ...questButtonObjects,
  ]
  scene.cameras.main.ignore(uiObjects)
  const uiSet = new Set(uiObjects)
  uiCamera.ignore(scene.children.list.filter((obj) => !uiSet.has(obj)))
}

function _createLayers(
  map: Phaser.Tilemaps.Tilemap,
  tilesets: Phaser.Tilemaps.Tileset[],
): { allLayers: Phaser.Tilemaps.TilemapLayer[]; collisionLayers: Phaser.Tilemaps.TilemapLayer[] } {
  const allLayers: Phaser.Tilemaps.TilemapLayer[] = []
  const collisionLayers: Phaser.Tilemaps.TilemapLayer[] = []

  for (const config of LAYERS) {
    const layer = map.createLayer(config.name, tilesets)
    if (!layer) throw new Error(`Tile layer '${config.name}' not found in the tilemap.`)

    // NOTE: Collision flags must be set BEFORE convertTilemapLayer() — only
    // tiles marked as colliding get converted to Matter bodies.
    if (config.collision) {
      layer.setCollisionFromCollisionGroup()
      // NOTE: Phaser bug — MatterTileBody calls Body.scale(body) where body is a null
      // local variable when the tile has flipX/flipY and the body was created from tile
      // collision shapes. Clear collision on flipped tiles to avoid the crash.
      layer.forEachTile((tile) => {
        if (tile.collides && (tile.flipX || tile.flipY)) tile.setCollision(false)
      })
      collisionLayers.push(layer)
    }

    if (config.depth !== undefined) {
      layer.setDepth(config.depth)
    }

    allLayers.push(layer)
  }

  return { allLayers, collisionLayers }
}
