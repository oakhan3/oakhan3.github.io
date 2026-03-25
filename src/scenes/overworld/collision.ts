import Phaser from 'phaser'
import { createObjectCollisions } from '../../lib/collision'
import type { CollisionConfig } from '../../lib/collision'

const COLLISION_CONFIG: CollisionConfig = {
  interactablesLayer: 'Interactables',
}

export function createCollisions(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap): void {
  createObjectCollisions(scene, map, COLLISION_CONFIG)
}
