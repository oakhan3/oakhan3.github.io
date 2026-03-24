import Phaser from 'phaser'
import { createObjectCollisions } from '../../../lib/collision'
import { COLLISION_CONFIG } from './config'

export function createCollisions(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap): void {
  createObjectCollisions(scene, map, COLLISION_CONFIG)
}
