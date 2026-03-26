export type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

// NOTE: Game Boy Advance screen resolution (2:3 aspect ratio).
export const GBA_WIDTH = 480
export const GBA_HEIGHT = 320

// NOTE: Tile size from the Tiny Realm asset pack — all tilesets use 16x16 tiles.
export const TILE_SIZE = 16

// NOTE: Matter.js velocity is in pixels per physics step, not pixels per second like Arcade.
export const PLAYER_SPEED = 1.5

// NOTE: Player spritesheet frames are larger than one tile to allow detail
// on a character that occupies roughly one tile of space.
export const PLAYER_FRAME_WIDTH = 48
export const PLAYER_FRAME_HEIGHT = 48

export const DEPTH_PLAYER = 5
export const DEPTH_ABOVE_PLAYER = 6
export const DEPTH_JOYSTICK_BASE = 90
export const DEPTH_JOYSTICK_KNOB = 91
// NOTE: Lighting overlay sits above game objects but below UI elements.
// Sub-layers within the lighting range, in draw order (lower = drawn first):
//   DEPTH_SPOTLIGHT_GLOW — ADD-blended colored glow on top of the spotlight MULTIPLY mask
//   DEPTH_SPARKLE        — drifting sparkle particles
//   DEPTH_LIGHTNING      — procedural lightning bolt
export const DEPTH_LIGHTING = 50
export const DEPTH_SPOTLIGHT_GLOW = DEPTH_LIGHTING + 1
export const DEPTH_SPARKLE = DEPTH_LIGHTING + 2
export const DEPTH_LIGHTNING = DEPTH_LIGHTING + 3
export const DEPTH_DIALOG = 100
// NOTE: Quest UI (banner, overlay, icon) renders above all other UI.
export const DEPTH_QUEST_UI = 110

// NOTE: Minimum drag distance (in game pixels) before a touch is treated as
// a drag rather than a tap. Used by both TouchControls and InteractionSystem.
export const TOUCH_DEADZONE_PX = 4

// NOTE: Extra top offset on mobile to avoid UI elements being clipped by the
// browser chrome or notch area.
export const MOBILE_UI_TOP_OFFSET_PX = 70

export const UI_BACKGROUND_COLOR = 0x1a1b2e
export const UI_BORDER_COLOR = 0xe2e8f0
export const UI_FONT_FAMILY = '"Press Start 2P"'

export const UI_TEXT_COLOR = '#e2e8f0'
export const UI_SUCCESS_COLOR = '#86efac'
export const UI_MUTED_COLOR = '#94a3b8'
export const UI_HINT_COLOR = '#64748b'
export const UI_LINK_COLOR = '#60a5fa'

// NOTE: Alpha and padding for compact chrome UI (dialog box, completion banner).
// These intentionally differ from BACKGROUND_ALPHA / BOX_PADDING_PX in quests/constants.ts,
// which are for full-screen overlays.
export const UI_CHROME_ALPHA = 0.92
export const UI_CHROME_PADDING_PX = 10

export const UI_TEXT_LINE_SPACING_PX = 6

// NOTE: Quest button colors and layout — distinct from the general UI palette.
export const QUEST_BTN_BACKGROUND_COLOR = 0x1e3a5f
export const QUEST_BTN_BORDER_COLOR = 0xf97316
export const QUEST_BTN_MARGIN_PX = 8
// NOTE: Extra hit-area padding applied on mobile so the small button is easy to tap.
// Applied via setPadding(), which enlarges the text canvas — the label position is
// offset by the same amount so the text stays visually centered.
export const QUEST_BTN_HIT_PADDING_X_PX = 28
export const QUEST_BTN_HIT_PADDING_Y_PX = 20

// NOTE: Approximate rendered height of one text row in the dialog box (font height +
// vertical buffer). Used to vertically position the link button inside the box.
// Tuned visually for "Press Start 2P" at the dialog font sizes.
export const DIALOG_LINK_BTN_ROW_HEIGHT_MOBILE_PX = 17
export const DIALOG_LINK_BTN_ROW_HEIGHT_DESKTOP_PX = 10

// NOTE: Returns true when the viewport is phone-width. Use this everywhere
// instead of inlining the threshold, so the breakpoint is defined once.
export const isMobile = (): boolean => window.innerWidth < 768
