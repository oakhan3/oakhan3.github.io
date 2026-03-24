import Phaser from 'phaser'
import { SparkleOverlay } from '../../../../lib/overlay'
import { SPARKLE_CONFIG } from './config'

export function createSparkleOverlay(scene: Phaser.Scene, mapWidth: number, mapHeight: number): SparkleOverlay {
  return new SparkleOverlay(scene, mapWidth, mapHeight, SPARKLE_CONFIG)
}
