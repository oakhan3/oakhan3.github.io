import Phaser from 'phaser'
import { DEPTH_QUEST_UI, MOBILE_UI_TOP_OFFSET } from '../../config'

const BOX_PADDING = 10
// NOTE: Banner is narrower than the full screen so it doesn't cover the quest icon in the top-right.
const BANNER_MAX_WIDTH = 300
const BANNER_MARGIN_TOP = 8
const BORDER_COLOR = 0xe2e8f0
const BACKGROUND_COLOR = 0x1a1b2e
const BACKGROUND_ALPHA = 0.92
const HOLD_DURATION = 2000
const SLIDE_DURATION = 300

export class CompletionBanner {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private label: Phaser.GameObjects.Text
  private activeTween: Phaser.Tweens.TweenChain | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    const isMobile = window.innerWidth < 768
    const fontSize = isMobile ? '10px' : '8px'
    const boxHeight = isMobile ? 45 : 38
    // NOTE: Centered narrow banner — leaves the top-right corner free for the quest icon.
    const boxWidth = Math.min(BANNER_MAX_WIDTH, scene.scale.width - BOX_PADDING * 4)
    const boxX = Math.floor((scene.scale.width - boxWidth) / 2)

    const background = scene.add.graphics()
    background.fillStyle(BACKGROUND_COLOR, BACKGROUND_ALPHA)
    background.fillRoundedRect(0, 0, boxWidth, boxHeight, 4)
    background.lineStyle(2, BORDER_COLOR, 1)
    background.strokeRoundedRect(0, 0, boxWidth, boxHeight, 4)

    this.label = scene.add.text(BOX_PADDING, BOX_PADDING, '', {
      fontFamily: '"Press Start 2P"',
      fontSize,
      color: '#e2e8f0',
      wordWrap: { width: boxWidth - BOX_PADDING * 2 },
      lineSpacing: 6,
    })

    this.container = scene.add.container(boxX, -boxHeight, [background, this.label])
    this.container.setScrollFactor(0)
    this.container.setDepth(DEPTH_QUEST_UI)
    this.container.setVisible(false)
  }

  show(questLabel: string): void {
    // NOTE: If a previous banner is still animating, stop it so this one takes over immediately.
    if (this.activeTween) {
      this.activeTween.destroy()
      this.activeTween = null
    }

    const boxHeight = this.container.getBounds().height
    this.label.setText(`Quest complete!\n${questLabel}`)
    this.container.setY(-boxHeight)
    this.container.setAlpha(1)
    this.container.setVisible(true)

    // NOTE: Slide down to BANNER_MARGIN_TOP, hold, then fade out.
    this.activeTween = this.scene.tweens.chain({
      targets: this.container,
      tweens: [
        {
          y: window.innerWidth < 768 ? MOBILE_UI_TOP_OFFSET : BANNER_MARGIN_TOP,
          duration: SLIDE_DURATION,
          ease: 'Power2',
        },
        { alpha: 0, duration: SLIDE_DURATION, delay: HOLD_DURATION },
      ],
      onComplete: () => {
        this.container.setVisible(false)
        this.activeTween = null
      },
    })
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.container]
  }
}
