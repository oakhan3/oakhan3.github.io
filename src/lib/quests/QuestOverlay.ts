import Phaser from 'phaser'
import { DEPTH_QUEST_UI, MOBILE_UI_TOP_OFFSET } from '../../config'
import type { Quest } from './QuestSystem'

const BACKGROUND_COLOR = 0x1a1b2e
const BACKGROUND_ALPHA = 0.75
const BORDER_COLOR = 0xe2e8f0
const BOX_PADDING = 16
const LINE_SPACING = 10

export class QuestOverlay {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private background: Phaser.GameObjects.Graphics
  private contents: Phaser.GameObjects.GameObject[] = []
  private dismissKeys: Phaser.Input.Keyboard.Key[]

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

  show(quests: Array<Quest & { completed: boolean }>): void {
    const scene = this.scene
    const screenWidth = scene.scale.width
    const isMobile = window.innerWidth < 768
    const fontSize = isMobile ? '10px' : '8px'
    const lineHeight = isMobile ? 20 : 16

    // NOTE: Destroy previous text objects before rebuilding the list.
    for (const object of this.contents) {
      ;(object as Phaser.GameObjects.GameObject & { destroy: () => void }).destroy()
    }
    this.contents = []

    const topOffset = isMobile ? MOBILE_UI_TOP_OFFSET + BOX_PADDING : BOX_PADDING
    const title = scene.add.text(BOX_PADDING, topOffset, 'Quests', {
      fontFamily: '"Press Start 2P"',
      fontSize: isMobile ? '14px' : '10px',
      color: '#e2e8f0',
    })
    title.setScrollFactor(0)
    this.contents.push(title)

    // NOTE: Separator line beneath the title.
    const separator = scene.add.graphics()
    const separatorY = topOffset + title.height + 6
    separator.lineStyle(1, BORDER_COLOR, 0.5)
    separator.lineBetween(BOX_PADDING, separatorY, screenWidth - BOX_PADDING, separatorY)
    separator.setScrollFactor(0)
    this.contents.push(separator)

    let currentY = separatorY + LINE_SPACING

    for (const quest of quests) {
      const check = quest.completed ? '[x]' : '[ ]'
      const color = quest.completed ? '#86efac' : '#94a3b8'
      const questText = scene.add.text(BOX_PADDING, currentY, `${check} ${quest.label}`, {
        fontFamily: '"Press Start 2P"',
        fontSize,
        color,
        lineSpacing: 6,
      })
      questText.setScrollFactor(0)
      this.contents.push(questText)
      currentY += lineHeight + LINE_SPACING
    }

    // NOTE: Hint text at the bottom.
    const hint = window.innerWidth < 768 ? 'Tap to close' : "Press 'Enter' to close"
    const hintText = scene.add.text(BOX_PADDING, currentY + LINE_SPACING, hint, {
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
    // NOTE: Use a bound method (not an arrow function) so off() can find and remove the same reference.
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
  }
}
