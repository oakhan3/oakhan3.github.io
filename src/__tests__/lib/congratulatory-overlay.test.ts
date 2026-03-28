import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { CongratulatoryOverlay } from '../../lib/quests'
import { DEPTH_QUEST_UI, GBA_WIDTH } from '../../config'
import { createMinimalGame, waitForScene, delay, simulateKeyPress, simulatePointerDown } from '../testing'

class CongratulatoryTestScene extends Phaser.Scene {
  overlay!: CongratulatoryOverlay

  constructor() {
    super({ key: 'CongratulatoryTestScene' })
  }

  create() {
    this.overlay = new CongratulatoryOverlay(this)
  }
}

function findOverlayContainer(scene: Phaser.Scene): Phaser.GameObjects.Container {
  return scene.children.list.find(
    (child) =>
      child instanceof Phaser.GameObjects.Container &&
      child.depth === DEPTH_QUEST_UI &&
      (child as Phaser.GameObjects.Container).x === 0,
  ) as Phaser.GameObjects.Container
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('CongratulatoryOverlay', () => {
  it('overlay is hidden before show()', async () => {
    game = createMinimalGame([CongratulatoryTestScene])
    const scene = (await waitForScene(game, 'CongratulatoryTestScene')) as CongratulatoryTestScene

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(false)
  })

  it('overlay becomes visible after show()', async () => {
    game = createMinimalGame([CongratulatoryTestScene])
    const scene = (await waitForScene(game, 'CongratulatoryTestScene')) as CongratulatoryTestScene

    scene.overlay.show('Well done!')

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(true)
  })

  it('overlay stays visible if dismissed before 5 seconds', async () => {
    game = createMinimalGame([CongratulatoryTestScene])
    const scene = (await waitForScene(game, 'CongratulatoryTestScene')) as CongratulatoryTestScene

    scene.overlay.show('Well done!')
    simulateKeyPress(game, 'Enter', 13)
    await delay(50)

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(true)
  })

  it('overlay hides after Enter key once 5 seconds have passed', async () => {
    game = createMinimalGame([CongratulatoryTestScene])
    const scene = (await waitForScene(game, 'CongratulatoryTestScene')) as CongratulatoryTestScene

    scene.overlay.show('Well done!')
    await delay(5100)
    simulateKeyPress(game, 'Enter', 13)
    await delay(50)

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(false)
  })

  it('overlay hides after tap once 5 seconds have passed', async () => {
    game = createMinimalGame([CongratulatoryTestScene])
    const scene = (await waitForScene(game, 'CongratulatoryTestScene')) as CongratulatoryTestScene

    scene.overlay.show('Well done!')
    await delay(5100)
    simulatePointerDown(game, GBA_WIDTH / 2, 100)
    await delay(50)

    const container = findOverlayContainer(scene)
    expect(container.visible).toBe(false)
  })

  it('onDismiss callback fires when dismissed after 5 seconds', async () => {
    game = createMinimalGame([CongratulatoryTestScene])
    const scene = (await waitForScene(game, 'CongratulatoryTestScene')) as CongratulatoryTestScene

    let called = false
    scene.overlay.show('Well done!', () => {
      called = true
    })
    await delay(5100)
    simulateKeyPress(game, 'Enter', 13)
    await delay(50)

    expect(called).toBe(true)
  })

  it('onDismiss is not called before dismissal', async () => {
    game = createMinimalGame([CongratulatoryTestScene])
    const scene = (await waitForScene(game, 'CongratulatoryTestScene')) as CongratulatoryTestScene

    let called = false
    scene.overlay.show('Well done!', () => {
      called = true
    })

    expect(called).toBe(false)
  })
})
