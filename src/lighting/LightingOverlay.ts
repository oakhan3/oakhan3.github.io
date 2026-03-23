import Phaser from 'phaser'
import { DEPTH_LIGHTING, TILE_SIZE } from '../config'

// NOTE: Dark blue-black ambient color for nighttime. With MULTIPLY blend mode,
// dark pixels darken the scene and bright pixels leave it unchanged. Drawing
// colored circles onto this dark fill creates tinted light effects.
const AMBIENT_COLOR = 0x334466

// NOTE: Player light radius in pixels.
const PLAYER_LIGHT_RADIUS = 80

// NOTE: Shared light brush texture radius. All lights use the same gradient
// texture, scaled via setScale on the brush image before drawing.
const BRUSH_BASE_RADIUS = 80

// NOTE: Flicker animation constants. Multiple sine waves at different
// frequencies are layered to create a gentle, organic shimmer.
const FLICKER_SPEED_1 = 0.0015
const FLICKER_SPEED_2 = 0.0028
const FLICKER_SPEED_3 = 0.005
// NOTE: Maximum radius variation as a fraction of base radius (3%).
const FLICKER_AMPLITUDE = 0.03
// NOTE: Occasional deep dip — triggers when a slow sine crosses a threshold.
const FLICKER_DIP_THRESHOLD = 0.95
const FLICKER_DIP_AMOUNT = 0.08

// NOTE: Pulse animation constants. Slow sine-wave breathing effect.
const PULSE_SPEED = 0.002
// NOTE: Radius oscillates by +/-15% of its base value.
const PULSE_AMPLITUDE = 0.15

// NOTE: Color-cycle constants. Full hue rotation period in milliseconds.
const COLOR_CYCLE_PERIOD = 10000

// NOTE: Stage cones are wider at the tip (big stage lights). Lamp cones have a
// narrow tip (small lamp heads) that flares out more.
const STAGE_CONE_WIDTH = 48
const STAGE_CONE_HEIGHT = 40
const LAMP_CONE_WIDTH = 32
const LAMP_CONE_HEIGHT = 40
// NOTE: Headlight cone projects horizontally to the left from the car.
const HEADLIGHT_CONE_LENGTH = 40
const HEADLIGHT_CONE_SPREAD = 16

interface FixedLight {
  pixelX: number
  pixelY: number
  radius: number
  color: number
  cone?: 'stage' | 'lamp' | 'headlight'
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

// NOTE: Tile coords x TILE_SIZE = pixel coords. Spotlights are placed a few
// tiles below the gem sources so the light pools onto the stage surface.
const FIXED_LIGHTS: FixedLight[] = [
  // Stage spotlights — gems along row 0, beams project down onto stage
  {
    pixelX: 25 * TILE_SIZE,
    pixelY: 0 * TILE_SIZE,
    radius: 30,
    color: 0xff4444,
    cone: 'stage',
    animation: 'color-cycle',
  },
  {
    pixelX: 26 * TILE_SIZE,
    pixelY: 0 * TILE_SIZE,
    radius: 30,
    color: 0xffff44,
    cone: 'stage',
    animation: 'color-cycle',
  },
  {
    pixelX: 27 * TILE_SIZE,
    pixelY: 0 * TILE_SIZE,
    radius: 30,
    color: 0x44ff44,
    cone: 'stage',
    animation: 'color-cycle',
  },
  {
    pixelX: 28 * TILE_SIZE,
    pixelY: 0 * TILE_SIZE,
    radius: 30,
    color: 0x4444ff,
    cone: 'stage',
    animation: 'color-cycle',
  },
  {
    pixelX: 29 * TILE_SIZE,
    pixelY: 0 * TILE_SIZE,
    radius: 30,
    color: 0xaa44ff,
    cone: 'stage',
    animation: 'color-cycle',
  },
  {
    pixelX: 30 * TILE_SIZE,
    pixelY: 0 * TILE_SIZE,
    radius: 30,
    color: 0xff44aa,
    cone: 'stage',
    animation: 'color-cycle',
  },

  // Lamps — center of island. Pixel offsets nudge the cone to align with the
  // lamp head sprite. Cones tilt 12 degrees inward.
  // Small glow at the lamp head so the cone doesn't emerge from darkness.
  { pixelX: 26 * TILE_SIZE + 3, pixelY: 9 * TILE_SIZE + 5, radius: 10, color: 0x998866 },
  { pixelX: 29 * TILE_SIZE + 12, pixelY: 9 * TILE_SIZE + 5, radius: 10, color: 0x998866 },
  {
    pixelX: 26 * TILE_SIZE + 3,
    pixelY: 9 * TILE_SIZE + 3,
    radius: 51,
    color: 0xffe8a0,
    cone: 'lamp',
    coneAngle: -12,
    animation: 'flicker',
  },
  {
    pixelX: 29 * TILE_SIZE + 12,
    pixelY: 9 * TILE_SIZE + 3,
    radius: 51,
    color: 0xffe8a0,
    cone: 'lamp',
    coneAngle: 12,
    animation: 'flicker',
  },

  // Building windows — vibrant blue glow via ADD blend layer
  { pixelX: 34.5 * TILE_SIZE, pixelY: 17 * TILE_SIZE, radius: 40, color: 0x0e3388, glow: true, animation: 'pulse' },
  { pixelX: 36.5 * TILE_SIZE, pixelY: 17 * TILE_SIZE, radius: 40, color: 0x0e3388, glow: true, animation: 'pulse' },
  { pixelX: 34.5 * TILE_SIZE, pixelY: 18.5 * TILE_SIZE, radius: 40, color: 0x0e3388, glow: true, animation: 'pulse' },
  { pixelX: 36.5 * TILE_SIZE, pixelY: 18.5 * TILE_SIZE, radius: 40, color: 0x0e3388, glow: true, animation: 'pulse' },
  // Building glass door
  { pixelX: 35.5 * TILE_SIZE, pixelY: 20 * TILE_SIZE, radius: 30, color: 0x0e3388, glow: true, animation: 'pulse' },

  // Car headlights — beams project left from tile 39. Start 5% into the tile.
  // Small glow at the headlight source so the cone doesn't emerge from darkness.
  { pixelX: 39 * TILE_SIZE + 1, pixelY: 21.5 * TILE_SIZE + 8, radius: 10, color: 0x665533 },
  { pixelX: 39 * TILE_SIZE + 1, pixelY: 22.5 * TILE_SIZE, radius: 10, color: 0x665533 },
  {
    pixelX: 39 * TILE_SIZE + 1,
    pixelY: 21.5 * TILE_SIZE + 8,
    radius: 20,
    color: 0xffeecc,
    cone: 'headlight',
    animation: 'flicker',
  },
  {
    pixelX: 39 * TILE_SIZE + 1,
    pixelY: 22.5 * TILE_SIZE,
    radius: 20,
    color: 0xffeecc,
    cone: 'headlight',
    animation: 'flicker',
  },

  // Additional ambient lights
  { pixelX: 39 * TILE_SIZE, pixelY: 9 * TILE_SIZE, radius: 96, color: 0xffeedd },
  { pixelX: 17 * TILE_SIZE, pixelY: 12 * TILE_SIZE, radius: 96, color: 0xffeedd },
  { pixelX: 20 * TILE_SIZE, pixelY: 22 * TILE_SIZE, radius: 48, color: 0xffeedd },
  { pixelX: 16 * TILE_SIZE, pixelY: 4 * TILE_SIZE, radius: 64, color: 0xffeedd },
]

export class LightingOverlay {
  private scene: Phaser.Scene
  private renderTexture: Phaser.GameObjects.RenderTexture
  // NOTE: Second layer with ADD blend for vibrant colored glows. MULTIPLY can
  // only darken, so colored lights look dim. ADD composites color on top of the
  // scene, producing bright, saturated light effects.
  private glowTexture: Phaser.GameObjects.RenderTexture
  private lightBrush: Phaser.GameObjects.Image
  private stageConeBrush: Phaser.GameObjects.Image
  private lampConeBrush: Phaser.GameObjects.Image
  private headlightConeBrush: Phaser.GameObjects.Image
  private player: Phaser.GameObjects.Sprite
  // NOTE: Each animated light gets a random phase offset so they don't
  // flicker/pulse in lockstep. Seeded once at construction time.
  private lightSeeds: number[]

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, player: Phaser.GameObjects.Sprite) {
    this.scene = scene
    this.player = player
    this.lightSeeds = FIXED_LIGHTS.map(() => Math.random() * 10000)

    _createLightTexture(scene, 'light-gradient', BRUSH_BASE_RADIUS)
    _createConeTexture(scene, 'stage-cone', _verticalConeSpec(STAGE_CONE_WIDTH, STAGE_CONE_HEIGHT, 0.3))
    // NOTE: Lamp cone has a much narrower tip (0.42 inset) to match the small lamp heads.
    _createConeTexture(scene, 'lamp-cone', _verticalConeSpec(LAMP_CONE_WIDTH, LAMP_CONE_HEIGHT, 0.42))
    // NOTE: Headlight cone is horizontal — narrow on right (headlight), wide on left.
    _createConeTexture(scene, 'headlight-cone', _horizontalConeSpec(HEADLIGHT_CONE_LENGTH, HEADLIGHT_CONE_SPREAD, 0.25))

    this.lightBrush = scene.make.image({ key: 'light-gradient', add: false })
    this.stageConeBrush = scene.make.image({ key: 'stage-cone', add: false })
    this.lampConeBrush = scene.make.image({ key: 'lamp-cone', add: false })
    this.headlightConeBrush = scene.make.image({ key: 'headlight-cone', add: false })
    // NOTE: Cone origin at top-center so it draws downward from the lamp source.
    this.stageConeBrush.setOrigin(0.5, 0)
    this.lampConeBrush.setOrigin(0.5, 0)
    // NOTE: Headlight origin at right-center so it draws leftward from the headlight.
    this.headlightConeBrush.setOrigin(1, 0.5)

    this.renderTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.renderTexture.setOrigin(0, 0)
    this.renderTexture.setBlendMode(Phaser.BlendModes.MULTIPLY)
    this.renderTexture.setDepth(DEPTH_LIGHTING)

    this.glowTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.glowTexture.setOrigin(0, 0)
    this.glowTexture.setBlendMode(Phaser.BlendModes.ADD)
    this.glowTexture.setDepth(DEPTH_LIGHTING + 1)

    // NOTE: Initial draw so the first frame isn't unlit.
    this.update()
  }

  update() {
    const time = this.scene.time.now

    this.renderTexture.clear()
    this.renderTexture.fill(AMBIENT_COLOR)

    // NOTE: Player light — white so it reveals the scene at full color.
    this.lightBrush.setTint(0xffffff)
    this.lightBrush.setScale(PLAYER_LIGHT_RADIUS / BRUSH_BASE_RADIUS)
    this.renderTexture.draw(this.lightBrush, this.player.x, this.player.y)

    this.glowTexture.clear()

    for (let index = 0; index < FIXED_LIGHTS.length; index++) {
      const light = FIXED_LIGHTS[index]
      const seed = this.lightSeeds[index]

      const { radiusScale, color } = _computeAnimation(light, time, seed, index)

      // NOTE: For cone lights, the circular pool sits at the end of the cone
      // (where the beam hits the ground/surface), not at the source.
      let poolX = light.pixelX
      let poolY = light.pixelY
      if (light.cone === 'headlight') {
        poolX -= HEADLIGHT_CONE_LENGTH
      } else if (light.cone === 'lamp') {
        poolY += LAMP_CONE_HEIGHT
      } else if (light.cone === 'stage') {
        poolY += STAGE_CONE_HEIGHT
      }

      const animatedRadius = light.radius * radiusScale
      this.lightBrush.setScale(animatedRadius / BRUSH_BASE_RADIUS)

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

      if (light.cone === 'headlight') {
        // NOTE: Headlight cone shimmer — modulate tint brightness without
        // scaling the shape. Keeps the beam rigid while the intensity wavers.
        const coneColor = _modulateBrightness(color, radiusScale)
        this.headlightConeBrush.setTint(coneColor)
        this.renderTexture.draw(this.headlightConeBrush, light.pixelX, light.pixelY)
      } else if (light.cone) {
        // NOTE: Cone starts half a tile below the raw coordinate (center of the
        // grid cell where the lamp head sits) and projects downward.
        const coneBrush = light.cone === 'lamp' ? this.lampConeBrush : this.stageConeBrush
        coneBrush.setTint(color)
        coneBrush.setScale(radiusScale)
        const angleRad = ((light.coneAngle ?? 0) * Math.PI) / 180
        coneBrush.setRotation(angleRad)
        this.renderTexture.draw(coneBrush, light.pixelX, light.pixelY + TILE_SIZE / 2)
        coneBrush.setRotation(0)
        coneBrush.setScale(1)
      }
    }
  }
}

function _createLightTexture(scene: Phaser.Scene, key: string, radius: number) {
  const diameter = radius * 2
  const canvasTexture = scene.textures.createCanvas(key, diameter, diameter)!
  const context = canvasTexture.getContext()

  // NOTE: Tight radial gradient — bright core holds full intensity to 30% radius,
  // then drops off steeply. Creates focused spotlight pools, not diffuse blobs.
  // Color tinting is applied per-light via setTint().
  const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.7)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, diameter, diameter)

  // NOTE: refresh() is required for WebGL to pick up the canvas changes.
  canvasTexture.refresh()
}

// NOTE: Unified cone texture creator. Takes four trapezoid vertices and a
// gradient definition (start/end points + stops). Both vertical cones (stage,
// lamp) and the horizontal headlight cone use this same pipeline: draw shape,
// apply gradient with shadow blur, refresh for WebGL.
interface ConeGradientStop {
  offset: number
  alpha: number
}

interface ConeSpec {
  width: number
  height: number
  // NOTE: Four vertices defining the trapezoid, in order for beginPath/lineTo.
  points: { x: number; y: number }[]
  gradientStart: { x: number; y: number }
  gradientEnd: { x: number; y: number }
  gradientStops: ConeGradientStop[]
}

function _createConeTexture(scene: Phaser.Scene, key: string, spec: ConeSpec) {
  const canvasTexture = scene.textures.createCanvas(key, spec.width, spec.height)!
  const context = canvasTexture.getContext()

  context.beginPath()
  context.moveTo(spec.points[0].x, spec.points[0].y)
  for (let index = 1; index < spec.points.length; index++) {
    context.lineTo(spec.points[index].x, spec.points[index].y)
  }
  context.closePath()

  const gradient = context.createLinearGradient(
    spec.gradientStart.x,
    spec.gradientStart.y,
    spec.gradientEnd.x,
    spec.gradientEnd.y,
  )
  for (const stop of spec.gradientStops) {
    gradient.addColorStop(stop.offset, `rgba(255, 255, 255, ${stop.alpha})`)
  }

  // NOTE: Shadow blur feathers the edges of the cone shape so it doesn't
  // have hard pixel boundaries.
  context.shadowColor = 'rgba(255, 255, 255, 0.4)'
  context.shadowBlur = 16

  context.fillStyle = gradient
  context.fill()

  canvasTexture.refresh()
}

function _verticalConeSpec(baseWidth: number, height: number, topInsetRatio: number): ConeSpec {
  // NOTE: Soft trapezoid cone beam — gentle taper from a narrow top to wide
  // bottom. topInsetRatio controls how narrow the tip is (higher = narrower).
  const topInset = baseWidth * topInsetRatio
  return {
    width: baseWidth,
    height,
    points: [
      { x: topInset, y: 0 },
      { x: baseWidth - topInset, y: 0 },
      { x: baseWidth, y: height },
      { x: 0, y: height },
    ],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 0, y: height },
    gradientStops: [
      { offset: 0, alpha: 0.45 },
      { offset: 0.3, alpha: 0.2 },
      { offset: 1, alpha: 0 },
    ],
  }
}

function _horizontalConeSpec(length: number, spread: number, tipInsetRatio: number): ConeSpec {
  // NOTE: Horizontal cone — narrow tip on the right (headlight source), wide
  // base on the left (where the beam spreads).
  const tipInset = spread * tipInsetRatio
  return {
    width: length,
    height: spread,
    points: [
      { x: length, y: tipInset },
      { x: length, y: spread - tipInset },
      { x: 0, y: spread },
      { x: 0, y: 0 },
    ],
    // NOTE: Gradient runs right to left — bright at the headlight, fading out.
    gradientStart: { x: length, y: 0 },
    gradientEnd: { x: 0, y: 0 },
    gradientStops: [
      { offset: 0, alpha: 0.5 },
      { offset: 0.3, alpha: 0.25 },
      { offset: 1, alpha: 0 },
    ],
  }
}

function _computeAnimation(
  light: FixedLight,
  time: number,
  seed: number,
  index: number,
): { radiusScale: number; color: number } {
  let radiusScale = 1
  let color = light.color

  if (light.animation === 'flicker') {
    // NOTE: Layer three sine waves at different frequencies for organic,
    // non-repeating jitter. The seed offsets each light's phase.
    const wave1 = Math.sin(time * FLICKER_SPEED_1 + seed)
    const wave2 = Math.sin(time * FLICKER_SPEED_2 + seed * 1.3)
    const wave3 = Math.sin(time * FLICKER_SPEED_3 + seed * 0.7)
    const combined = (wave1 + wave2 + wave3) / 3
    radiusScale = 1 + combined * FLICKER_AMPLITUDE

    // NOTE: Occasional deep dip when a slow wave peaks — simulates
    // the filament momentarily dimming.
    const slowWave = Math.sin(time * 0.003 + seed * 2.1)
    if (slowWave > FLICKER_DIP_THRESHOLD) {
      radiusScale -= FLICKER_DIP_AMOUNT
    }
  } else if (light.animation === 'pulse') {
    // NOTE: Slow sine breathing. Small phase offset per window so they
    // pulse in near-unison but not perfectly synced.
    const phase = seed * 0.3
    radiusScale = 1 + Math.sin(time * PULSE_SPEED + phase) * PULSE_AMPLITUDE
  } else if (light.animation === 'color-cycle') {
    // NOTE: Each spotlight starts at a different hue position (spread
    // evenly across the 6 lights by index) and rotates through the
    // full wheel over COLOR_CYCLE_PERIOD milliseconds.
    const hue = ((time / COLOR_CYCLE_PERIOD + index / 6) % 1) * 360
    color = _hslToHex(hue, 0.9, 0.55)
  }

  return { radiusScale, color }
}

// NOTE: Standard HSL-to-RGB conversion. Hue in degrees (0-360), saturation
// and lightness in 0-1 range. Returns a packed 0xRRGGBB hex number for
// use with Phaser's setTint().
function _hslToHex(hue: number, saturation: number, lightness: number): number {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const huePrime = hue / 60
  const secondary = chroma * (1 - Math.abs((huePrime % 2) - 1))
  let red = 0
  let green = 0
  let blue = 0

  if (huePrime < 1) {
    red = chroma
    green = secondary
  } else if (huePrime < 2) {
    red = secondary
    green = chroma
  } else if (huePrime < 3) {
    green = chroma
    blue = secondary
  } else if (huePrime < 4) {
    green = secondary
    blue = chroma
  } else if (huePrime < 5) {
    red = secondary
    blue = chroma
  } else {
    red = chroma
    blue = secondary
  }

  const lightnessMatch = lightness - chroma / 2
  const redByte = Math.round((red + lightnessMatch) * 255)
  const greenByte = Math.round((green + lightnessMatch) * 255)
  const blueByte = Math.round((blue + lightnessMatch) * 255)

  return (redByte << 16) | (greenByte << 8) | blueByte
}

// NOTE: Scales each RGB channel by a multiplier to brighten or dim a color
// without changing the hue. Used for cone shimmer so shape stays constant.
function _modulateBrightness(color: number, multiplier: number): number {
  const red = Math.min(255, Math.round(((color >> 16) & 0xff) * multiplier))
  const green = Math.min(255, Math.round(((color >> 8) & 0xff) * multiplier))
  const blue = Math.min(255, Math.round((color & 0xff) * multiplier))
  return (red << 16) | (green << 8) | blue
}
