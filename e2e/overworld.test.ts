import { test, expect, type Page } from '@playwright/test'

async function bootToOverworld(page: Page): Promise<void> {
  await page.goto('/?test')
  await page.locator('canvas').waitFor({ state: 'visible' })
  await page.waitForFunction(() => document.fonts.check('8px "Press Start 2P"'))
  // NOTE: Click to advance from BootScene through PreloadScene to OverworldScene.
  await page.locator('canvas').click()
  await page.waitForFunction(() => (window as any).__overworldTest?.isReady === true, { timeout: 15000 })
}

async function dismissDialog(page: Page): Promise<void> {
  await page.keyboard.press('Space')
}

test('welcome dialog', async ({ page }) => {
  await bootToOverworld(page)
  await expect(page.locator('canvas')).toHaveScreenshot()
})

test('quest overview', async ({ page }) => {
  await bootToOverworld(page)
  await dismissDialog(page)
  // NOTE: Quest overlay appears automatically after the welcome dialog closes.
  await expect(page.locator('canvas')).toHaveScreenshot()
})

test('sign interaction - dialog and completion banner', async ({ page }) => {
  await bootToOverworld(page)
  await dismissDialog(page)
  // NOTE: Dismiss the quest overlay so the world is visible before triggering an interaction.
  await page.keyboard.press('Space')
  await page.evaluate(() => (window as any).__overworldTest.interact('kiwi-sign'))
  await expect(page.locator('canvas')).toHaveScreenshot()
})

test('sign interaction - no banner on repeat', async ({ page }) => {
  await bootToOverworld(page)
  await dismissDialog(page)
  await page.keyboard.press('Space')
  // NOTE: First interaction completes the quest and shows the banner.
  await page.evaluate(() => (window as any).__overworldTest.interact('kiwi-sign'))
  await dismissDialog(page)
  // NOTE: Hide the banner from the first interaction before the second so it
  // does not appear in the screenshot. In TEST_MODE the banner has no fade-out
  // tween, so it must be hidden explicitly.
  await page.evaluate(() => (window as any).__overworldTest.hideBanner())
  // NOTE: Second interaction - quest already complete, no banner.
  await page.evaluate(() => (window as any).__overworldTest.interact('kiwi-sign'))
  await expect(page.locator('canvas')).toHaveScreenshot()
})

test('congratulatory overlay', async ({ page }) => {
  await bootToOverworld(page)
  await dismissDialog(page)
  await page.keyboard.press('Space')
  await page.evaluate(() => (window as any).__overworldTest.showCongratulatoryOverlay())
  await expect(page.locator('canvas')).toHaveScreenshot()
})

test('quest overlay with completed quest', async ({ page }) => {
  await bootToOverworld(page)
  await dismissDialog(page)
  await page.keyboard.press('Space')
  await page.evaluate(() => (window as any).__overworldTest.interact('kiwi-sign'))
  await dismissDialog(page)
  await page.evaluate(() => (window as any).__overworldTest.showQuestOverlay())
  await expect(page.locator('canvas')).toHaveScreenshot()
})
