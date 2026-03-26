import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { OverworldScene } from './scenes/overworld'
import { GBA_WIDTH, GBA_HEIGHT } from './config'
import { TEST_MODE } from './test-mode'

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  autoFocus: true,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GBA_WIDTH,
    height: GBA_HEIGHT,
  },
  physics: {
    default: 'matter',
    matter: {
      // NOTE: Zero gravity for top-down RPG — no downward pull.
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  // NOTE: Phaser's delta smoothing causes sluggish movement for ~5s on startup
  // while it calibrates. Disabling it makes speed consistent from frame one.
  fps: {
    smoothStep: false,
  },
  scene: [BootScene, PreloadScene, OverworldScene],
}

export function createGame(): Phaser.Game {
  const game = new Phaser.Game(GAME_CONFIG)
  if (TEST_MODE) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__phaserGame = game
  }
  return game
}

createGame()
