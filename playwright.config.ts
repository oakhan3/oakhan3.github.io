import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // NOTE: Remove platform from snapshot path so baselines committed on macOS
  // also match on Linux CI. Pixel art on a canvas is deterministic enough to
  // share one baseline, with a small threshold to absorb any minor differences.
  snapshotPathTemplate: '{testDir}/snapshots/{testName}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
  },
  use: {
    baseURL: 'http://localhost:8080',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
})
