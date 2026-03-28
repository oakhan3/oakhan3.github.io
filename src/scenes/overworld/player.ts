import Phaser from 'phaser'
import { createPlayerAnimations } from '../../lib/player'
import type { PlayerAnimationConfig } from '../../lib/player'

const PLAYER_ANIMATION_CONFIG: PlayerAnimationConfig = {
  spriteKey: 'player',
  frameRate: 8,
  animations: {
    idleDown: { key: 'idle-down', frames: [0, 3] },
    idleRight: { key: 'idle-right', frames: [4, 7] },
    idleUp: { key: 'idle-up', frames: [8, 11] },
    walkDown: { key: 'walk-down', frames: [12, 15] },
    walkRight: { key: 'walk-right', frames: [16, 19] },
    walkUp: { key: 'walk-up', frames: [20, 23] },
  },
}

export function setupPlayerAnimations(scene: Phaser.Scene): void {
  createPlayerAnimations(scene, PLAYER_ANIMATION_CONFIG)
}
