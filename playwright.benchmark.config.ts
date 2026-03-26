import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './benchmark',
  use: {
    baseURL: 'http://localhost:8080',
    headless: false,
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
    reuseExistingServer: true,
  },
})
