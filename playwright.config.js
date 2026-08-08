import { defineConfig, devices } from '@playwright/test'

// Node isn't on PATH on this machine (portable install), so we can't rely on a
// bare `vite`/`node` in the dev-server command. `process.execPath` IS the portable
// node currently running Playwright — use it to launch Vite's JS entry directly.
const NODE = process.execPath

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `"${NODE}" node_modules/vite/bin/vite.js --port 5173 --strictPort`,
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
