import Phaser from 'phaser'
import { LightningOverlay } from '../../../lib/overlay'
import type { LightningConfig } from '../../../lib/overlay'

// NOTE: Target tile coordinates where the lightning bolt strikes.
const TARGET_TILE_X = 39
const TARGET_TILE_Y = 18

// NOTE: Random interval range between strikes (milliseconds). The bolt fires
// at a random time within this window, creating unpredictable timing.
const MIN_INTERVAL_MS = 500
const MAX_INTERVAL_MS = 1500

// NOTE: How long the bolt stays visible (milliseconds). Short duration
// creates a fast, snappy flash.
const BOLT_DURATION_MS = 120

// NOTE: Fade-out portion of the bolt duration. The bolt is fully bright for
// (BOLT_DURATION_MS - FADE_MS), then fades linearly to zero over FADE_MS.
const FADE_MS = 80

// NOTE: Midpoint displacement parameters. Each recursion halves the segment
// and reduces the max displacement by this decay factor.
const DISPLACEMENT_INITIAL_PX = 18
const DISPLACEMENT_DECAY = 0.55
// NOTE: Number of recursive subdivisions. 5 levels = 32 segments, plenty
// of jaggedness for a 96px bolt.
const SUBDIVISION_DEPTH = 5

// NOTE: Probability that a segment spawns a branch (0-1). Kept low so
// branches are occasional, not every segment.
const BRANCH_PROBABILITY = 0.12
// NOTE: Branch length as a fraction of remaining bolt length at that point.
const BRANCH_LENGTH_RATIO = 0.4
// NOTE: Branches use fewer subdivisions since they're shorter.
const BRANCH_SUBDIVISION_DEPTH = 3

// NOTE: Bolt line thickness in pixels. Main bolt is thicker, branches thinner.
const MAIN_BOLT_WIDTH_PX = 2
const BRANCH_BOLT_WIDTH_PX = 1

// NOTE: Lightning bolt color - bright white-blue.
const BOLT_COLOR = 'rgba(200, 220, 255, 1)'
// NOTE: Glow around the bolt for a bloom-like effect, drawn wider and dimmer.
const GLOW_COLOR = 'rgba(100, 140, 255, 0.4)'
const GLOW_WIDTH_PX = 6

const LIGHTNING_CONFIG: LightningConfig = {
  targetTileX: TARGET_TILE_X,
  targetTileY: TARGET_TILE_Y,
  minIntervalMs: MIN_INTERVAL_MS,
  maxIntervalMs: MAX_INTERVAL_MS,
  boltDurationMs: BOLT_DURATION_MS,
  fadeMs: FADE_MS,
  displacementInitial: DISPLACEMENT_INITIAL_PX,
  displacementDecay: DISPLACEMENT_DECAY,
  subdivisionDepth: SUBDIVISION_DEPTH,
  branchProbability: BRANCH_PROBABILITY,
  branchLengthRatio: BRANCH_LENGTH_RATIO,
  branchSubdivisionDepth: BRANCH_SUBDIVISION_DEPTH,
  mainBoltWidth: MAIN_BOLT_WIDTH_PX,
  branchBoltWidth: BRANCH_BOLT_WIDTH_PX,
  boltColor: BOLT_COLOR,
  glowColor: GLOW_COLOR,
  glowWidth: GLOW_WIDTH_PX,
}

export function createLightningOverlay(scene: Phaser.Scene, mapWidth: number, mapHeight: number): LightningOverlay {
  return new LightningOverlay(scene, mapWidth, mapHeight, LIGHTNING_CONFIG)
}
