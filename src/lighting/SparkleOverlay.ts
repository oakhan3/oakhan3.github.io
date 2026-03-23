import Phaser from 'phaser'
import { DEPTH_LIGHTING } from '../config'

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

interface Sparkle {
  pixelX: number
  pixelY: number
  // NOTE: Random phase offset so sparkles don't all peak at the same time.
  phase: number
  // NOTE: Individual cycle speed derived from a random period.
  speed: number
  // NOTE: Per-sparkle sway phase so they don't all sway in sync.
  swayPhase: number
}

export class SparkleOverlay {
  private scene: Phaser.Scene
  private renderTexture: Phaser.GameObjects.RenderTexture
  private sparkles: Sparkle[]
  private brush: Phaser.GameObjects.Image

  private mapWidth: number
  private mapHeight: number

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.scene = scene
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight

    _createSparkleTexture(scene, 'sparkle-dot', SPARKLE_RADIUS)

    this.brush = scene.make.image({ key: 'sparkle-dot', add: false })

    // NOTE: Sits above the glow layer (DEPTH_LIGHTING + 1) but below UI.
    this.renderTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.renderTexture.setOrigin(0, 0)
    this.renderTexture.setBlendMode(Phaser.BlendModes.ADD)
    this.renderTexture.setDepth(DEPTH_LIGHTING + 2)

    this.sparkles = []
    for (let index = 0; index < SPARKLE_COUNT; index++) {
      this.sparkles.push(_createSparkle(mapWidth, mapHeight))
    }

    this.update()
  }

  update() {
    const time = this.scene.time.now
    const delta = this.scene.game.loop.delta
    this.renderTexture.clear()

    for (let index = 0; index < this.sparkles.length; index++) {
      const sparkle = this.sparkles[index]

      // NOTE: Drift downward each frame with a gentle horizontal sway.
      sparkle.pixelY += FALL_SPEED * delta
      sparkle.pixelX += Math.sin(time * SWAY_SPEED + sparkle.swayPhase) * SWAY_AMPLITUDE

      // NOTE: When a sparkle falls off the bottom or drifts off the sides,
      // respawn it at the top at a random X position.
      if (sparkle.pixelY > this.mapHeight || sparkle.pixelX < 0 || sparkle.pixelX > this.mapWidth) {
        this.sparkles[index] = _createSparkle(this.mapWidth, this.mapHeight)
        this.sparkles[index].pixelY = 0
        continue
      }

      // NOTE: Sine wave produces smooth 0-to-1-to-0 breathing. Clamped to
      // zero on the negative half so sparkles spend time fully off.
      const wave = Math.sin(time * sparkle.speed + sparkle.phase)
      const alpha = Math.max(0, wave) * MAX_ALPHA

      if (alpha < 0.01) continue

      this.brush.setAlpha(alpha)
      this.renderTexture.draw(this.brush, sparkle.pixelX, sparkle.pixelY)
    }
  }
}

function _createSparkle(mapWidth: number, mapHeight: number): Sparkle {
  const period = MIN_CYCLE_MS + Math.random() * (MAX_CYCLE_MS - MIN_CYCLE_MS)
  return {
    pixelX: Math.random() * mapWidth,
    pixelY: Math.random() * mapHeight,
    phase: Math.random() * Math.PI * 2,
    speed: (Math.PI * 2) / period,
    swayPhase: Math.random() * Math.PI * 2,
  }
}

function _createSparkleTexture(scene: Phaser.Scene, key: string, radius: number) {
  const size = Math.ceil(radius * 2) + 2
  const center = size / 2
  const canvasTexture = scene.textures.createCanvas(key, size, size)!
  const context = canvasTexture.getContext()

  // NOTE: Bright white core with a soft glow falloff for a star-like point.
  const gradient = context.createRadialGradient(center, center, 0, center, center, radius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  canvasTexture.refresh()
}
