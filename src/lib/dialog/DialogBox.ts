import Phaser from 'phaser'
import {
  DEPTH_DIALOG,
  DIALOG_LINK_BTN_ROW_HEIGHT_DESKTOP_PX,
  DIALOG_LINK_BTN_ROW_HEIGHT_MOBILE_PX,
  isMobile,
  UI_BORDER_COLOR,
  UI_CHROME_ALPHA,
  UI_CHROME_PADDING_PX,
  UI_FONT_FAMILY,
  UI_LINK_COLOR,
  UI_TEXT_COLOR,
  UI_TEXT_LINE_SPACING_PX,
} from '../../config'
import { createRoundedBackground } from '../ui'

const BOX_MARGIN_PX = 8
const DIALOG_FONT_MOBILE = '12px'
const DIALOG_FONT_DESKTOP = '8px'
const DIALOG_HEIGHT_MOBILE_PX = 80
const DIALOG_HEIGHT_DESKTOP_PX = 66
const TYPEWRITER_DELAY_MS = 15
const INDICATOR_SIZE_PX = 5
const INDICATOR_BLINK_DURATION_MS = 400
// NOTE: Approximate game-pixel width of the "[ open link ]" label including padding.
const LINK_BTN_GAME_WIDTH_PX = 150
// NOTE: Minimum tap target height in CSS pixels for the DOM link anchor (accessibility standard).
const LINK_BTN_MIN_DOM_HEIGHT_PX = 44
// NOTE: CSS pixels to extend the tap target above the text's top edge, so the hit area is
// roughly centered on the label rather than flush with its top.
const LINK_BTN_TAP_TOP_OFFSET_MOBILE_PX = 12
const LINK_BTN_TAP_TOP_OFFSET_DESKTOP_PX = 20

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
  private domLinkAnchor: HTMLAnchorElement
  private linkButtonGameX: number
  private linkButtonGameY: number
  private mobile: boolean

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    // NOTE: Computed from actual canvas size so the dialog sits 20% from the
    // bottom on any screen, including expanded mobile viewports.
    const screenWidth = scene.scale.width
    const screenHeight = scene.scale.height
    const boxWidth = screenWidth - BOX_MARGIN_PX * 2
    const boxY = screenHeight * 0.7
    const mobile = isMobile()
    this.mobile = mobile
    const fontSize = mobile ? DIALOG_FONT_MOBILE : DIALOG_FONT_DESKTOP
    const boxHeight = mobile ? DIALOG_HEIGHT_MOBILE_PX : DIALOG_HEIGHT_DESKTOP_PX

    const background = createRoundedBackground(scene, boxWidth, boxHeight, UI_CHROME_ALPHA)

    this.textObject = scene.add.text(UI_CHROME_PADDING_PX, UI_CHROME_PADDING_PX, '', {
      fontFamily: UI_FONT_FAMILY,
      fontSize,
      color: UI_TEXT_COLOR,
      wordWrap: { width: boxWidth - UI_CHROME_PADDING_PX * 2 },
      lineSpacing: UI_TEXT_LINE_SPACING_PX,
    })

    // NOTE: Small downward triangle at bottom-right of the box, classic GBA "press to continue" cue.
    this.indicator = scene.add.graphics()
    this.indicator.fillStyle(UI_BORDER_COLOR, 1)
    this.indicator.fillTriangle(0, 0, INDICATOR_SIZE_PX * 2, 0, INDICATOR_SIZE_PX, INDICATOR_SIZE_PX)
    this.indicator.setPosition(
      boxWidth - UI_CHROME_PADDING_PX - INDICATOR_SIZE_PX * 2,
      boxHeight - UI_CHROME_PADDING_PX - INDICATOR_SIZE_PX * 2,
    )
    this.indicator.setVisible(false)

    this.container = scene.add.container(BOX_MARGIN_PX, boxY, [background, this.textObject, this.indicator])
    // NOTE: scrollFactor(0) pins the dialog to the screen, not the world — it stays
    // at the bottom of the viewport regardless of camera position.
    this.container.setScrollFactor(0)
    this.container.setDepth(DEPTH_DIALOG)
    this.container.setVisible(false)

    this.linkButtonGameX = screenWidth - BOX_MARGIN_PX - UI_CHROME_PADDING_PX - INDICATOR_SIZE_PX * 4
    const linkBtnRowHeight = mobile ? DIALOG_LINK_BTN_ROW_HEIGHT_MOBILE_PX : DIALOG_LINK_BTN_ROW_HEIGHT_DESKTOP_PX
    this.linkButtonGameY = boxY + boxHeight - UI_CHROME_PADDING_PX - linkBtnRowHeight

    // NOTE: Link button sits outside the container so its interactive hit area is
    // computed in screen space, matching its scrollFactor(0) visual position.
    this.linkButton = scene.add.text(this.linkButtonGameX, this.linkButtonGameY, '[ open link ]', {
      fontFamily: UI_FONT_FAMILY,
      fontSize,
      color: UI_LINK_COLOR,
    })
    this.linkButton.setOrigin(1, 0)
    this.linkButton.setScrollFactor(0)
    this.linkButton.setDepth(DEPTH_DIALOG + 1)
    this.linkButton.setVisible(false)

    // NOTE: A real DOM <a> element handles navigation instead of a Phaser pointerdown
    // listener. iOS Safari blocks programmatic window.open() and anchor.click() calls
    // that are not directly triggered by a native DOM gesture — the Phaser input
    // pipeline introduces enough delay to exceed Safari's transient activation window.
    // A transparent <a> overlaid precisely on the Phaser button is treated as a genuine
    // user-initiated navigation on all browsers.
    this.domLinkAnchor = document.createElement('a')
    this.domLinkAnchor.target = '_blank'
    this.domLinkAnchor.rel = 'noopener noreferrer'
    Object.assign(this.domLinkAnchor.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1000',
      opacity: '0',
      cursor: 'pointer',
    })
    document.body.appendChild(this.domLinkAnchor)

    scene.scale.on('resize', this._updateDomLinkPosition, this)
    scene.events.on('shutdown', this._destroyDomLink, this)

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
      delay: TYPEWRITER_DELAY_MS,
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
      duration: INDICATOR_BLINK_DURATION_MS,
      yoyo: true,
      repeat: -1,
    })
    // NOTE: Only show the link button once typing is done so the player can read
    // the message before the link becomes clickable.
    if (this.currentUrl) {
      this.linkButton.setText(`[ ${this._displayLink ?? 'open link'} ]`)
      this.linkButton.setVisible(true)
      this.domLinkAnchor.href = this.currentUrl
      this._updateDomLinkPosition()
      this.domLinkAnchor.style.display = 'block'
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
    this.domLinkAnchor.style.display = 'none'
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
  private _updateDomLinkPosition(): void {
    const canvasBounds = this.scene.scale.canvasBounds
    const scaleX = canvasBounds.width / this.scene.scale.width
    const scaleY = canvasBounds.height / this.scene.scale.height

    // NOTE: linkButtonGameX is the right edge of the button (origin is (1, 0)).
    const domRight = canvasBounds.x + this.linkButtonGameX * scaleX
    const domTop = canvasBounds.y + this.linkButtonGameY * scaleY
    const domWidth = LINK_BTN_GAME_WIDTH_PX * scaleX
    const domHeight = LINK_BTN_MIN_DOM_HEIGHT_PX

    Object.assign(this.domLinkAnchor.style, {
      left: `${domRight - domWidth}px`,
      top: `${domTop - (this.mobile ? LINK_BTN_TAP_TOP_OFFSET_MOBILE_PX : LINK_BTN_TAP_TOP_OFFSET_DESKTOP_PX)}px`,
      width: `${domWidth}px`,
      height: `${domHeight}px`,
    })
  }

  private _destroyDomLink(): void {
    this.domLinkAnchor.remove()
    this.scene.scale.off('resize', this._updateDomLinkPosition, this)
  }
}
