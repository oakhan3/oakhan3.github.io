import Phaser from 'phaser'
import { DEPTH_SPARKLE } from '../../config'

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

export interface SparkleConfig {
  count: number
  radius: number
  minCycleMs: number
  maxCycleMs: number
  maxAlpha: number
  fallSpeed: number
  swayAmplitude: number
  swaySpeed: number
}

export class SparkleOverlay {
  private scene: Phaser.Scene
  private config: SparkleConfig
  private renderTexture: Phaser.GameObjects.RenderTexture
  private sparkles: Sparkle[]
  private brush: Phaser.GameObjects.Image

  private mapWidth: number
  private mapHeight: number

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, config: SparkleConfig) {
    this.scene = scene
    this.config = config
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight

    _createSparkleTexture(scene, 'sparkle-dot', config.radius)

    this.brush = scene.make.image({ key: 'sparkle-dot', add: false })

    // NOTE: Sits above the glow layer (DEPTH_LIGHTING + 1) but below UI.
    this.renderTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.renderTexture.setOrigin(0, 0)
    this.renderTexture.setBlendMode(Phaser.BlendModes.ADD)
    this.renderTexture.setDepth(DEPTH_SPARKLE)

    this.sparkles = []
    for (let index = 0; index < config.count; index++) {
      this.sparkles.push(_createSparkle(mapWidth, mapHeight, config.minCycleMs, config.maxCycleMs))
    }

    this.update()
  }

  update() {
    const time = this.scene.time.now
    const delta = this.scene.game.loop.delta
    const { maxAlpha, fallSpeed, swayAmplitude, swaySpeed, minCycleMs, maxCycleMs } = this.config
    this.renderTexture.clear()

    for (let index = 0; index < this.sparkles.length; index++) {
      const sparkle = this.sparkles[index]

      // NOTE: Drift downward each frame with a gentle horizontal sway.
      sparkle.pixelY += fallSpeed * delta
      sparkle.pixelX += Math.sin(time * swaySpeed + sparkle.swayPhase) * swayAmplitude

      // NOTE: When a sparkle falls off the bottom or drifts off the sides,
      // respawn it at the top at a random X position.
      if (sparkle.pixelY > this.mapHeight || sparkle.pixelX < 0 || sparkle.pixelX > this.mapWidth) {
        this.sparkles[index] = _createSparkle(this.mapWidth, this.mapHeight, minCycleMs, maxCycleMs)
        this.sparkles[index].pixelY = 0
        continue
      }

      // NOTE: Sine wave produces smooth 0-to-1-to-0 breathing. Clamped to
      // zero on the negative half so sparkles spend time fully off.
      const wave = Math.sin(time * sparkle.speed + sparkle.phase)
      const alpha = Math.max(0, wave) * maxAlpha

      if (alpha < 0.01) continue

      this.brush.setAlpha(alpha)
      this.renderTexture.draw(this.brush, sparkle.pixelX, sparkle.pixelY)
    }
  }
}

function _createSparkle(mapWidth: number, mapHeight: number, minCycleMs: number, maxCycleMs: number): Sparkle {
  const period = minCycleMs + Math.random() * (maxCycleMs - minCycleMs)
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
