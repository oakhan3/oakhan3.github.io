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

// NOTE: Cone beam dimensions. The cone projects downward from the lamp source.
// Width is how wide the beam spreads at the bottom, height is how far it reaches.
const CONE_BASE_WIDTH = 48
const CONE_HEIGHT = 64

interface FixedLight {
  pixelX: number
  pixelY: number
  radius: number
  color: number
  cone?: boolean
}

// NOTE: Tile coords x TILE_SIZE = pixel coords. Spotlights are placed a few
// tiles below the gem sources so the light pools onto the stage surface.
const FIXED_LIGHTS: FixedLight[] = [
  // Stage spotlights — gems along row 0, beams project down onto stage
  { pixelX: 25 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 70, color: 0xff4444, cone: true },
  { pixelX: 26 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 70, color: 0xffff44, cone: true },
  { pixelX: 27 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 70, color: 0x44ff44, cone: true },
  { pixelX: 28 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 70, color: 0x4444ff, cone: true },
  { pixelX: 29 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 70, color: 0xaa44ff, cone: true },
  { pixelX: 30 * TILE_SIZE, pixelY: 0 * TILE_SIZE, radius: 70, color: 0xff44aa, cone: true },

  // Lamps — center of island
  { pixelX: 26 * TILE_SIZE, pixelY: 9 * TILE_SIZE, radius: 35, color: 0xffdd66, cone: true },
  { pixelX: 29 * TILE_SIZE, pixelY: 9 * TILE_SIZE, radius: 35, color: 0xffdd66, cone: true },

  // Campfire between trees
  { pixelX: 14 * TILE_SIZE, pixelY: 13 * TILE_SIZE, radius: 60, color: 0xffaa44 },

  // Large building entrance
  { pixelX: 33 * TILE_SIZE, pixelY: 16 * TILE_SIZE, radius: 70, color: 0xccddff },

  // Large building windows
  { pixelX: 35 * TILE_SIZE, pixelY: 13 * TILE_SIZE, radius: 60, color: 0xffdd88 },

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
  private coneBrush: Phaser.GameObjects.Image
  private player: Phaser.GameObjects.Sprite

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, player: Phaser.GameObjects.Sprite) {
    this.player = player

    _createLightTexture(scene, 'light-gradient', BRUSH_BASE_RADIUS)
    _createConeTexture(scene, 'cone-gradient', CONE_BASE_WIDTH, CONE_HEIGHT)

    this.lightBrush = scene.make.image({ key: 'light-gradient', add: false })
    this.coneBrush = scene.make.image({ key: 'cone-gradient', add: false })
    // NOTE: Cone origin at top-center so it draws downward from the lamp source.
    this.coneBrush.setOrigin(0.5, 0)

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
      const poolY = light.cone ? light.pixelY + CONE_HEIGHT : light.pixelY
      this.lightBrush.setTint(light.color)
      this.lightBrush.setScale(light.radius / BRUSH_BASE_RADIUS)
      this.renderTexture.draw(this.lightBrush, light.pixelX, poolY)

      if (light.cone) {
        // NOTE: Cone starts half a tile below the raw coordinate (center of the
        // grid cell where the lamp head sits) and projects downward.
        this.coneBrush.setTint(light.color)
        this.renderTexture.draw(this.coneBrush, light.pixelX, light.pixelY + TILE_SIZE / 2)
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

function _createConeTexture(scene: Phaser.Scene, key: string, baseWidth: number, height: number) {
  const canvasTexture = scene.textures.createCanvas(key, baseWidth, height)!
  const context = canvasTexture.getContext()

  // NOTE: Trapezoid cone beam — narrow at the top (lamp source), wide at the
  // bottom (pool on the ground). Linear gradient fades from bright at top to
  // transparent at bottom so the beam dissolves into the circular pool.
  const topInset = baseWidth * 0.35
  context.beginPath()
  context.moveTo(topInset, 0)
  context.lineTo(baseWidth - topInset, 0)
  context.lineTo(baseWidth, height)
  context.lineTo(0, height)
  context.closePath()

  const gradient = context.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  context.fillStyle = gradient
  context.fill()

  canvasTexture.refresh()
}
