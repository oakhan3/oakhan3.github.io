import type { PlayerAnimationConfig } from '../../../lib/player'

export const PLAYER_ANIMATION_CONFIG: PlayerAnimationConfig = {
  spriteKey: 'player',
  frameRate: 8,
  animations: {
    down: { key: 'walk-down', frames: [0, 3] },
    right: { key: 'walk-right', frames: [4, 7] },
    up: { key: 'walk-up', frames: [8, 11] },
  },
}
