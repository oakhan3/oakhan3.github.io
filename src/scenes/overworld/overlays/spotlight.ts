import Phaser from 'phaser'
import { SpotlightOverlay, verticalConeSpec, horizontalConeSpec } from '../../../lib/overlay'
import type { SpotlightConfig } from '../../../lib/overlay'
import { TILE_SIZE } from '../../../config'

// NOTE: Dark blue-black ambient color for nighttime. With MULTIPLY blend mode,
// dark pixels darken the scene and bright pixels leave it unchanged. Drawing
// colored circles onto this dark fill creates tinted light effects.
const AMBIENT_COLOR = 0x334466

const PLAYER_LIGHT_RADIUS_PX = 80

// NOTE: Stage cones are wider at the tip (big stage lights). Lamp cones have a
// narrow tip (small lamp heads) that flares out more.
const STAGE_CONE_WIDTH_PX = 48
const STAGE_CONE_HEIGHT_PX = 40
const LAMP_CONE_WIDTH_PX = 32
const LAMP_CONE_HEIGHT_PX = 40
// NOTE: Headlight cone projects horizontally to the left from the car.
const HEADLIGHT_CONE_LENGTH_PX = 40
const HEADLIGHT_CONE_SPREAD_PX = 16

// NOTE: Shift all fixed lights by this many tiles when the map content has
// been offset from the original layout. Update when resizing the map.
const MAP_TILE_OFFSET = { x: 0, y: 10 }

// NOTE: Tile coords x TILE_SIZE = pixel coords. Spotlights are placed a few
// tiles below the gem sources so the light pools onto the stage surface.
const SPOTLIGHT_CONFIG: SpotlightConfig = {
  ambientColor: AMBIENT_COLOR,
  playerLightRadius: PLAYER_LIGHT_RADIUS_PX,
  coneTypes: {
    stage: {
      spec: verticalConeSpec(STAGE_CONE_WIDTH_PX, STAGE_CONE_HEIGHT_PX, 0.3),
      origin: { x: 0.5, y: 0 },
      sourceOffset: { x: 0, y: TILE_SIZE / 2 },
      poolOffset: { x: 0, y: STAGE_CONE_HEIGHT_PX },
      animationStyle: 'scale',
    },
    lamp: {
      spec: verticalConeSpec(LAMP_CONE_WIDTH_PX, LAMP_CONE_HEIGHT_PX, 0.42),
      origin: { x: 0.5, y: 0 },
      sourceOffset: { x: 0, y: TILE_SIZE / 2 },
      poolOffset: { x: 0, y: LAMP_CONE_HEIGHT_PX },
      animationStyle: 'scale',
    },
    headlight: {
      spec: horizontalConeSpec(HEADLIGHT_CONE_LENGTH_PX, HEADLIGHT_CONE_SPREAD_PX, 0.25),
      origin: { x: 1, y: 0.5 },
      sourceOffset: { x: 0, y: 0 },
      poolOffset: { x: -HEADLIGHT_CONE_LENGTH_PX, y: 0 },
      animationStyle: 'modulate',
    },
  },
  fixedLights: [
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
    {
      pixelX: 34.5 * TILE_SIZE,
      pixelY: 18.5 * TILE_SIZE,
      radius: 40,
      color: 0x0e3388,
      glow: true,
      animation: 'pulse',
    },
    {
      pixelX: 36.5 * TILE_SIZE,
      pixelY: 18.5 * TILE_SIZE,
      radius: 40,
      color: 0x0e3388,
      glow: true,
      animation: 'pulse',
    },
    // Building glass door
    { pixelX: 35.5 * TILE_SIZE, pixelY: 20 * TILE_SIZE, radius: 30, color: 0x0e3388, glow: true, animation: 'pulse' },

    // Car headlights — beams project left from tile 39. Start 5% into the tile.
    // Bright bulb at headlight source.
    { pixelX: 39 * TILE_SIZE + 5, pixelY: 20.5 * TILE_SIZE + 10, radius: 3, color: 0xffffff, glow: true },
    { pixelX: 39 * TILE_SIZE + 5, pixelY: 21.5 * TILE_SIZE + 1, radius: 3, color: 0xffffff, glow: true },
    {
      pixelX: 39 * TILE_SIZE + 5,
      pixelY: 20.5 * TILE_SIZE + 12,
      radius: 20,
      color: 0xffeecc,
      cone: 'headlight',
      animation: 'flicker',
    },
    {
      pixelX: 39 * TILE_SIZE + 5,
      pixelY: 21.5 * TILE_SIZE,
      radius: 20,
      color: 0xffeecc,
      cone: 'headlight',
      animation: 'flicker',
    },

    // Car tail lights — small red glow at the right edge of the car.
    {
      pixelX: 42 * TILE_SIZE - 5,
      pixelY: 20.5 * TILE_SIZE + 12,
      radius: 12,
      color: 0xdd1111,
      glow: true,
      animation: 'flicker',
    },
    {
      pixelX: 42 * TILE_SIZE - 5,
      pixelY: 21.5 * TILE_SIZE,
      radius: 12,
      color: 0xdd1111,
      glow: true,
      animation: 'flicker',
    },

    // Red glow dot at tile 16,3.
    {
      pixelX: 16.5 * TILE_SIZE,
      pixelY: 3.5 * TILE_SIZE,
      radius: 10,
      color: 0xff0000,
      glow: true,
      animation: 'flicker',
    },

    // Fairy lights — tight concentrated glows with lamp-style flicker.
    {
      pixelX: 15.5 * TILE_SIZE,
      pixelY: 11.5 * TILE_SIZE,
      radius: 4,
      color: 0xffffff,
      glow: true,
      animation: 'flicker',
    },
    {
      pixelX: 19.5 * TILE_SIZE,
      pixelY: 11.5 * TILE_SIZE,
      radius: 4,
      color: 0xffffff,
      glow: true,
      animation: 'flicker',
    },
    {
      pixelX: 21.5 * TILE_SIZE,
      pixelY: 24.5 * TILE_SIZE,
      radius: 4,
      color: 0xffffff,
      glow: true,
      animation: 'flicker',
    },
    {
      pixelX: 18.5 * TILE_SIZE,
      pixelY: 21.5 * TILE_SIZE,
      radius: 4,
      color: 0xffffff,
      glow: true,
      animation: 'flicker',
    },
    {
      pixelX: 13.5 * TILE_SIZE,
      pixelY: 23.5 * TILE_SIZE,
      radius: 4,
      color: 0xffffff,
      glow: true,
      animation: 'flicker',
    },

    // Additional ambient lights
    { pixelX: 39 * TILE_SIZE, pixelY: 9 * TILE_SIZE, radius: 96, color: 0xffeedd },
    { pixelX: 17 * TILE_SIZE, pixelY: 12 * TILE_SIZE, radius: 96, color: 0xffeedd },
    { pixelX: 20 * TILE_SIZE, pixelY: 22 * TILE_SIZE, radius: 48, color: 0xffeedd },
  ],
}

export function createSpotlightOverlay(
  scene: Phaser.Scene,
  mapWidth: number,
  mapHeight: number,
  player: Phaser.GameObjects.Sprite,
): SpotlightOverlay {
  const offsetX = MAP_TILE_OFFSET.x * TILE_SIZE
  const offsetY = MAP_TILE_OFFSET.y * TILE_SIZE
  const config: SpotlightConfig = {
    ...SPOTLIGHT_CONFIG,
    fixedLights: SPOTLIGHT_CONFIG.fixedLights.map((light) => ({
      ...light,
      pixelX: light.pixelX + offsetX,
      pixelY: light.pixelY + offsetY,
    })),
  }
  return new SpotlightOverlay(scene, mapWidth, mapHeight, player, config)
}
