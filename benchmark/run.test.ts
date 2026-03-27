import { test } from '@playwright/test'

// NOTE: Not part of the standard test suite — run with:
//   npm run benchmark
// Launches a headed browser so GPU rendering is real.
// Prints frame-time and spotlight-update stats to the terminal.
// Use the output as a baseline before and after performance changes.

test('measure frame and spotlight times during movement', async ({ page }) => {
  await page.goto('/?benchmark')
  await page.locator('canvas').waitFor({ state: 'visible' })
  await page.waitForFunction(() => document.fonts.check('8px "Press Start 2P"'))
  // NOTE: 4x CPU throttle approximates a mid-range Android device.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 16 })

  // NOTE: Click to advance from BootScene through PreloadScene to OverworldScene.
  await page.locator('canvas').click()
  await page.waitForFunction(() => (window as any).__benchmark?.isReady === true, { timeout: 20000 })

  // Dismiss welcome dialog: first Space rushes the typewriter, second closes it.
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  // Quest overlay appears after dialog closes — dismiss it.
  await page.keyboard.press('Space')
  await page.waitForTimeout(500)

  // Reset arrays immediately before the measurement window.
  await page.evaluate(() => {
    ;(window as any).__frameTimes = []
    ;(window as any).__spotlightTimes = []
    ;(window as any).__benchmark._lastFrameTime = undefined
  })

  // Hold right arrow for 5 seconds to simulate sustained movement.
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(5000)
  await page.keyboard.up('ArrowRight')

  const { frameTimes, spotlightTimes } = await page.evaluate(() => ({
    frameTimes: (window as any).__frameTimes as number[],
    spotlightTimes: (window as any).__spotlightTimes as number[],
  }))

  console.log(_formatStats('Frame times (ms)', frameTimes))
  console.log(_formatStats('Spotlight update (ms)', spotlightTimes))
})

function _percentile(sorted: number[], p: number): number {
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

function _formatStats(label: string, values: number[]): string {
  if (values.length === 0) return `\n${label}: no data collected`
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const p50 = _percentile(sorted, 50)
  const p95 = _percentile(sorted, 95)
  const p99 = _percentile(sorted, 99)
  const worst = sorted[sorted.length - 1]
  const fps = mean > 0 ? (1000 / mean).toFixed(1) : 'N/A'
  return [
    `\n${label} over ${values.length} frames:`,
    `  mean   ${mean.toFixed(1)}ms   (${fps} fps)`,
    `  p50    ${p50.toFixed(1)}ms`,
    `  p95    ${p95.toFixed(1)}ms`,
    `  p99    ${p99.toFixed(1)}ms`,
    `  worst  ${worst.toFixed(1)}ms`,
  ].join('\n')
}
