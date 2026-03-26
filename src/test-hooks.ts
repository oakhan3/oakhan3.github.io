import Phaser from 'phaser'
import { flags } from './game-flags'
import { DialogBox } from './lib/dialog/DialogBox'
import { CompletionBanner } from './lib/quests/CompletionBanner'
import { BootScene } from './scenes/BootScene'
import { CONGRATULATORY_MESSAGE } from './scenes/overworld/interaction'
import { MOBILE_UI_TOP_OFFSET_PX } from './config'

// NOTE: Mirrors BANNER_MARGIN_TOP_PX in CompletionBanner.ts.
const BANNER_MARGIN_TOP_PX = 8

export function setupTestHooks(game: Phaser.Game): void {
  flags.disableOverlays = true

  _patchDialogBox()
  _patchCompletionBanner()
  _patchBootScene()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__phaserGame = game

  _pollForOverworld(game)
}

function _patchDialogBox(): void {
  const original = DialogBox.prototype.show
  DialogBox.prototype.show = function (...args) {
    original.apply(this, args)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any).rushText()
  }
}

function _patchCompletionBanner(): void {
  const original = CompletionBanner.prototype.show
  CompletionBanner.prototype.show = function (questLabel: string) {
    original.call(this, questLabel)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this as any
    if (self.activeTween) {
      self.activeTween.destroy()
      self.activeTween = null
    }
    const targetY = window.innerWidth < 768 ? MOBILE_UI_TOP_OFFSET_PX : BANNER_MARGIN_TOP_PX
    self.container.setY(targetY)
  }
}

function _patchBootScene(): void {
  const original = BootScene.prototype.create
  BootScene.prototype.create = function () {
    original.call(this)
    this.tweens.killAll()
  }
}

function _pollForOverworld(game: Phaser.Game): void {
  const interval = setInterval(() => {
    if (!game.scene.isActive('OverworldScene')) return
    clearInterval(interval)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = game.scene.getScene('OverworldScene') as any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__overworldTest = {
      isReady: true,
      interact: (name: string) => scene.interactionSystem.triggerByName(name),
      hideBanner: () => scene.completionBanner?.hide(),
      showQuestOverlay: () => scene.questOverlay?.show(scene.questSystem?.getAll()),
      showCongratulatoryOverlay: () => scene.congratulatoryOverlay?.show(CONGRATULATORY_MESSAGE),
      freezePlayer: () => scene.playerController?.freeze(),
    }
  }, 50)
}
