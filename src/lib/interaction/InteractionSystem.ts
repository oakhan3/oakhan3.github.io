import Phaser from 'phaser'
import { PlayerController } from '../player/PlayerController'
import { DialogBox } from '../dialog/DialogBox'

export interface InteractionConfig {
  radius: number
  messages: Record<string, string>
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
  // NOTE: Tap flag set on pointerdown and consumed in update(). Lets touch
  // trigger an interaction without interfering with dialog's own tap handling
  // (which runs before update() sees it).
  private tapPending = false

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
    // NOTE: pointerdown sets a flag rather than triggering directly so we
    // can check it in update() after the frozen guard. Ignore taps while the
    // dialog is open — the dialog's own pointerdown listener handles those,
    // and letting tapPending be set would re-trigger the interaction on close.
    scene.input.on('pointerdown', () => {
      if (!this.dialog.isOpen()) this.tapPending = true
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
    this.dialog.show(message, () => {
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
  if (!objectLayer) return []

  const interactables: Interactable[] = []

  for (const object of objectLayer.objects) {
    if (!object.name) continue

    // NOTE: Polygon objects use the centroid of their vertices as the
    // interaction center. Point objects use their (x, y) directly.
    const polygon = object.polygon as { x: number; y: number }[] | undefined
    let centerX: number
    let centerY: number

    if (polygon && polygon.length >= 3) {
      let sumX = 0
      let sumY = 0
      for (const vertex of polygon) {
        sumX += object.x! + vertex.x
        sumY += object.y! + vertex.y
      }
      centerX = sumX / polygon.length
      centerY = sumY / polygon.length
    } else {
      centerX = object.x!
      centerY = object.y!
    }

    interactables.push({ name: object.name, x: centerX, y: centerY })
  }

  return interactables
}
