import Phaser from 'phaser'
import { SparkleOverlay } from '../../../lib/overlay'
import type { SparkleConfig } from '../../../lib/overlay'

// NOTE: Total number of sparkles scattered across the map.
const SPARKLE_COUNT = 60

// NOTE: Sparkle dot radius in pixels. Kept tiny for a subtle star-like effect.
const SPARKLE_RADIUS = 1.5

// NOTE: Each sparkle completes a full fade-in/fade-out cycle over a random
// period in this range (milliseconds). Variation prevents synchronized blinking.
const MIN_CYCLE_MS = 2000
const MAX_CYCLE_MS = 5000

// NOTE: Peak alpha for the brightest moment of a sparkle's cycle.
const MAX_ALPHA = 0.7

// NOTE: Sparkles drift downward slowly to simulate falling. Speed in pixels
// per millisecond. Slight horizontal sway adds organic movement.
const FALL_SPEED = 0.008
const SWAY_AMPLITUDE = 0.3
const SWAY_SPEED = 0.001

const SPARKLE_CONFIG: SparkleConfig = {
  count: SPARKLE_COUNT,
  radius: SPARKLE_RADIUS,
  minCycleMs: MIN_CYCLE_MS,
  maxCycleMs: MAX_CYCLE_MS,
  maxAlpha: MAX_ALPHA,
  fallSpeed: FALL_SPEED,
  swayAmplitude: SWAY_AMPLITUDE,
  swaySpeed: SWAY_SPEED,
}

export function createSparkleOverlay(scene: Phaser.Scene, mapWidth: number, mapHeight: number): SparkleOverlay {
  return new SparkleOverlay(scene, mapWidth, mapHeight, SPARKLE_CONFIG)
}
