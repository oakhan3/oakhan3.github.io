import Phaser from 'phaser'
import { DEPTH_LIGHTING, DEPTH_SPOTLIGHT_GLOW } from '../../../config'
import { BRUSH_BASE_RADIUS_PX, ConeSpec, createLightTexture, createConeTexture } from './textures'
import { computeAnimation, modulateBrightness } from './animation'

export interface FixedLight {
  pixelX: number
  pixelY: number
  radius: number
  color: number
  cone?: string
  // NOTE: Rotation in degrees applied to the cone. Positive = clockwise.
  coneAngle?: number
  // NOTE: Glow lights use a second ADD-blended layer so colors appear vibrant
  // instead of being darkened by MULTIPLY. The MULTIPLY layer reveals the area
  // as white, then the ADD layer paints the color on top.
  glow?: boolean
  // NOTE: Animation type applied each frame. 'flicker' = rapid random jitter
  // (lamps, headlights). 'pulse' = slow sine-wave breathing (windows, ambient).
  // 'color-cycle' = hue rotation through the color wheel (stage spotlights).
  animation?: 'flicker' | 'pulse' | 'color-cycle'
}

export interface ConeTypeConfig {
  spec: ConeSpec
  origin: { x: number; y: number }
  // NOTE: Where the cone is drawn relative to light.pixelX/Y.
  sourceOffset: { x: number; y: number }
  // NOTE: Where the light pool is drawn relative to light.pixelX/Y.
  poolOffset: { x: number; y: number }
  // NOTE: 'scale' = cone shape scales with animation; 'modulate' = brightness only (shape stays rigid).
  animationStyle: 'scale' | 'modulate'
}

export interface SpotlightConfig {
  ambientColor: number
  playerLightRadius: number
  coneTypes: Record<string, ConeTypeConfig>
  fixedLights: FixedLight[]
}

export class SpotlightOverlay {
  private scene: Phaser.Scene
  private config: SpotlightConfig
  private renderTexture: Phaser.GameObjects.RenderTexture
  // NOTE: Second layer with ADD blend for vibrant colored glows. MULTIPLY can
  // only darken, so colored lights look dim. ADD composites color on top of the
  // scene, producing bright, saturated light effects.
  private glowTexture: Phaser.GameObjects.RenderTexture
  private lightBrush: Phaser.GameObjects.Image
  private coneBrushes = new Map<string, Phaser.GameObjects.Image>()
  private player: Phaser.GameObjects.Sprite
  // NOTE: Each animated light gets a random phase offset so they don't
  // flicker/pulse in lockstep. Seeded once at construction time.
  private lightSeeds: number[]

  constructor(
    scene: Phaser.Scene,
    mapWidth: number,
    mapHeight: number,
    player: Phaser.GameObjects.Sprite,
    config: SpotlightConfig,
  ) {
    this.scene = scene
    this.player = player
    this.config = config
    this.lightSeeds = config.fixedLights.map(() => Math.random() * 10000)

    createLightTexture(scene, 'light-gradient', BRUSH_BASE_RADIUS_PX)

    for (const [key, coneConfig] of Object.entries(config.coneTypes)) {
      createConeTexture(scene, `cone-${key}`, coneConfig.spec)
      const brush = scene.make.image({ key: `cone-${key}`, add: false })
      brush.setOrigin(coneConfig.origin.x, coneConfig.origin.y)
      this.coneBrushes.set(key, brush)
    }

    this.lightBrush = scene.make.image({ key: 'light-gradient', add: false })

    this.renderTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.renderTexture.setOrigin(0, 0)
    this.renderTexture.setBlendMode(Phaser.BlendModes.MULTIPLY)
    this.renderTexture.setDepth(DEPTH_LIGHTING)

    this.glowTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.glowTexture.setOrigin(0, 0)
    this.glowTexture.setBlendMode(Phaser.BlendModes.ADD)
    this.glowTexture.setDepth(DEPTH_SPOTLIGHT_GLOW)

    // NOTE: Initial draw so the first frame isn't unlit.
    this.update()
  }

  update() {
    const time = this.scene.time.now
    const { ambientColor, playerLightRadius, fixedLights } = this.config

    this.renderTexture.clear()
    this.renderTexture.fill(ambientColor)

    // NOTE: Player light — white so it reveals the scene at full color.
    this.lightBrush.setTint(0xffffff)
    this.lightBrush.setScale(playerLightRadius / BRUSH_BASE_RADIUS_PX)
    this.renderTexture.draw(this.lightBrush, this.player.x, this.player.y)

    this.glowTexture.clear()

    for (let index = 0; index < fixedLights.length; index++) {
      const light = fixedLights[index]
      const seed = this.lightSeeds[index]

      const { radiusScale, color } = computeAnimation(light, time, seed, index)

      // NOTE: For cone lights, the circular pool sits at the end of the cone
      // (where the beam hits the ground/surface), not at the source.
      let poolX = light.pixelX
      let poolY = light.pixelY
      if (light.cone) {
        const coneConfig = this.config.coneTypes[light.cone]
        poolX += coneConfig.poolOffset.x
        poolY += coneConfig.poolOffset.y
      }

      const animatedRadius = light.radius * radiusScale
      this.lightBrush.setScale(animatedRadius / BRUSH_BASE_RADIUS_PX)

      if (light.glow) {
        // NOTE: Glow lights get drawn white on the MULTIPLY layer (to reveal
        // the area) and colored on the ADD layer (to paint vibrant color).
        this.lightBrush.setTint(0xffffff)
        this.renderTexture.draw(this.lightBrush, poolX, poolY)
        this.lightBrush.setTint(color)
        this.glowTexture.draw(this.lightBrush, poolX, poolY)
      } else {
        this.lightBrush.setTint(color)
        this.renderTexture.draw(this.lightBrush, poolX, poolY)
      }

      if (light.cone) {
        const coneConfig = this.config.coneTypes[light.cone]
        const coneBrush = this.coneBrushes.get(light.cone)!
        const coneX = light.pixelX + coneConfig.sourceOffset.x
        const coneY = light.pixelY + coneConfig.sourceOffset.y

        if (coneConfig.animationStyle === 'scale') {
          coneBrush.setTint(color)
          coneBrush.setScale(radiusScale)
          coneBrush.setRotation(((light.coneAngle ?? 0) * Math.PI) / 180)
          this.renderTexture.draw(coneBrush, coneX, coneY)
          coneBrush.setRotation(0)
          coneBrush.setScale(1)
        } else {
          // NOTE: Modulate-style cones keep the beam shape rigid while intensity wavers.
          coneBrush.setTint(modulateBrightness(color, radiusScale))
          this.renderTexture.draw(coneBrush, coneX, coneY)
        }
      }
    }
  }
}
