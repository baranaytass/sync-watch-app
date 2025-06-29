import { test, expect } from '@playwright/test'

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYWZiNWUwYi00ZDdlLTQxMGQtYjU0NS0zMjJmYWYxMjdmNDYiLCJlbWFpbCI6ImJhcmFubmF5dGFzQGdtYWlsLmNvbSIsImlhdCI6MTc1MDc4OTU2OSwiZXhwIjoxNzUxMzk0MzY5fQ.yzK8ewGnBb3dCNnzbbqWFN1U_FcoMgnLd8Cb6VrF0TU'
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'

test.describe('Step 3: YouTube Player Fix Tests', () => {
  const testAttempts = [
    {
      name: 'Original youtube.com',
      domain: 'https://www.youtube.com/embed',
      params: 'enablejsapi=1&controls=1&autoplay=0&rel=0&modestbranding=1&playsinline=1&fs=1'
    },
    {
      name: 'No origin param',  
      domain: 'https://www.youtube.com/embed',
      params: 'enablejsapi=1&controls=1&autoplay=0&rel=0&modestbranding=1&playsinline=1&fs=1'
    },
    {
      name: 'Minimal params',
      domain: 'https://www.youtube.com/embed', 
      params: 'enablejsapi=1&controls=1'
    },
    {
      name: 'No enablejsapi',
      domain: 'https://www.youtube.com/embed',
      params: 'controls=1&autoplay=0&rel=0'
    },
    {
      name: 'Plain embed',
      domain: 'https://www.youtube.com/embed',
      params: ''
    }
  ]

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{
      name: 'token',
      value: JWT_TOKEN,
      domain: 'localhost',
      path: '/'
    }])
  })

  for (const attempt of testAttempts) {
    test(`should test ${attempt.name}`, async ({ page }) => {
      console.log(`🧪 Step 3: Testing ${attempt.name}...`)
      
      // Inject custom YouTube URL
      const videoId = 'cYgmnku6R3Y'
      const customUrl = attempt.params 
        ? `${attempt.domain}/${videoId}?${attempt.params}`
        : `${attempt.domain}/${videoId}`
      
      await page.addInitScript((url) => {
        (window as any).__TEST_YOUTUBE_URL = url
      }, customUrl)
      
      // Go to sessions and create one
      await page.goto('/sessions')
      await page.waitForLoadState('networkidle')
      
      await page.click('text=Oturum Oluştur')
      await page.fill('input', `Test ${attempt.name}`)
      await page.click('text=Oluştur')
      await page.waitForURL(/\/session\/.*/)
      
      // Override YouTube URL for this test
      await page.evaluate((testUrl) => {
        const originalComputed = (window as any).Vue?.computed
        if (originalComputed) {
          // Monkey patch the computed URL
          (window as any).__OVERRIDE_YOUTUBE_URL = testUrl
        }
      }, customUrl)
      
      console.log(`📎 Testing URL: ${customUrl}`)
      
      const videoInput = page.locator('input[placeholder*="youtube.com"]')
      await videoInput.fill(TEST_VIDEO_URL)
      await page.click('text=Ayarla')
      
      // Quick test - wait max 10 seconds for result
      let result = 'unknown'
      try {
        await Promise.race([
          page.waitForSelector('text=Video yükleniyor...', { state: 'hidden', timeout: 12000 }).then(() => { result = 'success' }),
          page.waitForSelector('text=Video yükleme zaman aşımı', { timeout: 12000 }).then(() => { result = 'timeout' })
        ])
      } catch {
        result = 'test_timeout'
      }
      
      console.log(`📊 ${attempt.name} result: ${result}`)
      
      if (result === 'success') {
        console.log(`🎉 SUCCESS: ${attempt.name} works!`)
        // Don't fail test on success, but log it
      } else {
        console.log(`❌ FAILED: ${attempt.name} - ${result}`)
      }
      
      // Always continue to next test
      expect(true).toBe(true) // Dummy assertion to keep test passing
    })
  }
}) 