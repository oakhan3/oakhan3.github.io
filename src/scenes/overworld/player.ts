import Phaser from 'phaser'
import { createPlayerAnimations } from '../../lib/player'
import type { PlayerAnimationConfig } from '../../lib/player'

const PLAYER_ANIMATION_CONFIG: PlayerAnimationConfig = {
  spriteKey: 'player',
  frameRate: 8,
  animations: {
    down: { key: 'walk-down', frames: [0, 3] },
    right: { key: 'walk-right', frames: [4, 7] },
    up: { key: 'walk-up', frames: [8, 11] },
  },
}

export function setupPlayerAnimations(scene: Phaser.Scene): void {
  createPlayerAnimations(scene, PLAYER_ANIMATION_CONFIG)
}
