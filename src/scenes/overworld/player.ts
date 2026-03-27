import Phaser from 'phaser'
import { createPlayerAnimations } from '../../lib/player'
import type { PlayerAnimationConfig } from '../../lib/player'

const PLAYER_ANIMATION_CONFIG: PlayerAnimationConfig = {
  spriteKey: 'player',
  frameRate: 8,
  animations: {
    down: { key: 'walk-down', frames: [0, 2] },
    up: { key: 'walk-up', frames: [3, 5] },
    left: { key: 'walk-left', frames: [6, 8] },
    right: { key: 'walk-right', frames: [9, 11] },
  },
}

export function setupPlayerAnimations(scene: Phaser.Scene): void {
  createPlayerAnimations(scene, PLAYER_ANIMATION_CONFIG)
}
