import Phaser from 'phaser'
import { createPlayerAnimations } from '../../../lib/player'
import { PLAYER_ANIMATION_CONFIG } from './config'

export function setupPlayerAnimations(scene: Phaser.Scene): void {
  createPlayerAnimations(scene, PLAYER_ANIMATION_CONFIG)
}
