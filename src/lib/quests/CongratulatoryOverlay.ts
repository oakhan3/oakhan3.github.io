import Phaser from 'phaser'
import { DEPTH_QUEST_UI, MOBILE_UI_TOP_OFFSET } from '../../config'

const BACKGROUND_COLOR = 0x1a1b2e
const BACKGROUND_ALPHA = 0.75
const BORDER_COLOR = 0xe2e8f0
const BOX_PADDING = 16
const LINE_SPACING = 10

export class CongratulatoryOverlay {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private background: Phaser.GameObjects.Graphics
  private contents: Phaser.GameObjects.GameObject[] = []
  private dismissKeys: Phaser.Input.Keyboard.Key[]
  private onDismiss?: () => void

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    const screenWidth = scene.scale.width
    const screenHeight = scene.scale.height

    this.background = scene.add.graphics()
    this.background.fillStyle(BACKGROUND_COLOR, BACKGROUND_ALPHA)
    this.background.fillRect(0, 0, screenWidth, screenHeight)

    this.container = scene.add.container(0, 0, [this.background])
    this.container.setScrollFactor(0)
    this.container.setDepth(DEPTH_QUEST_UI)
    this.container.setVisible(false)

    this.dismissKeys = [scene.input.keyboard!.addKey('SPACE'), scene.input.keyboard!.addKey('ENTER')]
  }

  show(message: string, onDismiss?: () => void): void {
    this.onDismiss = onDismiss
    const scene = this.scene
    const screenWidth = scene.scale.width
    const isMobile = window.innerWidth < 768

    for (const object of this.contents) {
      ;(object as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy()
    }
    this.contents = []

    const topOffset = isMobile ? MOBILE_UI_TOP_OFFSET + BOX_PADDING : BOX_PADDING

    const title = scene.add.text(BOX_PADDING, topOffset, 'You did it!', {
      fontFamily: '"Press Start 2P"',
      fontSize: isMobile ? '14px' : '10px',
      color: '#86efac',
    })
    title.setScrollFactor(0)
    this.contents.push(title)

    const separator = scene.add.graphics()
    const separatorY = topOffset + title.height + 6
    separator.lineStyle(1, BORDER_COLOR, 0.5)
    separator.lineBetween(BOX_PADDING, separatorY, screenWidth - BOX_PADDING, separatorY)
    separator.setScrollFactor(0)
    this.contents.push(separator)

    const bodyText = scene.add.text(BOX_PADDING, separatorY + LINE_SPACING, message, {
      fontFamily: '"Press Start 2P"',
      fontSize: isMobile ? '9px' : '7px',
      color: '#e2e8f0',
      wordWrap: { width: screenWidth - BOX_PADDING * 2 },
      lineSpacing: 8,
    })
    bodyText.setScrollFactor(0)
    this.contents.push(bodyText)

    const hint = window.innerWidth < 768 ? 'Tap to close' : "Press 'Enter' to close"
    const hintText = scene.add.text(BOX_PADDING, separatorY + LINE_SPACING + bodyText.height + LINE_SPACING, hint, {
      fontFamily: '"Press Start 2P"',
      fontSize: isMobile ? '8px' : '6px',
      color: '#64748b',
    })
    hintText.setScrollFactor(0)
    this.contents.push(hintText)

    this.container.add(this.contents)
    this.container.setVisible(true)

    for (const key of this.dismissKeys) {
      key.removeAllListeners()
      key.once('down', this._dismiss, this)
    }
    this.scene.input.on('pointerdown', this._dismiss, this)
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.container]
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
