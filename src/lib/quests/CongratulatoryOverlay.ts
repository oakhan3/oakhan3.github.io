import {
  isMobile,
  MOBILE_UI_TOP_OFFSET,
  UI_FONT_FAMILY,
  UI_HINT_COLOR,
  UI_SUCCESS_COLOR,
  UI_TEXT_COLOR,
} from '../../config'
import { BaseOverlay } from './BaseOverlay'
import {
  BOX_PADDING,
  LINE_SPACING,
  OVERLAY_BODY_FONT_DESKTOP,
  OVERLAY_BODY_FONT_MOBILE,
  OVERLAY_BODY_LINE_SPACING,
  OVERLAY_HINT_FONT_DESKTOP,
  OVERLAY_HINT_FONT_MOBILE,
  OVERLAY_TITLE_FONT_DESKTOP,
  OVERLAY_TITLE_FONT_MOBILE,
} from './constants'

export class CongratulatoryOverlay extends BaseOverlay {
  show(message: string, onDismiss?: () => void): void {
    super._show(onDismiss)

    const scene = this.scene
    const mobile = isMobile()
    const topOffset = mobile ? MOBILE_UI_TOP_OFFSET + BOX_PADDING : BOX_PADDING

    const title = this._addText(scene, BOX_PADDING, topOffset, 'You did it!', {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? OVERLAY_TITLE_FONT_MOBILE : OVERLAY_TITLE_FONT_DESKTOP,
      color: UI_SUCCESS_COLOR,
    })

    const separatorY = this._addSeparator(scene, topOffset, title)

    const bodyText = this._addText(scene, BOX_PADDING, separatorY + LINE_SPACING, message, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? OVERLAY_BODY_FONT_MOBILE : OVERLAY_BODY_FONT_DESKTOP,
      color: UI_TEXT_COLOR,
      wordWrap: { width: scene.scale.width - BOX_PADDING * 2 },
      lineSpacing: OVERLAY_BODY_LINE_SPACING,
    })

    this._addText(scene, BOX_PADDING, separatorY + LINE_SPACING + bodyText.height + LINE_SPACING, this.dismissHint, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? OVERLAY_HINT_FONT_MOBILE : OVERLAY_HINT_FONT_DESKTOP,
      color: UI_HINT_COLOR,
    })

    this.container.add(this.contents)
  }
}
