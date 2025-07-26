import { defineConfig, devices } from '@playwright/test'

/**
 * Integration Test Configuration
 * Tests run against real backend services (Docker or local)
 */
export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  maxFailures: 1,
  timeout: 60000, // Longer timeout for integration tests
  expect: {
    timeout: 10000
  },
  reporter: [
    ['list', { printSteps: false }],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/integration-results.json' }]
  ],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure', 
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start dev server - tests run against real backend
  // Backend should be running via Docker Compose
  globalSetup: './tests/integration/global.setup.ts',
  globalTeardown: './tests/integration/global.teardown.ts'
}) 