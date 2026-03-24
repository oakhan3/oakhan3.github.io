import Phaser from 'phaser'
import { LightingOverlay } from '../../../../lib/overlay'
import { LIGHTING_CONFIG } from './config'

export function createLightingOverlay(
  scene: Phaser.Scene,
  mapWidth: number,
  mapHeight: number,
  player: Phaser.GameObjects.Sprite,
): LightingOverlay {
  return new LightingOverlay(scene, mapWidth, mapHeight, player, LIGHTING_CONFIG)
}
