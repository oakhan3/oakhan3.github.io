import Phaser from 'phaser'
import { PlayerSprite } from '../../lib/player'
import { PlayerController } from '../../lib/player'
import { DialogBox } from '../../lib/dialog'
import { TouchControls } from '../../lib/mobile'
import { SpotlightOverlay, LightningOverlay, SparkleOverlay } from '../../lib/overlay'
import { createSpotlightOverlay } from './overlays/spotlight'
import { createLightningOverlay } from './overlays/lightning'
import { createSparkleOverlay } from './overlays/sparkle'
import { createInteractionSystem, QUEST_DEFINITIONS } from './interaction'
import { setupPlayerAnimations } from './player'
import { InteractionSystem } from '../../lib/interaction'
import { QuestSystem, CompletionBanner, QuestOverlay, CongratulatoryOverlay } from '../../lib/quests'
import {
  DEPTH_QUEST_UI,
  isMobile,
  MOBILE_UI_TOP_OFFSET,
  DEPTH_ABOVE_PLAYER,
  QUEST_BTN_BACKGROUND_COLOR,
  QUEST_BTN_BORDER_COLOR,
  QUEST_BTN_HIT_PADDING_X,
  QUEST_BTN_HIT_PADDING_Y,
  QUEST_BTN_MARGIN,
  UI_CHROME_ALPHA,
  UI_FONT_FAMILY,
  UI_TEXT_COLOR,
} from '../../config'

interface LayerConfig {
  name: string
  collision?: 'fromGroup' | 'allTiles'
  depth?: number
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
  { name: 'AbovePlayer', depth: DEPTH_ABOVE_PLAYER },
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

    const { allLayers, collisionLayers } = _createLayers(map, tilesets)

    this.tileAnimations = _buildTileAnimations(map, allLayers)

    setupPlayerAnimations(this)

    const spawnX = Math.floor(map.widthInPixels / 2)
    const spawnY = Math.floor(map.heightInPixels / 2)
    const player = new PlayerSprite(this, spawnX, spawnY)

    // NOTE: Only convert layers that have collision defined — layers without
    // collision shapes (e.g. AbovePlayer) cause a null body crash in Matter.
    for (const layer of collisionLayers) {
      this.matter.world.convertTilemapLayer(layer)
    }

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
    const congratulatoryOverlay = new CongratulatoryOverlay(this)

    const { questIcon, questZone } = _createQuestButton(this, questOverlay, questSystem)

    _setupCameras(
      this,
      touchControls,
      dialog,
      completionBanner,
      questOverlay,
      congratulatoryOverlay,
      questIcon,
      questZone,
    )

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
      (() => {
        let shown = false
        return (name: string) => {
          // NOTE: Show congratulations after the interaction dialog closes so it
          // does not get overwritten by the interaction dialog itself.
          // Guard with a flag so it only fires once.
          if (!shown && questSystem.isComplete(name) && questSystem.isAllComplete()) {
            shown = true
            congratulatoryOverlay.show(
              `Thanks for stopping by!

This started as a small experiment and turned into a fun way to explore map building, try game dev with Phaser, and get more familiar with frontend ecosystems.

Hope you enjoyed it. Check back later, I might sneak in a few more updates!`,
            )
          }
        }
      })(),
    )
    this.playerController.freeze()
    const signHint = isMobile() ? 'Tapping' : "Hitting 'Enter'"
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

function _createQuestButton(
  scene: Phaser.Scene,
  questOverlay: QuestOverlay,
  questSystem: QuestSystem,
): { questIcon: Phaser.GameObjects.Container; questZone: Phaser.GameObjects.Zone } {
  const mobile = isMobile()
  const BTN_FONT_MOBILE = '8px'
  const BTN_FONT_DESKTOP = '6px'
  const BTN_HEIGHT_MOBILE = 22
  const BTN_HEIGHT_DESKTOP = 18
  const BTN_WIDTH_MOBILE = 72
  const BTN_WIDTH_DESKTOP = 60
  const btnFontSize = mobile ? BTN_FONT_MOBILE : BTN_FONT_DESKTOP
  const btnPadding = 6
  const btnHeight = mobile ? BTN_HEIGHT_MOBILE : BTN_HEIGHT_DESKTOP
  const btnWidth = mobile ? BTN_WIDTH_MOBILE : BTN_WIDTH_DESKTOP
  const btnX = scene.scale.width - QUEST_BTN_MARGIN
  const btnY = mobile ? MOBILE_UI_TOP_OFFSET : QUEST_BTN_MARGIN

  const background = scene.add.graphics()
  background.fillStyle(QUEST_BTN_BACKGROUND_COLOR, UI_CHROME_ALPHA)
  background.fillRoundedRect(0, 0, btnWidth, btnHeight, 3)
  background.lineStyle(2, QUEST_BTN_BORDER_COLOR, 1)
  background.strokeRoundedRect(0, 0, btnWidth, btnHeight, 3)

  // NOTE: setPadding enlarges the text canvas so the hit area extends well
  // beyond the visible text — same technique used for the dialog link button.
  // The label position is offset by the padding amount so the text stays
  // visually centered within the button background.
  const hitPadding = mobile ? { x: QUEST_BTN_HIT_PADDING_X, y: QUEST_BTN_HIT_PADDING_Y } : { x: 0, y: 0 }
  const label = scene.add.text(btnPadding - hitPadding.x, btnPadding - hitPadding.y, 'Quests', {
    fontFamily: UI_FONT_FAMILY,
    fontSize: btnFontSize,
    color: UI_TEXT_COLOR,
  })
  if (mobile) label.setPadding(hitPadding.x, hitPadding.y, hitPadding.x, hitPadding.y)
  label.setInteractive({ useHandCursor: true })
  label.on(
    'pointerdown',
    (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      // NOTE: Stop propagation so the scene-level 'pointerdown' dismiss listener on
      // QuestOverlay does not fire for this same click and immediately hide the overlay.
      event.stopPropagation()
      questOverlay.show(questSystem.getAll())
    },
  )

  const questIcon = scene.add.container(btnX - btnWidth, btnY, [background, label])
  questIcon.setScrollFactor(0)
  questIcon.setDepth(DEPTH_QUEST_UI)

  const questZone = scene.add.zone(btnX - btnWidth, btnY, btnWidth, btnHeight).setOrigin(0, 0)
  questZone.setScrollFactor(0)
  questZone.setDepth(DEPTH_QUEST_UI)
  questZone.setInteractive({ useHandCursor: true })
  questZone.on(
    'pointerdown',
    (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      questOverlay.show(questSystem.getAll())
    },
  )

  return { questIcon, questZone }
}

function _setupCameras(
  scene: Phaser.Scene,
  touchControls: TouchControls,
  dialog: DialogBox,
  completionBanner: CompletionBanner,
  questOverlay: QuestOverlay,
  congratulatoryOverlay: CongratulatoryOverlay,
  questIcon: Phaser.GameObjects.Container,
  questZone: Phaser.GameObjects.Zone,
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
    questIcon,
    questZone,
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
    if (config.collision === 'fromGroup') {
      layer.setCollisionFromCollisionGroup()
      // NOTE: Phaser bug — MatterTileBody calls Body.scale(body) where body is a null
      // local variable when the tile has flipX/flipY and the body was created from tile
      // collision shapes. Clear collision on flipped tiles to avoid the crash.
      layer.forEachTile((tile) => {
        if (tile.collides && (tile.flipX || tile.flipY)) tile.setCollision(false)
      })
      collisionLayers.push(layer)
    } else if (config.collision === 'allTiles') {
      layer.setCollisionByExclusion([-1])
      collisionLayers.push(layer)
    }

    if (config.depth !== undefined) {
      layer.setDepth(config.depth)
    }

    allLayers.push(layer)
  }

  return { allLayers, collisionLayers }
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
