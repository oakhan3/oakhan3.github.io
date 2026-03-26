import { test, expect } from '@playwright/test'

test('boot screen', async ({ page }) => {
  await page.goto('/?test')
  const canvas = page.locator('canvas')
  await canvas.waitFor({ state: 'visible' })
  // NOTE: Wait for the font to load before screenshotting, otherwise Phaser
  // may render the title text with a fallback font.
  await page.waitForFunction(() => document.fonts.check('8px "Press Start 2P"'))
  await expect(canvas).toHaveScreenshot('boot-screen.png', { maxDiffPixelRatio: 0.02 })
})
