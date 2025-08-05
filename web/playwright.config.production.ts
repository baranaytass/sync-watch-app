import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 3, // More retries for production
  workers: 1,
  maxFailures: 1,
  timeout: 180000, // 3 minutes timeout for production tests
  reporter: [['html', { open: 'never' }], ['list']],
  // No globalSetup for production tests
  use: {
    baseURL: 'https://sync-watch-frontend.onrender.com',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Increase timeouts for production
    actionTimeout: 30000,
    navigationTimeout: 30000,
    extraHTTPHeaders: {
      'User-Agent': 'Playwright-Production-Test'
    }
  },

  projects: [
    {
      name: 'production-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer for production tests - we test against live site
})