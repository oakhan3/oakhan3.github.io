import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { OverworldScene } from './scenes/overworld'
import { GBA_WIDTH, GBA_HEIGHT } from './config'
const TEST_MODE = new URLSearchParams(window.location.search).has('test')
const BENCHMARK_MODE = new URLSearchParams(window.location.search).has('benchmark')

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
      // NOTE: Zero gravity for top-down RPG.
      gravity: { x: 0, y: 0 },
      debug: false,
      // NOTE: Defaults are 6/4/2. Halving is safe for a top-down RPG with no
      // complex joints or stacking — reduces solver cost per frame.
      positionIterations: 3,
      velocityIterations: 2,
      constraintIterations: 1,
    },
  },
  render: {
    // NOTE: Hints the browser to prefer the discrete/high-performance GPU.
    powerPreference: 'high-performance',
  },
  fps: {
    smoothStep: true,
    target: 30,
    limit: 30,
  },
  scene: [BootScene, PreloadScene, OverworldScene],
}

export function createGame(): Phaser.Game {
  const game = new Phaser.Game(GAME_CONFIG)
  if (TEST_MODE) {
    import('./test-hooks').then(({ setupTestHooks }) => setupTestHooks(game))
  }
  if (BENCHMARK_MODE) {
    import('./benchmark-hooks').then(({ setupBenchmarkHooks }) => setupBenchmarkHooks(game))
  }
  return game
}

createGame()
