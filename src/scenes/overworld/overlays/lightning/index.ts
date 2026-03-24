import Phaser from 'phaser'
import { LightningOverlay } from '../../../../lib/overlay'
import { LIGHTNING_CONFIG } from './config'

export function createLightningOverlay(scene: Phaser.Scene, mapWidth: number, mapHeight: number): LightningOverlay {
  return new LightningOverlay(scene, mapWidth, mapHeight, LIGHTNING_CONFIG)
}
