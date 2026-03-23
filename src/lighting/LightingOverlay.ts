import Phaser from 'phaser'
import { DEPTH_LIGHTING, TILE_SIZE } from '../config'

// NOTE: Dark blue-black ambient color for nighttime. With MULTIPLY blend mode,
// dark pixels darken the scene and bright pixels leave it unchanged. Drawing
// colored circles onto this dark fill creates tinted light effects.
const AMBIENT_COLOR = 0x111133

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
const LAMP_CONE_HEIGHT = 56

interface FixedLight {
  pixelX: number
  pixelY: number
  radius: number
  color: number
  cone?: 'stage' | 'lamp'
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
  // lamp head sprite (left lamp +3px right, right lamp +8px right).
  { pixelX: 26 * TILE_SIZE + 3, pixelY: 9 * TILE_SIZE + 3, radius: 35, color: 0xffdd66, cone: 'lamp' },
  { pixelX: 29 * TILE_SIZE + 12, pixelY: 9 * TILE_SIZE + 3, radius: 35, color: 0xffdd66, cone: 'lamp' },

  // Campfire between trees
  { pixelX: 14 * TILE_SIZE, pixelY: 13 * TILE_SIZE, radius: 60, color: 0xffaa44 },

  // Building windows — blue glow across the window area (33.5,16) to (37.5,19)
  { pixelX: 34.5 * TILE_SIZE, pixelY: 17 * TILE_SIZE, radius: 40, color: 0x6688ff },
  { pixelX: 36.5 * TILE_SIZE, pixelY: 17 * TILE_SIZE, radius: 40, color: 0x6688ff },
  { pixelX: 34.5 * TILE_SIZE, pixelY: 18.5 * TILE_SIZE, radius: 40, color: 0x6688ff },
  { pixelX: 36.5 * TILE_SIZE, pixelY: 18.5 * TILE_SIZE, radius: 40, color: 0x6688ff },
  // Building glass door
  { pixelX: 35.5 * TILE_SIZE, pixelY: 20 * TILE_SIZE, radius: 30, color: 0x6688ff },

  // Beach umbrella (red/white)
  { pixelX: 20 * TILE_SIZE, pixelY: 22 * TILE_SIZE, radius: 40, color: 0xffeedd },

  // Beach umbrella (blue)
  { pixelX: 18 * TILE_SIZE, pixelY: 25 * TILE_SIZE, radius: 40, color: 0xffeedd },

  // Cave/mine entrance
  { pixelX: 12 * TILE_SIZE, pixelY: 5 * TILE_SIZE, radius: 50, color: 0xcc8844 },

  // Statues
  { pixelX: 10 * TILE_SIZE, pixelY: 15 * TILE_SIZE, radius: 40, color: 0x8888ff },

  // Beach sign
  { pixelX: 14 * TILE_SIZE, pixelY: 22 * TILE_SIZE, radius: 30, color: 0xffeedd },
]

export class LightingOverlay {
  private renderTexture: Phaser.GameObjects.RenderTexture
  private lightBrush: Phaser.GameObjects.Image
  private stageConeBrush: Phaser.GameObjects.Image
  private lampConeBrush: Phaser.GameObjects.Image
  private player: Phaser.GameObjects.Sprite

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, player: Phaser.GameObjects.Sprite) {
    this.player = player

    _createLightTexture(scene, 'light-gradient', BRUSH_BASE_RADIUS)
    _createConeTexture(scene, 'stage-cone', STAGE_CONE_WIDTH, STAGE_CONE_HEIGHT, 0.3)
    // NOTE: Lamp cone has a much narrower tip (0.42 inset) to match the small lamp heads.
    _createConeTexture(scene, 'lamp-cone', LAMP_CONE_WIDTH, LAMP_CONE_HEIGHT, 0.42)

    this.lightBrush = scene.make.image({ key: 'light-gradient', add: false })
    this.stageConeBrush = scene.make.image({ key: 'stage-cone', add: false })
    this.lampConeBrush = scene.make.image({ key: 'lamp-cone', add: false })
    // NOTE: Cone origin at top-center so it draws downward from the lamp source.
    this.stageConeBrush.setOrigin(0.5, 0)
    this.lampConeBrush.setOrigin(0.5, 0)

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
      // NOTE: For cone lights, the circular pool sits at the bottom of the cone
      // (where the beam hits the ground), not at the lamp head.
      const coneHeight = light.cone === 'lamp' ? LAMP_CONE_HEIGHT : light.cone === 'stage' ? STAGE_CONE_HEIGHT : 0
      const poolY = light.cone ? light.pixelY + coneHeight : light.pixelY
      this.lightBrush.setTint(light.color)
      this.lightBrush.setScale(light.radius / BRUSH_BASE_RADIUS)
      this.renderTexture.draw(this.lightBrush, light.pixelX, poolY)

      if (light.cone) {
        // NOTE: Cone starts half a tile below the raw coordinate (center of the
        // grid cell where the lamp head sits) and projects downward.
        const coneBrush = light.cone === 'lamp' ? this.lampConeBrush : this.stageConeBrush
        coneBrush.setTint(light.color)
        this.renderTexture.draw(coneBrush, light.pixelX, light.pixelY + TILE_SIZE / 2)
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
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)')
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
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  // NOTE: Shadow blur feathers the edges of the cone shape so it doesn't
  // have hard pixel boundaries.
  context.shadowColor = 'rgba(255, 255, 255, 0.3)'
  context.shadowBlur = 10

  context.fillStyle = gradient
  context.fill()

  canvasTexture.refresh()
}
