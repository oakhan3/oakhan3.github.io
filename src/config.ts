export type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

export const GBA_WIDTH = 480
export const GBA_HEIGHT = 320
export const TILE_SIZE = 16
// NOTE: Matter.js velocity is in pixels per physics step (at 60fps baseline),
// not pixels per second like Arcade. 1.75 px/step ≈ 105 px/s at 60fps.
export const PLAYER_SPEED = 2
export const PLAYER_FRAME_WIDTH = 48
export const PLAYER_FRAME_HEIGHT = 48
