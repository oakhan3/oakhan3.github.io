import Phaser from 'phaser'
import {
  DEPTH_QUEST_UI,
  isMobile,
  MOBILE_UI_TOP_OFFSET_PX,
  QUEST_BTN_BACKGROUND_COLOR,
  QUEST_BTN_BORDER_COLOR,
  QUEST_BTN_HIT_PADDING_X_PX,
  QUEST_BTN_HIT_PADDING_Y_PX,
  QUEST_BTN_MARGIN_PX,
  UI_CHROME_ALPHA,
  UI_FONT_FAMILY,
  UI_TEXT_COLOR,
} from '../../config'
import type { QuestOverlay } from './QuestOverlay'
import type { QuestSystem } from './QuestSystem'

const BTN_FONT_MOBILE = '8px'
const BTN_FONT_DESKTOP = '6px'
const BTN_HEIGHT_MOBILE_PX = 22
const BTN_HEIGHT_DESKTOP_PX = 18
const BTN_WIDTH_MOBILE_PX = 72
const BTN_WIDTH_DESKTOP_PX = 60
const BTN_INNER_PADDING_PX = 6

export class QuestButton {
  private container: Phaser.GameObjects.Container
  private zone: Phaser.GameObjects.Zone

  constructor(scene: Phaser.Scene, questOverlay: QuestOverlay, questSystem: QuestSystem) {
    const mobile = isMobile()
    const btnHeight = mobile ? BTN_HEIGHT_MOBILE_PX : BTN_HEIGHT_DESKTOP_PX
    const btnWidth = mobile ? BTN_WIDTH_MOBILE_PX : BTN_WIDTH_DESKTOP_PX
    const btnX = scene.scale.width - QUEST_BTN_MARGIN_PX
    const btnY = mobile ? MOBILE_UI_TOP_OFFSET_PX : QUEST_BTN_MARGIN_PX

    const background = scene.add.graphics()
    background.fillStyle(QUEST_BTN_BACKGROUND_COLOR, UI_CHROME_ALPHA)
    background.fillRoundedRect(0, 0, btnWidth, btnHeight, 3)
    background.lineStyle(2, QUEST_BTN_BORDER_COLOR, 1)
    background.strokeRoundedRect(0, 0, btnWidth, btnHeight, 3)

    // NOTE: setPadding enlarges the text canvas so the hit area extends well
    // beyond the visible text — same technique used for the dialog link button.
    // The label position is offset by the padding amount so the text stays
    // visually centered within the button background.
    const hitPadding = mobile ? { x: QUEST_BTN_HIT_PADDING_X_PX, y: QUEST_BTN_HIT_PADDING_Y_PX } : { x: 0, y: 0 }
    const label = scene.add.text(BTN_INNER_PADDING_PX - hitPadding.x, BTN_INNER_PADDING_PX - hitPadding.y, 'Quests', {
      fontFamily: UI_FONT_FAMILY,
      fontSize: mobile ? BTN_FONT_MOBILE : BTN_FONT_DESKTOP,
      color: UI_TEXT_COLOR,
    })
    if (mobile) label.setPadding(hitPadding.x, hitPadding.y, hitPadding.x, hitPadding.y)
    label.setInteractive({ useHandCursor: true })
    label.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        // NOTE: Stop propagation so the scene-level 'pointerdown' dismiss listener on
        // QuestOverlay does not fire for this same click and immediately hide the overlay.
        event.stopPropagation()
        if (questOverlay.isOpen) {
          questOverlay.dismiss()
        } else {
          questOverlay.show(questSystem.getAll())
        }
      },
    )

    this.container = scene.add.container(btnX - btnWidth, btnY, [background, label])
    this.container.setScrollFactor(0)
    this.container.setDepth(DEPTH_QUEST_UI)

    this.zone = scene.add.zone(btnX - btnWidth, btnY, btnWidth, btnHeight).setOrigin(0, 0)
    this.zone.setScrollFactor(0)
    this.zone.setDepth(DEPTH_QUEST_UI)
    this.zone.setInteractive({ useHandCursor: true })
    this.zone.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation()
        if (questOverlay.isOpen) {
          questOverlay.dismiss()
        } else {
          questOverlay.show(questSystem.getAll())
        }
      },
    )
  }

  getGameObjects(): Phaser.GameObjects.GameObject[] {
    return [this.container, this.zone]
  }
}
