import Phaser from 'phaser'
import { DEPTH_QUEST_UI, UI_BACKGROUND_COLOR, UI_BORDER_COLOR } from '../../config'
import { BACKGROUND_ALPHA, DISMISS_HINT_DESKTOP, DISMISS_HINT_MOBILE } from './constants'

export abstract class BaseOverlay {
  protected scene: Phaser.Scene
  protected container: Phaser.GameObjects.Container
  protected contents: Phaser.GameObjects.GameObject[] = []
  private background: Phaser.GameObjects.Graphics
  private dismissKeys: Phaser.Input.Keyboard.Key[]
  private onDismiss?: () => void

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    const screenWidth = scene.scale.width
    const screenHeight = scene.scale.height

    this.background = scene.add.graphics()
    this.background.fillStyle(UI_BACKGROUND_COLOR, BACKGROUND_ALPHA)
    this.background.fillRect(0, 0, screenWidth, screenHeight)

    this.container = scene.add.container(0, 0, [this.background])
    this.container.setScrollFactor(0)
    this.container.setDepth(DEPTH_QUEST_UI)
    this.container.setVisible(false)

    this.dismissKeys = [scene.input.keyboard!.addKey('SPACE'), scene.input.keyboard!.addKey('ENTER')]
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.container]
  }

  // NOTE: Exposes the separator line color for subclasses that draw separators.
  protected get borderColor(): number {
    return UI_BORDER_COLOR
  }

  protected get dismissHint(): string {
    return window.innerWidth < 768 ? DISMISS_HINT_MOBILE : DISMISS_HINT_DESKTOP
  }

  protected _show(onDismiss?: () => void): void {
    this.onDismiss = onDismiss

    for (const object of this.contents) {
      ;(object as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy()
    }
    this.contents = []

    this.container.setVisible(true)

    for (const key of this.dismissKeys) {
      key.removeAllListeners()
      key.once('down', this._dismiss, this)
    }
    // NOTE: Use a bound method (not an arrow function) so off() can find and remove the same reference.
    this.scene.input.on('pointerdown', this._dismiss, this)
  }

  private _dismiss(): void {
    this.container.setVisible(false)
    for (const key of this.dismissKeys) {
      key.removeAllListeners()
    }
    this.scene.input.off('pointerdown', this._dismiss, this)
    this.onDismiss?.()
  }
}
