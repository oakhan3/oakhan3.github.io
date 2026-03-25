import {
  isMobile,
  MOBILE_UI_TOP_OFFSET,
  UI_FONT_FAMILY,
  UI_HINT_COLOR,
  UI_MUTED_COLOR,
  UI_SUCCESS_COLOR,
  UI_TEXT_COLOR,
} from '../../config'
import type { Quest } from './QuestSystem'
import { BaseOverlay } from './BaseOverlay'
import {
  BOX_PADDING,
  LINE_SPACING,
  OVERLAY_HINT_FONT_DESKTOP,
  OVERLAY_HINT_FONT_MOBILE,
  OVERLAY_ITEM_FONT_DESKTOP,
  OVERLAY_ITEM_FONT_MOBILE,
  OVERLAY_TITLE_FONT_DESKTOP,
  OVERLAY_TITLE_FONT_MOBILE,
} from './constants'

export class QuestOverlay extends BaseOverlay {
  show(quests: Array<Quest & { completed: boolean }>): void {
    super._show()

    const scene = this.scene
    const mobile = isMobile()
    const lineHeight = mobile ? 20 : 16
    const topOffset = mobile ? MOBILE_UI_TOP_OFFSET + BOX_PADDING : BOX_PADDING

    const title = this._addText(scene, BOX_PADDING, topOffset, 'Quests', {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? OVERLAY_TITLE_FONT_MOBILE : OVERLAY_TITLE_FONT_DESKTOP,
      color: UI_TEXT_COLOR,
    })

    // NOTE: Separator line beneath the title.
    const separatorY = this._addSeparator(scene, topOffset, title)

    let currentY = separatorY + LINE_SPACING

    for (const quest of quests) {
      const check = quest.completed ? '[x]' : '[ ]'
      const color = quest.completed ? UI_SUCCESS_COLOR : UI_MUTED_COLOR
      this._addText(scene, BOX_PADDING, currentY, `${check} ${quest.label}`, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: mobile ? OVERLAY_ITEM_FONT_MOBILE : OVERLAY_ITEM_FONT_DESKTOP,
        color,
        lineSpacing: 6,
      })
      currentY += lineHeight + LINE_SPACING
    }

    this._addText(scene, BOX_PADDING, currentY + LINE_SPACING, this.dismissHint, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? OVERLAY_HINT_FONT_MOBILE : OVERLAY_HINT_FONT_DESKTOP,
      color: UI_HINT_COLOR,
    })

    this.container.add(this.contents)
  }
}
