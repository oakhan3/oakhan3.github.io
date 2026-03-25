import { MOBILE_UI_TOP_OFFSET, UI_FONT_FAMILY } from '../../config'
import type { Quest } from './QuestSystem'
import { BaseOverlay } from './BaseOverlay'
import { BOX_PADDING, LINE_SPACING } from './constants'

export class QuestOverlay extends BaseOverlay {
  show(quests: Array<Quest & { completed: boolean }>): void {
    super._show()

    const scene = this.scene
    const screenWidth = scene.scale.width
    const isMobile = window.innerWidth < 768
    const fontSize = isMobile ? '10px' : '8px'
    const lineHeight = isMobile ? 20 : 16
    const topOffset = isMobile ? MOBILE_UI_TOP_OFFSET + BOX_PADDING : BOX_PADDING

    const title = scene.add.text(BOX_PADDING, topOffset, 'Quests', {
      fontFamily: UI_FONT_FAMILY,
      fontSize: isMobile ? '14px' : '10px',
      color: '#e2e8f0',
    })
    title.setScrollFactor(0)
    this.contents.push(title)

    // NOTE: Separator line beneath the title.
    const separator = scene.add.graphics()
    const separatorY = topOffset + title.height + 6
    separator.lineStyle(1, this.borderColor, 0.5)
    separator.lineBetween(BOX_PADDING, separatorY, screenWidth - BOX_PADDING, separatorY)
    separator.setScrollFactor(0)
    this.contents.push(separator)

    let currentY = separatorY + LINE_SPACING

    for (const quest of quests) {
      const check = quest.completed ? '[x]' : '[ ]'
      const color = quest.completed ? '#86efac' : '#94a3b8'
      const questText = scene.add.text(BOX_PADDING, currentY, `${check} ${quest.label}`, {
        fontFamily: UI_FONT_FAMILY,
        fontSize,
        color,
        lineSpacing: 6,
      })
      questText.setScrollFactor(0)
      this.contents.push(questText)
      currentY += lineHeight + LINE_SPACING
    }

    const hintText = scene.add.text(BOX_PADDING, currentY + LINE_SPACING, this.dismissHint, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: isMobile ? '8px' : '6px',
      color: '#64748b',
    })
    hintText.setScrollFactor(0)
    this.contents.push(hintText)

    this.container.add(this.contents)
  }
}
