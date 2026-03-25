import Phaser from 'phaser'
import {
  DEPTH_DIALOG,
  isMobile,
  UI_CHROME_ALPHA,
  UI_CHROME_PADDING,
  UI_FONT_FAMILY,
  UI_LINK_COLOR,
  UI_TEXT_COLOR,
  UI_TEXT_LINE_SPACING,
} from '../../config'
import { createRoundedBackground } from '../ui'

const BOX_MARGIN = 8
const DIALOG_FONT_MOBILE = '12px'
const DIALOG_FONT_DESKTOP = '8px'
const DIALOG_HEIGHT_MOBILE = 80
const DIALOG_HEIGHT_DESKTOP = 66
const TYPEWRITER_DELAY = 15
const INDICATOR_SIZE = 5
const INDICATOR_BLINK_DURATION = 400

export class DialogBox {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private textObject: Phaser.GameObjects.Text
  private fullText = ''
  private displayedLength = 0
  private typewriterTimer: Phaser.Time.TimerEvent | null = null
  private onClose: (() => void) | null = null
  private advanceKeys: Phaser.Input.Keyboard.Key[]
  private indicator: Phaser.GameObjects.Graphics
  private indicatorTween: Phaser.Tweens.Tween | null = null
  private linkButton: Phaser.GameObjects.Text
  private currentUrl: string | null = null
  private _displayLink: string | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    // NOTE: Computed from actual canvas size so the dialog sits 20% from the
    // bottom on any screen, including expanded mobile viewports.
    const screenWidth = scene.scale.width
    const screenHeight = scene.scale.height
    const boxWidth = screenWidth - BOX_MARGIN * 2
    const boxY = screenHeight * 0.7
    const mobile = isMobile()
    const fontSize = mobile ? DIALOG_FONT_MOBILE : DIALOG_FONT_DESKTOP
    const boxHeight = mobile ? DIALOG_HEIGHT_MOBILE : DIALOG_HEIGHT_DESKTOP

    const background = createRoundedBackground(scene, boxWidth, boxHeight, UI_CHROME_ALPHA)

    this.textObject = scene.add.text(UI_CHROME_PADDING, UI_CHROME_PADDING, '', {
      fontFamily: UI_FONT_FAMILY,
      fontSize,
      color: UI_TEXT_COLOR,
      wordWrap: { width: boxWidth - UI_CHROME_PADDING * 2 },
      lineSpacing: UI_TEXT_LINE_SPACING,
    })

    // NOTE: Small downward triangle at bottom-right of the box, classic GBA "press to continue" cue.
    this.indicator = scene.add.graphics()
    this.indicator.fillStyle(0xe2e8f0, 1)
    this.indicator.fillTriangle(0, 0, INDICATOR_SIZE * 2, 0, INDICATOR_SIZE, INDICATOR_SIZE)
    this.indicator.setPosition(
      boxWidth - UI_CHROME_PADDING - INDICATOR_SIZE * 2,
      boxHeight - UI_CHROME_PADDING - INDICATOR_SIZE * 2,
    )
    this.indicator.setVisible(false)

    this.container = scene.add.container(BOX_MARGIN, boxY, [background, this.textObject, this.indicator])
    // NOTE: scrollFactor(0) pins the dialog to the screen, not the world — it stays
    // at the bottom of the viewport regardless of camera position.
    this.container.setScrollFactor(0)
    this.container.setDepth(DEPTH_DIALOG)
    this.container.setVisible(false)

    // NOTE: Link button sits outside the container so its interactive hit area is
    // computed in screen space, matching its scrollFactor(0) visual position.
    this.linkButton = scene.add.text(
      screenWidth - BOX_MARGIN - UI_CHROME_PADDING - INDICATOR_SIZE * 4,
      boxY + boxHeight - UI_CHROME_PADDING - 27,
      '[ open link ]',
      {
        fontFamily: UI_FONT_FAMILY,
        fontSize,
        color: UI_LINK_COLOR,
      },
    )
    this.linkButton.setOrigin(1, 0)
    this.linkButton.setScrollFactor(0)
    this.linkButton.setDepth(DEPTH_DIALOG + 1)
    this.linkButton.setVisible(false)
    this.linkButton.setInteractive({ useHandCursor: true })
    this.linkButton.on('pointerdown', () => {
      if (this.currentUrl) _openUrl(this.currentUrl)
    })

    this.advanceKeys = [scene.input.keyboard!.addKey('SPACE'), scene.input.keyboard!.addKey('ENTER')]
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.container, this.linkButton]
  }

  isOpen(): boolean {
    return this.container.visible
  }

  show(text: string, url?: string, displayLink?: string, onClose?: () => void): void {
    this.currentUrl = url ?? null
    this.fullText = text
    this._displayLink = displayLink ?? null

    this.displayedLength = 0
    this.onClose = onClose ?? null
    this.textObject.setText('')
    this.hideIndicator()
    this.container.setVisible(true)

    this.typewriterTimer = this.scene.time.addEvent({
      delay: TYPEWRITER_DELAY,
      callback: this.advanceCharacter,
      callbackScope: this,
      repeat: this.fullText.length - 1,
    })

    for (const key of this.advanceKeys) {
      key.removeAllListeners()
      key.on('down', this.handleAdvance, this)
    }

    // NOTE: Listen for pointerdown directly so dialog works on touch devices without
    // depending on the touch controls' tap detection.
    this.scene.input.on('pointerdown', this.handleAdvance, this)
  }

  private handleAdvance(): void {
    if (!this.container.visible) return
    if (this.displayedLength < this.fullText.length) {
      this.rushText()
    } else {
      this.close()
    }
  }

  private advanceCharacter(): void {
    this.displayedLength++
    this.textObject.setText(this.fullText.slice(0, this.displayedLength))
    if (this.displayedLength >= this.fullText.length) {
      this.showIndicator()
    }
  }

  private rushText(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy()
      this.typewriterTimer = null
    }
    this.displayedLength = this.fullText.length
    this.textObject.setText(this.fullText)
    this.showIndicator()
  }

  private showIndicator(): void {
    this.indicator.setVisible(true)
    this.indicatorTween = this.scene.tweens.add({
      targets: this.indicator,
      alpha: { from: 1, to: 0 },
      duration: INDICATOR_BLINK_DURATION,
      yoyo: true,
      repeat: -1,
    })
    // NOTE: Only show the link button once typing is done so the player can read
    // the message before the link becomes clickable.
    if (this.currentUrl) {
      this.linkButton.setText(`[ ${this._displayLink ?? 'open link'} ]`)
      this.linkButton.setVisible(true)
      // NOTE: setPadding physically enlarges the text canvas so the default
      // hit area covers the padding too — more reliable than a custom Rectangle.
      this.linkButton.setPadding(24, 16, 24, 16)
      this.linkButton.setInteractive({ useHandCursor: true })
    }
  }

  private hideIndicator(): void {
    if (this.indicatorTween) {
      this.indicatorTween.destroy()
      this.indicatorTween = null
    }
    this.indicator.setVisible(false)
    this.indicator.setAlpha(1)
    this.linkButton.setVisible(false)
  }

  private close(): void {
    this.hideIndicator()
    this.container.setVisible(false)
    for (const key of this.advanceKeys) {
      key.removeAllListeners()
    }
    this.scene.input.off('pointerdown', this.handleAdvance, this)
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy()
      this.typewriterTimer = null
    }
    this.currentUrl = null
    this._displayLink = null
    if (this.onClose) {
      this.onClose()
    }
  }
}

// NOTE: Safari blocks window.open() unless called directly from a native DOM
// gesture. Creating and clicking an <a> element preserves the gesture context.
function _openUrl(url: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.click()
}
