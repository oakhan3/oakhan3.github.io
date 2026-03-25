import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { CompletionBanner } from '../../lib/quests'
import { DEPTH_QUEST_UI } from '../../config'
import { createMinimalGame, waitForScene, waitFor } from '../testing'

class BannerTestScene extends Phaser.Scene {
  banner!: CompletionBanner

  constructor() {
    super({ key: 'BannerTestScene' })
  }

  create() {
    this.banner = new CompletionBanner(this)
  }
}

function findBannerContainer(scene: Phaser.Scene): Phaser.GameObjects.Container {
  return scene.children.list.find(
    (child) => child instanceof Phaser.GameObjects.Container && child.depth === DEPTH_QUEST_UI,
  ) as Phaser.GameObjects.Container
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('CompletionBanner', () => {
  it('banner becomes visible after show()', async () => {
    game = createMinimalGame([BannerTestScene])
    const scene = (await waitForScene(game, 'BannerTestScene')) as BannerTestScene

    scene.banner.show('Find Kiwi')

    const container = findBannerContainer(scene)
    expect(container.visible).toBe(true)
  })

  it('banner becomes invisible after auto-dismiss', async () => {
    game = createMinimalGame([BannerTestScene])
    const scene = (await waitForScene(game, 'BannerTestScene')) as BannerTestScene

    scene.banner.show('Find Kiwi')

    const container = findBannerContainer(scene)
    await waitFor(() => !container.visible, 5000)

    expect(container.visible).toBe(false)
  })
})
