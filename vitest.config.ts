import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  optimizeDeps: {
    exclude: ['playwright', '@playwright/test'],
  },
  test: {
    exclude: ['e2e/**', 'benchmark/**', 'node_modules/**'],
    testTimeout: 30000,
    coverage: {
      provider: 'istanbul',
    },
    browser: {
      enabled: true,
      instances: [{ browser: 'chromium', headless: true, provider: playwright() }],
    },
  },
})
