import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { QuestOverlay } from '../../lib/quests'
import { DEPTH_QUEST_UI, GBA_WIDTH } from '../../config'
import {
  createMinimalGame,
  waitForScene,
  delay,
  simulateKeyPress,
  simulatePointerDown,
  simulatePointerUp,
  bootToOverworld,
  dismissDialog,
  waitFor,
} from '../testing'
import { createGame } from '../../main'

class OverlayTestScene extends Phaser.Scene {
  overlay!: QuestOverlay

  constructor() {
    super({ key: 'OverlayTestScene' })
  }

  create() {
    this.overlay = new QuestOverlay(this)
  }
}

// NOTE: Overlay container sits at (0,0); banner container sits at (BOX_MARGIN, -height).
// Using x===0 to distinguish overlay from banner in overworld tests.
function findOverlayContainer(scene: Phaser.Scene): Phaser.GameObjects.Container {
  return scene.children.list.find(
    (child) =>
      child instanceof Phaser.GameObjects.Container &&
      child.depth === DEPTH_QUEST_UI &&
      (child as Phaser.GameObjects.Container).x === 0,
  ) as Phaser.GameObjects.Container
}

function findQuestZone(scene: Phaser.Scene): Phaser.GameObjects.Zone {
  return scene.children.list.find(
    (child) => child instanceof Phaser.GameObjects.Zone && child.depth === DEPTH_QUEST_UI,
  ) as Phaser.GameObjects.Zone
}

// NOTE: After the welcome dialog closes, the quest overlay opens automatically.
// This helper dismisses it and waits for the overlay to be confirmed hidden.
async function dismissQuestOverlay(game: Phaser.Game, scene: Phaser.Scene): Promise<void> {
  await delay(100)
  simulateKeyPress(game, 'Enter', 13)
  await waitFor(() => {
    const overlay = findOverlayContainer(scene)
    return !overlay || !overlay.visible
  })
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('QuestOverlay', () => {
  it('overlay becomes visible after show()', async () => {
    game = createMinimalGame([OverlayTestScene])
    const scene = (await waitForScene(game, 'OverlayTestScene')) as OverlayTestScene

    scene.overlay.show([{ name: 'kiwi-sign', label: 'Find Kiwi', completed: false }])

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(true)
  })

  it('overlay hides after Enter key', async () => {
    game = createMinimalGame([OverlayTestScene])
    const scene = (await waitForScene(game, 'OverlayTestScene')) as OverlayTestScene

    scene.overlay.show([{ name: 'kiwi-sign', label: 'Find Kiwi', completed: false }])
    simulateKeyPress(game, 'Enter', 13)
    await delay(50)

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(false)
  })

  it('overlay hides after tap', async () => {
    game = createMinimalGame([OverlayTestScene])
    const scene = (await waitForScene(game, 'OverlayTestScene')) as OverlayTestScene

    scene.overlay.show([{ name: 'kiwi-sign', label: 'Find Kiwi', completed: false }])
    simulatePointerDown(game, GBA_WIDTH / 2, 100)
    await delay(50)

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(false)
  })
})

describe('quest icon', () => {
  it('clicking quest icon opens overlay', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)
    await dismissQuestOverlay(game, scene)

    // NOTE: Click in the center of the quest zone's hit area.
    const zone = findQuestZone(scene)
    const zoneX = zone.x + zone.width / 2
    const zoneY = zone.y + zone.height / 2
    simulatePointerDown(game, zoneX, zoneY)
    simulatePointerUp(game, zoneX, zoneY)

    await waitFor(() => {
      const overlay = findOverlayContainer(scene)
      return overlay?.visible === true
    })

    const overlay = findOverlayContainer(scene)
    expect(overlay.visible).toBe(true)
  })

  it('quest overlay appears after welcome dialog is dismissed', async () => {
    game = createGame()
    const scene = await bootToOverworld(game)
    await dismissDialog(game)

    await waitFor(() => {
      const overlay = findOverlayContainer(scene)
      return overlay?.visible === true
    }, 5000)

    const overlay = findOverlayContainer(scene)
    expect(overlay.visible).toBe(true)
  })
})
