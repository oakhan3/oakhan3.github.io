import {
  isMobile,
  MOBILE_UI_TOP_OFFSET_PX,
  UI_FONT_FAMILY,
  UI_HINT_COLOR,
  UI_MUTED_COLOR,
  UI_SUCCESS_COLOR,
  UI_TEXT_COLOR,
  UI_TEXT_LINE_SPACING_PX,
} from '../../config'
import type { Quest } from './QuestSystem'
import { BaseOverlay } from './BaseOverlay'
import {
  BOX_PADDING_PX,
  LINE_SPACING_PX,
  OVERLAY_HINT_FONT_DESKTOP,
  OVERLAY_HINT_FONT_MOBILE,
  OVERLAY_ITEM_FONT_DESKTOP,
  OVERLAY_ITEM_FONT_MOBILE,
  OVERLAY_TITLE_FONT_DESKTOP,
  OVERLAY_TITLE_FONT_MOBILE,
  QUEST_ROW_HEIGHT_DESKTOP_PX,
  QUEST_ROW_HEIGHT_MOBILE_PX,
} from './constants'

export class QuestOverlay extends BaseOverlay {
  show(quests: Array<Quest & { completed: boolean }>): void {
    super._show()

    const scene = this.scene
    const mobile = isMobile()
    const lineHeight = mobile ? QUEST_ROW_HEIGHT_MOBILE_PX : QUEST_ROW_HEIGHT_DESKTOP_PX
    const topOffset = mobile ? MOBILE_UI_TOP_OFFSET_PX + BOX_PADDING_PX : BOX_PADDING_PX

    const title = this._addText(scene, BOX_PADDING_PX, topOffset, 'Quests', {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? OVERLAY_TITLE_FONT_MOBILE : OVERLAY_TITLE_FONT_DESKTOP,
      color: UI_TEXT_COLOR,
    })

    // NOTE: Separator line beneath the title.
    const separatorY = this._addSeparator(scene, topOffset, title)

    const signHint = mobile ? 'tapping' : "hitting 'Enter'"
    const instruction = this._addText(
      scene,
      BOX_PADDING_PX,
      separatorY + LINE_SPACING_PX,
      `Walk up signs/points of interest on the map\n\nand try ${signHint} near them!`,
      {
        fontFamily: UI_FONT_FAMILY,
        fontSize: mobile ? OVERLAY_ITEM_FONT_MOBILE : OVERLAY_ITEM_FONT_DESKTOP,
        color: UI_HINT_COLOR,
      },
    )

    let currentY = instruction.y + instruction.height + LINE_SPACING_PX * 2

    for (const quest of quests) {
      const check = quest.completed ? '[x]' : '[ ]'
      const color = quest.completed ? UI_SUCCESS_COLOR : UI_MUTED_COLOR
      this._addText(scene, BOX_PADDING_PX, currentY, `${check} ${quest.label}`, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: mobile ? OVERLAY_ITEM_FONT_MOBILE : OVERLAY_ITEM_FONT_DESKTOP,
        color,
        lineSpacing: UI_TEXT_LINE_SPACING_PX,
      })
      currentY += lineHeight + LINE_SPACING_PX
    }

    this._addText(scene, BOX_PADDING_PX, currentY + LINE_SPACING_PX, this.dismissHint, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? OVERLAY_HINT_FONT_MOBILE : OVERLAY_HINT_FONT_DESKTOP,
      color: UI_HINT_COLOR,
    })

    this.container.add(this.contents)
  }
}
