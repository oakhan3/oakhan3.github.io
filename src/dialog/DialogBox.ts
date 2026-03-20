import Phaser from 'phaser'
import { GBA_WIDTH, GBA_HEIGHT } from '../config'

const BOX_MARGIN = 8
const BOX_PADDING = 10
const BOX_HEIGHT = 56
const BOX_Y = GBA_HEIGHT - BOX_HEIGHT - BOX_MARGIN
const BOX_WIDTH = GBA_WIDTH - BOX_MARGIN * 2
const TYPEWRITER_DELAY = 35
const BORDER_COLOR = 0xe2e8f0
const BACKGROUND_COLOR = 0x1a1b2e
const BACKGROUND_ALPHA = 0.92

export class DialogBox {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private textObject: Phaser.GameObjects.Text
  private fullText = ''
  private displayedLength = 0
  private typewriterTimer: Phaser.Time.TimerEvent | null = null
  private onClose: (() => void) | null = null
  private advanceKeys: Phaser.Input.Keyboard.Key[]

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

    this.container = scene.add.container(BOX_MARGIN, BOX_Y, [background, this.textObject])
    this.container.setScrollFactor(0)
    this.container.setDepth(100)
    this.container.setVisible(false)

    this.advanceKeys = [scene.input.keyboard!.addKey('SPACE'), scene.input.keyboard!.addKey('ENTER')]
  }

  show(text: string, onClose?: () => void): void {
    this.fullText = text
    this.displayedLength = 0
    this.onClose = onClose ?? null
    this.textObject.setText('')
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
  }

  private handleAdvance(): void {
    if (this.displayedLength < this.fullText.length) {
      this.rushText()
    } else {
      this.close()
    }
  }

  private advanceCharacter(): void {
    this.displayedLength++
    this.textObject.setText(this.fullText.slice(0, this.displayedLength))
  }

  private rushText(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy()
      this.typewriterTimer = null
    }
    this.displayedLength = this.fullText.length
    this.textObject.setText(this.fullText)
  }

  private close(): void {
    this.container.setVisible(false)
    for (const key of this.advanceKeys) {
      key.removeAllListeners()
    }
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy()
      this.typewriterTimer = null
    }
    if (this.onClose) {
      this.onClose()
    }
  }
}
