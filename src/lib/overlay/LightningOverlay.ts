import Phaser from 'phaser'
import { DEPTH_LIGHTNING, TILE_SIZE } from '../../config'

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

export interface LightningConfig {
  targetTileX: number
  targetTileY: number
  minIntervalMs: number
  maxIntervalMs: number
  boltDurationMs: number
  fadeMs: number
  displacementInitial: number
  displacementDecay: number
  subdivisionDepth: number
  branchProbability: number
  branchLengthRatio: number
  branchSubdivisionDepth: number
  mainBoltWidth: number
  branchBoltWidth: number
  boltColor: string
  glowColor: string
  glowWidth: number
}

export class LightningOverlay {
  private scene: Phaser.Scene
  private config: LightningConfig
  private renderTexture: Phaser.GameObjects.RenderTexture
  private canvasTexture: Phaser.Textures.CanvasTexture
  // NOTE: Reusable stamp image — created once, drawn each frame the bolt is
  // active. Avoids creating a new Image object every frame.
  private stamp: Phaser.GameObjects.Image
  private activeBolt: ActiveBolt | null = null
  private nextStrikeTime: number

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, config: LightningConfig) {
    this.scene = scene
    this.config = config

    this.renderTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.renderTexture.setOrigin(0, 0)
    this.renderTexture.setBlendMode(Phaser.BlendModes.ADD)
    // NOTE: Sits above sparkle layer (DEPTH_LIGHTING + 2) but below UI.
    this.renderTexture.setDepth(DEPTH_LIGHTNING)

    this.canvasTexture = scene.textures.createCanvas('lightning-canvas', mapWidth, mapHeight)!

    this.stamp = scene.make.image({ key: 'lightning-canvas', add: false })
    this.stamp.setOrigin(0, 0)

    this.nextStrikeTime = scene.time.now + _randomInterval(config.minIntervalMs, config.maxIntervalMs)
  }

  update() {
    const time = this.scene.time.now
    const config = this.config

    // NOTE: Check if it's time to trigger a new bolt.
    if (!this.activeBolt && time >= this.nextStrikeTime) {
      this.activeBolt = _generateBolt(time, config)
      this.nextStrikeTime = time + _randomInterval(config.minIntervalMs, config.maxIntervalMs)
    }

    this.renderTexture.clear()

    if (!this.activeBolt) return

    const elapsed = time - this.activeBolt.startTime
    if (elapsed > config.boltDurationMs) {
      this.activeBolt = null
      return
    }

    // NOTE: Full brightness for most of the duration, then linear fade.
    const fadeStart = config.boltDurationMs - config.fadeMs
    const alpha = elapsed < fadeStart ? 1 : 1 - (elapsed - fadeStart) / config.fadeMs

    // NOTE: Draw bolt segments onto the canvas texture, then stamp it onto
    // the RenderTexture for compositing with the scene.
    const context = this.canvasTexture.getContext()
    _drawBolt(context, this.canvasTexture.width, this.canvasTexture.height, this.activeBolt, alpha, config)
    this.canvasTexture.refresh()

    this.renderTexture.draw(this.stamp, 0, 0)
  }
}

function _randomInterval(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs)
}

function _generateBolt(time: number, config: LightningConfig): ActiveBolt {
  // NOTE: Target is the center of the strike tile. Bolt comes from above.
  const targetX = config.targetTileX * TILE_SIZE + TILE_SIZE / 2
  const targetY = config.targetTileY * TILE_SIZE + TILE_SIZE / 2

  // NOTE: Source starts at the very top of the map (Y = 0) with slight
  // horizontal wander so each strike enters from a slightly different angle.
  const sourceX = targetX + (Math.random() - 0.5) * 20
  const sourceY = 0
  const boltLength = targetY

  const segments = _midpointDisplacement(
    sourceX,
    sourceY,
    targetX,
    targetY,
    config.displacementInitial,
    config.subdivisionDepth,
    config.displacementDecay,
  )

  // NOTE: Generate branches from random segments along the main bolt.
  const branches: BoltSegment[][] = []
  for (let index = 1; index < segments.length - 1; index++) {
    if (Math.random() < config.branchProbability) {
      const segment = segments[index]
      // NOTE: Branch angles off to the side, biased away from center.
      const branchAngle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 6 + (Math.random() * Math.PI) / 6)
      const branchLength = boltLength * config.branchLengthRatio * (1 - index / segments.length)
      const branchEndX = segment.x2 + Math.sin(branchAngle) * branchLength
      const branchEndY = segment.y2 + Math.cos(branchAngle) * branchLength * 0.7

      branches.push(
        _midpointDisplacement(
          segment.x2,
          segment.y2,
          branchEndX,
          branchEndY,
          config.displacementInitial * 0.5,
          config.branchSubdivisionDepth,
          config.displacementDecay,
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
  decayFactor: number,
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

  const reducedDisplacement = displacement * decayFactor

  // NOTE: Recurse on each half with reduced displacement range.
  const left = _midpointDisplacement(x1, y1, displacedMidX, displacedMidY, reducedDisplacement, depth - 1, decayFactor)
  const right = _midpointDisplacement(displacedMidX, displacedMidY, x2, y2, reducedDisplacement, depth - 1, decayFactor)

  return [...left, ...right]
}

function _drawBolt(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  bolt: ActiveBolt,
  alpha: number,
  config: LightningConfig,
) {
  context.clearRect(0, 0, width, height)

  // NOTE: Draw glow layer first (wider, dimmer) then the sharp bolt on top.
  // This creates a bloom-like effect around the lightning.
  _drawSegments(context, bolt.segments, config.glowColor, config.glowWidth, alpha)
  _drawSegments(context, bolt.segments, config.boltColor, config.mainBoltWidth, alpha)

  for (const branch of bolt.branches) {
    _drawSegments(context, branch, config.glowColor, config.glowWidth * 0.6, alpha * 0.6)
    _drawSegments(context, branch, config.boltColor, config.branchBoltWidth, alpha * 0.7)
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
