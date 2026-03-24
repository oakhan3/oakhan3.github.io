import Phaser from 'phaser'
import { DEPTH_DIALOG } from '../../config'

const BOX_MARGIN = 8
const BOX_PADDING = 10
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
    const isMobile = window.innerWidth < 768
    const fontSize = isMobile ? '9px' : '8px'
    const boxHeight = isMobile ? 66 : 66

    const background = scene.add.graphics()
    background.fillStyle(BACKGROUND_COLOR, BACKGROUND_ALPHA)
    background.fillRoundedRect(0, 0, boxWidth, boxHeight, 4)
    background.lineStyle(2, BORDER_COLOR, 1)
    background.strokeRoundedRect(0, 0, boxWidth, boxHeight, 4)

    this.textObject = scene.add.text(BOX_PADDING, BOX_PADDING, '', {
      fontFamily: '"Press Start 2P"',
      fontSize,
      color: '#e2e8f0',
      wordWrap: { width: boxWidth - BOX_PADDING * 2 },
      lineSpacing: 6,
    })

    // NOTE: Small downward triangle at bottom-right of the box, classic GBA "press to continue" cue.
    this.indicator = scene.add.graphics()
    this.indicator.fillStyle(BORDER_COLOR, 1)
    this.indicator.fillTriangle(0, 0, INDICATOR_SIZE * 2, 0, INDICATOR_SIZE, INDICATOR_SIZE)
    this.indicator.setPosition(
      boxWidth - BOX_PADDING - INDICATOR_SIZE * 2,
      boxHeight - BOX_PADDING - INDICATOR_SIZE * 2,
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
      screenWidth - BOX_MARGIN - BOX_PADDING - INDICATOR_SIZE * 4,
      boxY + boxHeight - BOX_PADDING - 11,
      '[ open link ]',
      {
        fontFamily: '"Press Start 2P"',
        fontSize,
        color: '#60a5fa',
      },
    )
    this.linkButton.setOrigin(1, 0)
    this.linkButton.setScrollFactor(0)
    this.linkButton.setDepth(DEPTH_DIALOG + 1)
    this.linkButton.setVisible(false)
    this.linkButton.setInteractive({ useHandCursor: true })
    this.linkButton.on('pointerdown', () => {
      if (this.currentUrl) window.open(this.currentUrl, '_blank')
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
