import { MOBILE_UI_TOP_OFFSET, UI_FONT_FAMILY } from '../../config'
import { BaseOverlay } from './BaseOverlay'
import { BOX_PADDING, LINE_SPACING } from './constants'

export class CongratulatoryOverlay extends BaseOverlay {
  show(message: string, onDismiss?: () => void): void {
    super._show(onDismiss)

    const scene = this.scene
    const screenWidth = scene.scale.width
    const isMobile = window.innerWidth < 768
    const topOffset = isMobile ? MOBILE_UI_TOP_OFFSET + BOX_PADDING : BOX_PADDING

    const title = scene.add.text(BOX_PADDING, topOffset, 'You did it!', {
      fontFamily: UI_FONT_FAMILY,
      fontSize: isMobile ? '14px' : '10px',
      color: '#86efac',
    })
    title.setScrollFactor(0)
    this.contents.push(title)

    const separator = scene.add.graphics()
    const separatorY = topOffset + title.height + 6
    separator.lineStyle(1, this.borderColor, 0.5)
    separator.lineBetween(BOX_PADDING, separatorY, screenWidth - BOX_PADDING, separatorY)
    separator.setScrollFactor(0)
    this.contents.push(separator)

    const bodyText = scene.add.text(BOX_PADDING, separatorY + LINE_SPACING, message, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: isMobile ? '9px' : '7px',
      color: '#e2e8f0',
      wordWrap: { width: screenWidth - BOX_PADDING * 2 },
      lineSpacing: 8,
    })
    bodyText.setScrollFactor(0)
    this.contents.push(bodyText)

    const hintText = scene.add.text(
      BOX_PADDING,
      separatorY + LINE_SPACING + bodyText.height + LINE_SPACING,
      this.dismissHint,
      {
        fontFamily: UI_FONT_FAMILY,
        fontSize: isMobile ? '8px' : '6px',
        color: '#64748b',
      },
    )
    hintText.setScrollFactor(0)
    this.contents.push(hintText)

    this.container.add(this.contents)
  }
}
