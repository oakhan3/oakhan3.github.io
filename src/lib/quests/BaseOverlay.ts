import Phaser from 'phaser'
import { DEPTH_QUEST_UI, UI_BACKGROUND_COLOR, UI_BORDER_COLOR } from '../../config'
import {
  BACKGROUND_ALPHA,
  BOX_PADDING,
  DISMISS_HINT_DESKTOP,
  DISMISS_HINT_MOBILE,
  OVERLAY_SEPARATOR_OFFSET,
} from './constants'

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

  protected _addText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    const textObj = scene.add.text(x, y, text, style)
    textObj.setScrollFactor(0)
    this.contents.push(textObj)
    return textObj
  }

  protected _addGraphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics()
    graphics.setScrollFactor(0)
    this.contents.push(graphics)
    return graphics
  }

  // NOTE: Draws a horizontal separator below the given title and returns the
  // Y position of the separator so callers can position content beneath it.
  protected _addSeparator(scene: Phaser.Scene, topOffset: number, title: Phaser.GameObjects.Text): number {
    const screenWidth = scene.scale.width
    const separatorY = topOffset + title.height + OVERLAY_SEPARATOR_OFFSET
    const separator = this._addGraphics(scene)
    separator.lineStyle(1, this.borderColor, 0.5)
    separator.lineBetween(BOX_PADDING, separatorY, screenWidth - BOX_PADDING, separatorY)
    return separatorY
  }

  get isOpen(): boolean {
    return this.container.visible
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

  dismiss(): void {
    this._dismiss()
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
