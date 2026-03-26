import Phaser from 'phaser'
import { flags } from './game-flags'

export function setupBenchmarkHooks(game: Phaser.Game): void {
  flags.collectFrameTimes = true
  flags.collectSpotlightTimes = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__benchmark = { isReady: false }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__frameTimes = [] as number[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__spotlightTimes = [] as number[]

  _pollForOverworld(game)
}

function _pollForOverworld(game: Phaser.Game): void {
  const interval = setInterval(() => {
    if (!game.scene.isActive('OverworldScene')) return
    clearInterval(interval)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__benchmark.isReady = true
  }, 50)
}
