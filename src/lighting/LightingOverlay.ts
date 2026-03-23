import Phaser from 'phaser'
import { DEPTH_LIGHTING } from '../config'

// NOTE: Dark blue-black ambient color for nighttime. The overlay is filled with
// this color at partial alpha, then light circles are erased to create
// transparent holes where the scene shows through at full brightness.
const AMBIENT_COLOR = 0x111133
const AMBIENT_ALPHA = 0.85

// NOTE: Player light radius in pixels. This is the radius of the soft gradient
// circle drawn around the player each frame.
const PLAYER_LIGHT_RADIUS = 80

export class LightingOverlay {
  private renderTexture: Phaser.GameObjects.RenderTexture
  private lightBrush: Phaser.GameObjects.Image
  private player: Phaser.GameObjects.Sprite

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number, player: Phaser.GameObjects.Sprite) {
    this.player = player

    _createLightTexture(scene, 'player-light', PLAYER_LIGHT_RADIUS)

    this.lightBrush = scene.make.image({ key: 'player-light', add: false })

    this.renderTexture = scene.add.renderTexture(0, 0, mapWidth, mapHeight)
    this.renderTexture.setOrigin(0, 0)
    this.renderTexture.setDepth(DEPTH_LIGHTING)

    // NOTE: Initial draw so the first frame isn't unlit.
    this.update()
  }

  update() {
    this.renderTexture.clear()
    this.renderTexture.fill(AMBIENT_COLOR, AMBIENT_ALPHA)
    this.renderTexture.erase(this.lightBrush, this.player.x, this.player.y)
  }
}

function _createLightTexture(scene: Phaser.Scene, key: string, radius: number) {
  const diameter = radius * 2
  const canvasTexture = scene.textures.createCanvas(key, diameter, diameter)!
  const context = canvasTexture.getContext()

  // NOTE: Radial gradient from fully opaque white at center to fully transparent
  // at the edge. When erased from the dark overlay, this creates a soft falloff.
  const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, diameter, diameter)

  // NOTE: refresh() is required for WebGL to pick up the canvas changes.
  canvasTexture.refresh()
}
