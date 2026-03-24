import Phaser from 'phaser'
import { SpotlightOverlay } from '../../../../lib/overlay'
import { SPOTLIGHT_CONFIG } from './config'

export function createSpotlightOverlay(
  scene: Phaser.Scene,
  mapWidth: number,
  mapHeight: number,
  player: Phaser.GameObjects.Sprite,
): SpotlightOverlay {
  return new SpotlightOverlay(scene, mapWidth, mapHeight, player, SPOTLIGHT_CONFIG)
}
