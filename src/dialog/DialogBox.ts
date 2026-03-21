import Phaser from 'phaser'
import { GBA_WIDTH, GBA_HEIGHT, DEPTH_DIALOG } from '../config'

const BOX_MARGIN = 8
const BOX_PADDING = 10
const BOX_HEIGHT = 56
const BOX_Y = GBA_HEIGHT - BOX_HEIGHT - BOX_MARGIN
const BOX_WIDTH = GBA_WIDTH - BOX_MARGIN * 2
const TYPEWRITER_DELAY = 35
const BORDER_COLOR = 0xe2e8f0
const BACKGROUND_COLOR = 0x1a1b2e
const BACKGROUND_ALPHA = 0.92
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    const background = scene.add.graphics()
    background.fillStyle(BACKGROUND_COLOR, BACKGROUND_ALPHA)
    background.fillRoundedRect(0, 0, BOX_WIDTH, BOX_HEIGHT, 4)
    background.lineStyle(2, BORDER_COLOR, 1)
    background.strokeRoundedRect(0, 0, BOX_WIDTH, BOX_HEIGHT, 4)

    this.textObject = scene.add.text(BOX_PADDING, BOX_PADDING, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: '#e2e8f0',
      wordWrap: { width: BOX_WIDTH - BOX_PADDING * 2 },
      lineSpacing: 6,
    })

    // NOTE: Small downward triangle at bottom-right of the box, classic GBA "press to continue" cue.
    this.indicator = scene.add.graphics()
    this.indicator.fillStyle(BORDER_COLOR, 1)
    this.indicator.fillTriangle(0, 0, INDICATOR_SIZE * 2, 0, INDICATOR_SIZE, INDICATOR_SIZE)
    this.indicator.setPosition(BOX_WIDTH - BOX_PADDING - INDICATOR_SIZE * 2, BOX_HEIGHT - BOX_PADDING - INDICATOR_SIZE)
    this.indicator.setVisible(false)

    this.container = scene.add.container(BOX_MARGIN, BOX_Y, [background, this.textObject, this.indicator])
    // NOTE: scrollFactor(0) pins the dialog to the screen, not the world — it stays
    // at the bottom of the viewport regardless of camera position.
    this.container.setScrollFactor(0)
    this.container.setDepth(DEPTH_DIALOG)
    this.container.setVisible(false)

    this.advanceKeys = [scene.input.keyboard!.addKey('SPACE'), scene.input.keyboard!.addKey('ENTER')]
  }

  show(text: string, onClose?: () => void): void {
    this.fullText = text
    this.displayedLength = 0
    this.onClose = onClose ?? null
    this.textObject.setText('')
    this.hideIndicator()
    this.container.setVisible(true)

    this.typewriterTimer = this.scene.time.addEvent({
      delay: TYPEWRITER_DELAY,
      callback: this.advanceCharacter,
      callbackScope: this,
      repeat: text.length - 1,
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
  }

  private hideIndicator(): void {
    if (this.indicatorTween) {
      this.indicatorTween.destroy()
      this.indicatorTween = null
    }
    this.indicator.setVisible(false)
    this.indicator.setAlpha(1)
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
    if (this.onClose) {
      this.onClose()
    }
  }
}
