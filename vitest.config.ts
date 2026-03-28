import { execSync } from 'child_process'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const gitSha = execSync('git rev-parse --short HEAD').toString().trim()

export default defineConfig({
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
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
