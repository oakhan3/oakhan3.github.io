import { FixedLight } from './SpotlightOverlay'

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

export function _computeAnimation(
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

// NOTE: Scales each RGB channel by a multiplier to brighten or dim a color
// without changing the hue. Used for cone shimmer so shape stays constant.
export function _modulateBrightness(color: number, multiplier: number): number {
  const red = Math.min(255, Math.round(((color >> 16) & 0xff) * multiplier))
  const green = Math.min(255, Math.round(((color >> 8) & 0xff) * multiplier))
  const blue = Math.min(255, Math.round((color & 0xff) * multiplier))
  return (red << 16) | (green << 8) | blue
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
