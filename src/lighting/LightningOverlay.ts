import Phaser from 'phaser'
import { DEPTH_LIGHTING, TILE_SIZE } from '../config'

// NOTE: Target tile coordinates where the lightning bolt strikes.
const TARGET_TILE_X = 39
const TARGET_TILE_Y = 8

// NOTE: Bolt originates this many pixels above the target and strikes
// downward to hit it. Simulates lightning coming from the sky.
const BOLT_LENGTH = 96

// NOTE: Random interval range between strikes (milliseconds). The bolt fires
// at a random time within this window, creating unpredictable timing.
const MIN_INTERVAL_MS = 1000
const MAX_INTERVAL_MS = 3000

// NOTE: How long the bolt stays visible (milliseconds). Short duration
// creates a fast, snappy flash.
const BOLT_DURATION_MS = 120

// NOTE: Fade-out portion of the bolt duration. The bolt is fully bright for
// (BOLT_DURATION_MS - FADE_MS), then fades linearly to zero over FADE_MS.
const FADE_MS = 80

// NOTE: Midpoint displacement parameters. Each recursion halves the segment
// and reduces the max displacement by this decay factor.
const DISPLACEMENT_INITIAL = 18
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
const MAIN_BOLT_WIDTH = 2
const BRANCH_BOLT_WIDTH = 1

// NOTE: Lightning bolt color - bright white-blue.
const BOLT_COLOR = 'rgba(200, 220, 255, 1)'
// NOTE: Glow around the bolt for a bloom-like effect, drawn wider and dimmer.
const GLOW_COLOR = 'rgba(100, 140, 255, 0.4)'
const GLOW_WIDTH = 6

interface BoltSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface ActiveBolt {
  segments: BoltSegment[]
  branches: BoltSegment[][]
  startTime: number
}

export class LightningOverlay {
  private scene: Phaser.Scene
  private renderTexture: Phaser.GameObjects.RenderTexture
  private canvasTexture: Phaser.Textures.CanvasTexture
  // NOTE: Reusable stamp image — created once, drawn each frame the bolt is
  // active. Avoids creating a new Image object every frame.
  private stamp: Phaser.GameObjects.Image
  private activeBolt: ActiveBolt | null = null
  private nextStrikeTime: number

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.scene = scene

    this.renderTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.renderTexture.setOrigin(0, 0)
    this.renderTexture.setBlendMode(Phaser.BlendModes.ADD)
    // NOTE: Sits above sparkle layer (DEPTH_LIGHTING + 2) but below UI.
    this.renderTexture.setDepth(DEPTH_LIGHTING + 3)

    this.canvasTexture = scene.textures.createCanvas('lightning-canvas', mapWidth, mapHeight)!

    this.stamp = scene.make.image({ key: 'lightning-canvas', add: false })
    this.stamp.setOrigin(0, 0)

    this.nextStrikeTime = scene.time.now + _randomInterval()
  }

  update() {
    const time = this.scene.time.now

    // NOTE: Check if it's time to trigger a new bolt.
    if (!this.activeBolt && time >= this.nextStrikeTime) {
      this.activeBolt = _generateBolt(time)
      this.nextStrikeTime = time + _randomInterval()
    }

    this.renderTexture.clear()

    if (!this.activeBolt) return

    const elapsed = time - this.activeBolt.startTime
    if (elapsed > BOLT_DURATION_MS) {
      this.activeBolt = null
      return
    }

    // NOTE: Full brightness for most of the duration, then linear fade.
    const fadeStart = BOLT_DURATION_MS - FADE_MS
    const alpha = elapsed < fadeStart ? 1 : 1 - (elapsed - fadeStart) / FADE_MS

    // NOTE: Draw bolt segments onto the canvas texture, then stamp it onto
    // the RenderTexture for compositing with the scene.
    const context = this.canvasTexture.getContext()
    _drawBolt(context, this.canvasTexture.width, this.canvasTexture.height, this.activeBolt, alpha)
    this.canvasTexture.refresh()

    this.renderTexture.draw(this.stamp, 0, 0)
  }
}

function _randomInterval(): number {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS)
}

function _generateBolt(time: number): ActiveBolt {
  // NOTE: Target is the center of the strike tile. Bolt comes from above.
  const targetX = TARGET_TILE_X * TILE_SIZE + TILE_SIZE / 2
  const targetY = TARGET_TILE_Y * TILE_SIZE + TILE_SIZE / 2

  // NOTE: Source is directly above the target with slight horizontal wander
  // so each strike enters from a slightly different angle.
  const sourceX = targetX + (Math.random() - 0.5) * 20
  const sourceY = targetY - BOLT_LENGTH
  const endX = targetX
  const endY = targetY

  const segments = _midpointDisplacement(sourceX, sourceY, endX, endY, DISPLACEMENT_INITIAL, SUBDIVISION_DEPTH)

  // NOTE: Generate branches from random segments along the main bolt.
  const branches: BoltSegment[][] = []
  for (let index = 1; index < segments.length - 1; index++) {
    if (Math.random() < BRANCH_PROBABILITY) {
      const segment = segments[index]
      // NOTE: Branch angles off to the side, biased away from center.
      const branchAngle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 6 + (Math.random() * Math.PI) / 6)
      const branchLength = BOLT_LENGTH * BRANCH_LENGTH_RATIO * (1 - index / segments.length)
      const branchEndX = segment.x2 + Math.sin(branchAngle) * branchLength
      const branchEndY = segment.y2 + Math.cos(branchAngle) * branchLength * 0.7

      branches.push(
        _midpointDisplacement(
          segment.x2,
          segment.y2,
          branchEndX,
          branchEndY,
          DISPLACEMENT_INITIAL * 0.5,
          BRANCH_SUBDIVISION_DEPTH,
        ),
      )
    }
  }

  return { segments, branches, startTime: time }
}

function _midpointDisplacement(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  displacement: number,
  depth: number,
): BoltSegment[] {
  // NOTE: Base case - return a single segment between the two points.
  if (depth === 0) {
    return [{ x1, y1, x2, y2 }]
  }

  // NOTE: Find midpoint and displace it perpendicular to the line.
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // NOTE: Perpendicular direction to the segment. For a mostly-vertical
  // bolt, this pushes the midpoint left or right.
  const deltaX = x2 - x1
  const deltaY = y2 - y1
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const perpX = -deltaY / length
  const perpY = deltaX / length

  const offset = (Math.random() - 0.5) * 2 * displacement
  const displacedMidX = midX + perpX * offset
  const displacedMidY = midY + perpY * offset

  const reducedDisplacement = displacement * DISPLACEMENT_DECAY

  // NOTE: Recurse on each half with reduced displacement range.
  const left = _midpointDisplacement(x1, y1, displacedMidX, displacedMidY, reducedDisplacement, depth - 1)
  const right = _midpointDisplacement(displacedMidX, displacedMidY, x2, y2, reducedDisplacement, depth - 1)

  return [...left, ...right]
}

function _drawBolt(context: CanvasRenderingContext2D, width: number, height: number, bolt: ActiveBolt, alpha: number) {
  context.clearRect(0, 0, width, height)

  // NOTE: Draw glow layer first (wider, dimmer) then the sharp bolt on top.
  // This creates a bloom-like effect around the lightning.
  _drawSegments(context, bolt.segments, GLOW_COLOR, GLOW_WIDTH, alpha)
  _drawSegments(context, bolt.segments, BOLT_COLOR, MAIN_BOLT_WIDTH, alpha)

  for (const branch of bolt.branches) {
    _drawSegments(context, branch, GLOW_COLOR, GLOW_WIDTH * 0.6, alpha * 0.6)
    _drawSegments(context, branch, BOLT_COLOR, BRANCH_BOLT_WIDTH, alpha * 0.7)
  }
}

function _drawSegments(
  context: CanvasRenderingContext2D,
  segments: BoltSegment[],
  color: string,
  lineWidth: number,
  alpha: number,
) {
  context.save()
  context.globalAlpha = alpha
  context.strokeStyle = color
  context.lineWidth = lineWidth
  context.lineCap = 'round'
  context.lineJoin = 'round'

  context.beginPath()
  if (segments.length > 0) {
    context.moveTo(segments[0].x1, segments[0].y1)
    for (const segment of segments) {
      context.lineTo(segment.x2, segment.y2)
    }
  }
  context.stroke()
  context.restore()
}
