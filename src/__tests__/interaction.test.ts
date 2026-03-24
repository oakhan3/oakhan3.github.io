import { describe, it, expect } from 'vitest'
import { InteractionSystem } from '../lib/interaction'
import type { PlayerController } from '../lib/player'
import type { DialogBox } from '../lib/dialog'

describe('InteractionSystem', () => {
  it('throws when the Interactables layer is missing', () => {
    const map = { getObjectLayer: () => null } as unknown as Phaser.Tilemaps.Tilemap
    const scene = {} as Phaser.Scene

    expect(
      () =>
        new InteractionSystem(scene, map, {} as Phaser.GameObjects.Sprite, {} as PlayerController, {} as DialogBox, {
          radius: 24,
          messages: {},
        }),
    ).toThrow("Object layer 'Interactables' not found in the tilemap.")
  })
})
