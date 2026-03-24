import Phaser from 'phaser'
import { TOUCH_DEADZONE } from '../../config'
import { computeCentroid } from '../collision'
import { PlayerController } from '../player/PlayerController'
import { DialogBox } from '../dialog/DialogBox'

export interface Message {
  text: string
  url?: string
  display_link?: string
}

export interface InteractionConfig {
  radius: number
  messages: Record<string, Message>
}

interface Interactable {
  name: string
  x: number
  y: number
}

export class InteractionSystem {
  private scene: Phaser.Scene
  private config: InteractionConfig
  private player: Phaser.GameObjects.Sprite
  private playerController: PlayerController
  private dialog: DialogBox
  private interactables: Interactable[]
  private spaceKey: Phaser.Input.Keyboard.Key
  private enterKey: Phaser.Input.Keyboard.Key
  // NOTE: Tap flag set on pointerup (if no drag) and consumed in update(). Lets
  // touch trigger an interaction without interfering with dialog's own tap
  // handling (which runs before update() sees it).
  private tapPending = false
  private touchStartX = 0
  private touchStartY = 0
  private dialogOpenOnTouchStart = false

  constructor(
    scene: Phaser.Scene,
    map: Phaser.Tilemaps.Tilemap,
    player: Phaser.GameObjects.Sprite,
    playerController: PlayerController,
    dialog: DialogBox,
    config: InteractionConfig,
  ) {
    this.scene = scene
    this.config = config
    this.player = player
    this.playerController = playerController
    this.dialog = dialog
    this.interactables = _parseInteractables(map)
    this.spaceKey = scene.input.keyboard!.addKey('SPACE')
    this.enterKey = scene.input.keyboard!.addKey('ENTER')
    // NOTE: Snapshot dialog state on pointerdown. The dialog closes synchronously
    // during pointerdown (via handleAdvance), so by the time pointerup fires
    // isOpen() is already false — using the snapshot prevents the closing tap
    // from setting tapPending and immediately re-triggering the interaction.
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x
      this.touchStartY = pointer.y
      this.dialogOpenOnTouchStart = this.dialog.isOpen()
    })
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.dialogOpenOnTouchStart) return
      const dx = pointer.x - this.touchStartX
      const dy = pointer.y - this.touchStartY
      if (Math.abs(dx) < TOUCH_DEADZONE && Math.abs(dy) < TOUCH_DEADZONE) {
        this.tapPending = true
      }
    })
  }

  update() {
    // NOTE: Don't check for new interactions while player is already frozen
    // (dialog open, etc.). Consume any pending tap so it doesn't fire after
    // the dialog closes.
    if (this.playerController.isFrozen() || this.dialog.isOpen()) {
      this.tapPending = false
      return
    }

    // NOTE: Use JustDown for triggering. The onClose callback calls resetKeys(),
    // which clears _justDown in the same frame the dialog closes — so the keydown
    // that dismissed the dialog cannot re-trigger here. JustUp was tried but fails
    // because the key-up fires in the *next* frame, after resetKeys() has already run.
    const triggered =
      Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey) || this.tapPending
    this.tapPending = false

    if (!triggered) return

    const nearby = this._findNearbyInteractable()
    if (!nearby) return

    const message = this.config.messages[nearby.name]
    if (!message) return

    this.playerController.freeze()
    this.dialog.show(message.text, message.url, message.display_link, () => {
      this.playerController.unfreeze()
      // NOTE: Clear all key states so the key that dismissed the dialog
      // cannot immediately re-trigger an interaction in the same frame.
      this.scene.input.keyboard!.resetKeys()
    })
  }

  private _findNearbyInteractable(): Interactable | null {
    const px = this.player.x
    const py = this.player.y

    for (const interactable of this.interactables) {
      const dx = interactable.x - px
      const dy = interactable.y - py
      if (Math.sqrt(dx * dx + dy * dy) <= this.config.radius) {
        return interactable
      }
    }
    return null
  }
}

function _parseInteractables(map: Phaser.Tilemaps.Tilemap): Interactable[] {
  const objectLayer = map.getObjectLayer('Interactables')
  if (!objectLayer) throw new Error("Object layer 'Interactables' not found in the tilemap.")

  const interactables: Interactable[] = []

  for (const object of objectLayer.objects) {
    if (!object.name) continue

    // NOTE: Polygon objects use the centroid of their vertices as the
    // interaction center. Point objects use their (x, y) directly.
    const polygon = object.polygon as { x: number; y: number }[] | undefined
    let centerX: number
    let centerY: number

    if (polygon && polygon.length >= 3) {
      const absoluteVertices = polygon.map((vertex) => ({ x: object.x! + vertex.x, y: object.y! + vertex.y }))
      const centroid = computeCentroid(absoluteVertices)
      centerX = centroid.x
      centerY = centroid.y
    } else {
      centerX = object.x!
      centerY = object.y!
    }

    interactables.push({ name: object.name, x: centerX, y: centerY })
  }

  return interactables
}
