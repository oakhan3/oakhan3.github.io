import Phaser from 'phaser'
import { TEST_MODE } from '../../test-mode'
import {
  DEPTH_QUEST_UI,
  isMobile,
  MOBILE_UI_TOP_OFFSET,
  UI_CHROME_ALPHA,
  UI_CHROME_PADDING,
  UI_FONT_FAMILY,
  UI_TEXT_COLOR,
  UI_TEXT_LINE_SPACING,
} from '../../config'
import { createRoundedBackground } from '../ui'

// NOTE: Banner is narrower than the full screen so it doesn't cover the quest icon in the top-right.
const BANNER_MAX_WIDTH = 300
const BANNER_MARGIN_TOP = 8
const BANNER_FONT_MOBILE = '10px'
const BANNER_FONT_DESKTOP = '8px'
const BANNER_HEIGHT_MOBILE = 45
const BANNER_HEIGHT_DESKTOP = 38
const HOLD_DURATION = 2000
const SLIDE_DURATION = 300

export class CompletionBanner {
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private label: Phaser.GameObjects.Text
  private activeTween: Phaser.Tweens.TweenChain | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    const mobile = isMobile()
    const fontSize = mobile ? BANNER_FONT_MOBILE : BANNER_FONT_DESKTOP
    const boxHeight = mobile ? BANNER_HEIGHT_MOBILE : BANNER_HEIGHT_DESKTOP
    // NOTE: Centered narrow banner — leaves the top-right corner free for the quest icon.
    const boxWidth = Math.min(BANNER_MAX_WIDTH, scene.scale.width - UI_CHROME_PADDING * 4)
    const boxX = Math.floor((scene.scale.width - boxWidth) / 2)

    const background = createRoundedBackground(scene, boxWidth, boxHeight, UI_CHROME_ALPHA)

    this.label = scene.add.text(UI_CHROME_PADDING, UI_CHROME_PADDING, '', {
      fontFamily: UI_FONT_FAMILY,
      fontSize,
      color: UI_TEXT_COLOR,
      wordWrap: { width: boxWidth - UI_CHROME_PADDING * 2 },
      lineSpacing: UI_TEXT_LINE_SPACING,
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

    if (TEST_MODE) {
      this.container.setY(isMobile() ? MOBILE_UI_TOP_OFFSET : BANNER_MARGIN_TOP)
      return
    }

    // NOTE: Slide down to BANNER_MARGIN_TOP, hold, then fade out.
    this.activeTween = this.scene.tweens.chain({
      targets: this.container,
      tweens: [
        {
          y: isMobile() ? MOBILE_UI_TOP_OFFSET : BANNER_MARGIN_TOP,
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

  hide(): void {
    this.container.setVisible(false)
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.container]
  }
}
