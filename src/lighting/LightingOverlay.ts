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

// NOTE: Stage cones are wider at the tip (big stage lights). Lamp cones have a
// narrow tip (small lamp heads) that flares out more.
const STAGE_CONE_WIDTH = 48
const STAGE_CONE_HEIGHT = 40
const LAMP_CONE_WIDTH = 32
const LAMP_CONE_HEIGHT = 40
// NOTE: Headlight cone projects horizontally to the left from the car.
const HEADLIGHT_CONE_LENGTH = 64
const HEADLIGHT_CONE_SPREAD = 16

interface FixedLight {
  pixelX: number
  pixelY: number
  radius: number
  color: number
  cone?: 'stage' | 'lamp' | 'headlight'
  // NOTE: Rotation in degrees applied to the cone. Positive = clockwise.
  coneAngle?: number
}

// NOTE: Tile coords x TILE_SIZE = pixel coords. Spotlights are placed a few
// tiles below the gem sources so the light pools onto the stage surface.
const FIXED_LIGHTS: FixedLight[] = [
  // Stage spotlights — gems along row 0, beams project down onto stage
  { pixelX: 25 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 30, color: 0xff4444, cone: 'stage' },
  { pixelX: 26 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 30, color: 0xffff44, cone: 'stage' },
  { pixelX: 27 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 30, color: 0x44ff44, cone: 'stage' },
  { pixelX: 28 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 30, color: 0x4444ff, cone: 'stage' },
  { pixelX: 29 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 30, color: 0xaa44ff, cone: 'stage' },
  { pixelX: 30 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 30, color: 0xff44aa, cone: 'stage' },

  // Lamps — center of island. Pixel offsets nudge the cone to align with the
  // lamp head sprite. Cones tilt 20 degrees inward (left tilts right, right tilts left).
  { pixelX: 26 * TILE_SIZE + 3, pixelY: 9 * TILE_SIZE + 3, radius: 51, color: 0xffe8a0, cone: 'lamp', coneAngle: -12 },
  { pixelX: 29 * TILE_SIZE + 12, pixelY: 9 * TILE_SIZE + 3, radius: 51, color: 0xffe8a0, cone: 'lamp', coneAngle: 12 },

  // Building windows — blue glow across the window area (33.5,16) to (37.5,19)
  { pixelX: 34.5 * TILE_SIZE, pixelY: 17 * TILE_SIZE, radius: 40, color: 0x44aaff },
  { pixelX: 36.5 * TILE_SIZE, pixelY: 17 * TILE_SIZE, radius: 40, color: 0x44aaff },
  { pixelX: 34.5 * TILE_SIZE, pixelY: 18.5 * TILE_SIZE, radius: 40, color: 0x44aaff },
  { pixelX: 36.5 * TILE_SIZE, pixelY: 18.5 * TILE_SIZE, radius: 40, color: 0x44aaff },
  // Building glass door
  { pixelX: 35.5 * TILE_SIZE, pixelY: 20 * TILE_SIZE, radius: 30, color: 0x44aaff },

  // Car headlights — beams project left from tile 39. Start 5% into the tile.
  { pixelX: 39 * TILE_SIZE + 1, pixelY: 21.5 * TILE_SIZE + 8, radius: 20, color: 0xffffff, cone: 'headlight' },
  { pixelX: 39 * TILE_SIZE + 1, pixelY: 22.5 * TILE_SIZE, radius: 20, color: 0xffffff, cone: 'headlight' },

  // Additional ambient lights
  { pixelX: 39 * TILE_SIZE, pixelY: 9 * TILE_SIZE, radius: 96, color: 0xffeedd },
  { pixelX: 17 * TILE_SIZE, pixelY: 12 * TILE_SIZE, radius: 96, color: 0xffeedd },
  { pixelX: 20 * TILE_SIZE, pixelY: 22 * TILE_SIZE, radius: 48, color: 0xffeedd },
  { pixelX: 16 * TILE_SIZE, pixelY: 4 * TILE_SIZE, radius: 64, color: 0xffeedd },
]

export class LightingOverlay {
  private renderTexture: Phaser.GameObjects.RenderTexture
  private lightBrush: Phaser.GameObjects.Image
  private stageConeBrush: Phaser.GameObjects.Image
  private lampConeBrush: Phaser.GameObjects.Image
  private headlightConeBrush: Phaser.GameObjects.Image
  private player: Phaser.GameObjects.Sprite

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, player: Phaser.GameObjects.Sprite) {
    this.player = player

    _createLightTexture(scene, 'light-gradient', BRUSH_BASE_RADIUS)
    _createConeTexture(scene, 'stage-cone', STAGE_CONE_WIDTH, STAGE_CONE_HEIGHT, 0.3)
    // NOTE: Lamp cone has a much narrower tip (0.42 inset) to match the small lamp heads.
    _createConeTexture(scene, 'lamp-cone', LAMP_CONE_WIDTH, LAMP_CONE_HEIGHT, 0.42)
    // NOTE: Headlight cone is horizontal — narrow on right (headlight), wide on left.
    _createHorizontalConeTexture(scene, 'headlight-cone', HEADLIGHT_CONE_LENGTH, HEADLIGHT_CONE_SPREAD, 0.25)

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

    // NOTE: Initial draw so the first frame isn't unlit.
    this.update()
  }

  update() {
    this.renderTexture.clear()
    this.renderTexture.fill(AMBIENT_COLOR)

    // NOTE: Player light — white so it reveals the scene at full color.
    this.lightBrush.setTint(0xffffff)
    this.lightBrush.setScale(PLAYER_LIGHT_RADIUS / BRUSH_BASE_RADIUS)
    this.renderTexture.draw(this.lightBrush, this.player.x, this.player.y)

    for (const light of FIXED_LIGHTS) {
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
      this.lightBrush.setTint(light.color)
      this.lightBrush.setScale(light.radius / BRUSH_BASE_RADIUS)
      this.renderTexture.draw(this.lightBrush, poolX, poolY)

      if (light.cone === 'headlight') {
        // NOTE: Headlight cone projects left from the source point.
        this.headlightConeBrush.setTint(light.color)
        this.renderTexture.draw(this.headlightConeBrush, light.pixelX, light.pixelY)
      } else if (light.cone) {
        // NOTE: Cone starts half a tile below the raw coordinate (center of the
        // grid cell where the lamp head sits) and projects downward.
        const coneBrush = light.cone === 'lamp' ? this.lampConeBrush : this.stageConeBrush
        coneBrush.setTint(light.color)
        const angleRad = ((light.coneAngle ?? 0) * Math.PI) / 180
        coneBrush.setRotation(angleRad)
        this.renderTexture.draw(coneBrush, light.pixelX, light.pixelY + TILE_SIZE / 2)
        coneBrush.setRotation(0)
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

function _createConeTexture(scene: Phaser.Scene, key: string, baseWidth: number, height: number, topInsetRatio: number) {
  const canvasTexture = scene.textures.createCanvas(key, baseWidth, height)!
  const context = canvasTexture.getContext()

  // NOTE: Soft trapezoid cone beam — gentle taper from a narrow top to wide
  // bottom. topInsetRatio controls how narrow the tip is (higher = narrower).
  // Uses shadow blur to feather edges smoothly into the surrounding darkness.
  const topInset = baseWidth * topInsetRatio
  context.beginPath()
  context.moveTo(topInset, 0)
  context.lineTo(baseWidth - topInset, 0)
  context.lineTo(baseWidth, height)
  context.lineTo(0, height)
  context.closePath()

  const gradient = context.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  // NOTE: Shadow blur feathers the edges of the cone shape so it doesn't
  // have hard pixel boundaries.
  context.shadowColor = 'rgba(255, 255, 255, 0.4)'
  context.shadowBlur = 16

  context.fillStyle = gradient
  context.fill()

  canvasTexture.refresh()
}

function _createHorizontalConeTexture(
  scene: Phaser.Scene,
  key: string,
  length: number,
  spread: number,
  tipInsetRatio: number,
) {
  const canvasTexture = scene.textures.createCanvas(key, length, spread)!
  const context = canvasTexture.getContext()

  // NOTE: Horizontal cone — narrow tip on the right (headlight source), wide
  // base on the left (where the beam spreads). tipInsetRatio controls how
  // narrow the tip is (higher = narrower).
  const tipInset = spread * tipInsetRatio
  context.beginPath()
  context.moveTo(length, tipInset)
  context.lineTo(length, spread - tipInset)
  context.lineTo(0, spread)
  context.lineTo(0, 0)
  context.closePath()

  // NOTE: Gradient runs right to left — bright at the headlight, fading out.
  const gradient = context.createLinearGradient(length, 0, 0, 0)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  context.shadowColor = 'rgba(255, 255, 255, 0.4)'
  context.shadowBlur = 16

  context.fillStyle = gradient
  context.fill()

  canvasTexture.refresh()
}
