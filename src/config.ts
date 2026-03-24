export type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

// NOTE: Game Boy Advance screen resolution (2:3 aspect ratio).
export const GBA_WIDTH = 480
export const GBA_HEIGHT = 320

// NOTE: Tile size from the Tiny Realm asset pack — all tilesets use 16x16 tiles.
export const TILE_SIZE = 16

// NOTE: Matter.js velocity is in pixels per physics step (at 60fps baseline),
// not pixels per second like Arcade. 2 px/step ≈ 120 px/s at 60fps.
export const PLAYER_SPEED = 2

// NOTE: Player spritesheet frames are 48x48 (3x tile size) to allow detail
// on a character that occupies roughly one tile of space.
export const PLAYER_FRAME_WIDTH = 48
export const PLAYER_FRAME_HEIGHT = 48

// NOTE: Depth layers control draw order. Higher values render on top.
export const DEPTH_PLAYER = 5
export const DEPTH_JOYSTICK_BASE = 90
export const DEPTH_JOYSTICK_KNOB = 91
// NOTE: Lighting overlay sits above game objects but below UI elements.
export const DEPTH_LIGHTING = 50
export const DEPTH_DIALOG = 100

// NOTE: Minimum drag distance (in game pixels) before a touch is treated as
// a drag rather than a tap. Used by both TouchControls and InteractionSystem.
export const TOUCH_DEADZONE = 4
