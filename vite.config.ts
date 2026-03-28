import { execSync } from 'child_process'
import { defineConfig } from 'vite'

const gitSha = execSync('git rev-parse --short HEAD').toString().trim()

export default defineConfig({
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    port: 8080,
  },
})
