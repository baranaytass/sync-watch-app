import { request } from '@playwright/test'

/**
 * Playwright global setup.
 *
 * Performs a simple health-check against the backend service **before** any tests start.
 * If the backend is unreachable after several retries, the test run exits immediately
 * with a non-zero code so CI can fail fast.
 */
export default async function globalSetup() {
  const backendBaseURL = process.env.BACKEND_BASE_URL ?? (process.env.BASE_URL?.includes('onrender.com') ? 'https://sync-watch-backend.onrender.com' : 'http://localhost:3000')
  // We purposefully hit the root path – any HTTP response means the server is up.
  // A 404 is acceptable because we only care about reachability, not specific route.
  const healthURL = backendBaseURL + (backendBaseURL.includes('onrender.com') ? '' : '/health')

  console.log(`🌡️  Backend health check -> ${healthURL}`)

  const requestContext = await request.newContext()
  const maxAttempts = 5
  const delayMs = 1000

  let healthy = false
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await requestContext.get(healthURL, { timeout: 30000 })
      const status = response.status()
      if (status < 500) {
        console.log(`✅ Backend reachable (status: ${status}) on attempt #${attempt}`)
        healthy = true
        break
      }
      console.warn(`⚠️  Attempt #${attempt} responded with status ${status}`)
    } catch (err: unknown) {
      console.warn(`⚠️  Attempt #${attempt} failed: ${(err as Error).message}`)
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }

  await requestContext.dispose()

  if (!healthy) {
    console.error(`❌ Backend health check failed after ${maxAttempts} attempts. Aborting tests.`)
    process.exit(1)
  }
} 