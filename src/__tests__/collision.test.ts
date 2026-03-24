import { describe, it, expect } from 'vitest'
import { createObjectCollisions } from '../lib/collision'

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
