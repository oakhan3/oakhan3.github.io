import Phaser from 'phaser'

// NOTE: Shared light brush texture radius. All lights use the same gradient
// texture, scaled via setScale on the brush image before drawing.
export const BRUSH_BASE_RADIUS_PX = 80

export interface ConeGradientStop {
  offset: number
  alpha: number
}

// NOTE: Unified cone texture spec. Four trapezoid vertices plus gradient
// definition (start/end points + stops). Both vertical cones (stage, lamp)
// and the horizontal headlight cone use the same pipeline.
export interface ConeSpec {
  width: number
  height: number
  // NOTE: Four vertices defining the trapezoid, in order for beginPath/lineTo.
  points: { x: number; y: number }[]
  gradientStart: { x: number; y: number }
  gradientEnd: { x: number; y: number }
  gradientStops: ConeGradientStop[]
}

export function verticalConeSpec(baseWidth: number, height: number, topInsetRatio: number): ConeSpec {
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

export function horizontalConeSpec(length: number, spread: number, tipInsetRatio: number): ConeSpec {
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

export function createLightTexture(scene: Phaser.Scene, key: string, radius: number) {
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

export function createConeTexture(scene: Phaser.Scene, key: string, spec: ConeSpec) {
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
