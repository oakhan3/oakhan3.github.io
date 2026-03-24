import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    testTimeout: 5000,
    coverage: {
      provider: 'istanbul',
    },
    browser: {
      enabled: true,
      instances: [{ browser: 'chromium', headless: true, provider: playwright() }],
    },
  },
})
