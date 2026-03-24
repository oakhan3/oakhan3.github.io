import { describe, it, expect, afterEach } from 'vitest'
import Phaser from 'phaser'
import { createObjectCollisions } from '../../lib/collision'
import { PlayerSprite } from '../../lib/player/PlayerSprite'
import { PlayerController } from '../../lib/player/PlayerController'
import { TouchControls } from '../../lib/mobile/TouchControls'
import { GBA_HEIGHT } from '../../config'
import { createMinimalGame, waitForScene, delay, simulateKeyDown, simulateKeyUp } from '../testing'
import collisionMapData from '../fixtures/collision-map.json'

// NOTE: The fixture places a 32px-wide wall at x=200 spanning the full map height.
// Player starts at x=100 and moves right — expect it to stop before reaching x=200.
const WALL_X = 200

class CollisionTestScene extends Phaser.Scene {
  player!: PlayerSprite
  controller!: PlayerController

  constructor() {
    super({ key: 'CollisionTestScene' })
  }

  preload() {
    this.textures.generate('player', { data: ['1'], pixelWidth: 48 })
    // NOTE: Add fixture JSON to the tilemap cache so make.tilemap can load it by key.
    // Format 1 = Phaser.Tilemaps.Formats.TILED_JSON.
    this.cache.tilemap.add('collision-map', { format: 1, data: collisionMapData })
  }

  create() {
    const map = this.make.tilemap({ key: 'collision-map' })
    createObjectCollisions(this, map, { collisionLayer: 'Collisions', interactablesLayer: 'Interactables' })

    this.player = new PlayerSprite(this, 100, GBA_HEIGHT / 2)
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    const touchControls = new TouchControls(this)
    this.controller = new PlayerController(this, this.player, touchControls)
  }

  update() {
    this.controller.update()
  }
}

let game: Phaser.Game | null = null

afterEach(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

describe('createObjectCollisions', () => {
  it('throws when the collision layer is missing', () => {
    const map = { getObjectLayer: () => null } as unknown as Phaser.Tilemaps.Tilemap
    const scene = {} as Phaser.Scene

    expect(() =>
      createObjectCollisions(scene, map, { collisionLayer: 'Missing', interactablesLayer: 'Interactables' }),
    ).toThrow("Object layer 'Missing' not found in the tilemap.")
  })

  it('throws when the interactables layer is missing', () => {
    const map = {
      getObjectLayer: (name: string) => (name === 'Collisions' ? { objects: [] } : null),
    } as unknown as Phaser.Tilemaps.Tilemap
    const scene = {} as Phaser.Scene

    expect(() =>
      createObjectCollisions(scene, map, { collisionLayer: 'Collisions', interactablesLayer: 'Missing' }),
    ).toThrow("Object layer 'Missing' not found in the tilemap.")
  })
})

describe('collision behavior', () => {
  it('stops player at wall defined in collision layer', async () => {
    game = createMinimalGame([CollisionTestScene], { physics: true })
    const scene = (await waitForScene(game, 'CollisionTestScene')) as CollisionTestScene

    const startX = scene.player.x

    simulateKeyDown(game, 'd', 68)
    await delay(2000)
    simulateKeyUp(game, 'd', 68)

    // NOTE: Player moved right but is stopped by the wall at x=200.
    expect(scene.player.x).toBeGreaterThan(startX)
    expect(scene.player.x).toBeLessThan(WALL_X)
  }, 8000)
})
