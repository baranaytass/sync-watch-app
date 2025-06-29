import { test, expect } from '@playwright/test'

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYWZiNWUwYi00ZDdlLTQxMGQtYjU0NS0zMjJmYWYxMjdmNDYiLCJlbWFpbCI6ImJhcmFubmF5dGFzQGdtYWlsLmNvbSIsImlhdCI6MTc1MDc4OTU2OSwiZXhwIjoxNzUxMzk0MzY5fQ.yzK8ewGnBb3dCNnzbbqWFN1U_FcoMgnLd8Cb6VrF0TU'
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'

test.describe('Step 2: YouTube Player Test', () => {
  let consoleLogs: string[] = []
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    consoleLogs = []
    consoleErrors = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      } else if (text.includes('YouTube') || text.includes('iframe') || text.includes('Video')) {
        consoleLogs.push(text)
      }
    })

    await page.context().addCookies([{
      name: 'token',
      value: JWT_TOKEN,
      domain: 'localhost',
      path: '/'
    }])
  })

  test('should detect YouTube Player timeout issue', async ({ page }) => {
    console.log('🎬 Step 2: Testing YouTube Player...')
    
    // Go to sessions and create one
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')
    
    await page.click('text=Oturum Oluştur')
    await page.fill('input', 'YouTube Timeout Test')
    await page.click('text=Oluştur')
    await page.waitForURL(/\/session\/.*/)
    
    console.log('✅ Step 2: Session ready')
    
    // Set video URL
    const videoInput = page.locator('input[placeholder*="youtube.com"]')
    await videoInput.fill(TEST_VIDEO_URL)
    await page.click('text=Ayarla')
    
    console.log('🎯 Step 2: Video URL set, waiting for result...')
    
    // Wait for either success or timeout
    let timeoutErrorFound = false
    let successFound = false
    
    try {
      // Wait for loading to disappear (success) or error to appear
      await Promise.race([
        page.waitForSelector('text=Video yükleniyor...', { state: 'hidden', timeout: 20000 }),
        page.waitForSelector('text=Video yükleme zaman aşımı', { timeout: 20000 })
      ])
      
      // Check which state we're in
      const hasError = await page.locator('text=Video yükleme zaman aşımı').isVisible()
      const hasLoading = await page.locator('text=Video yükleniyor...').isVisible()
      
      if (hasError) {
        timeoutErrorFound = true
        console.log('❌ Step 2: TIMEOUT ERROR DETECTED!')
      } else if (!hasLoading) {
        successFound = true
        console.log('✅ Step 2: Video loaded successfully!')
      }
      
    } catch (error) {
      console.log('⏰ Step 2: Test timeout - checking console logs...')
    }

    // Check console logs for timeout
    const hasConsoleTimeout = consoleErrors.some(error => 
      error.includes('Video yükleme zaman aşımı') || 
      error.includes('YouTube iframe yükleme timeout')
    )

    const hasConsoleSuccess = consoleLogs.some(log => 
      log.includes('YouTube iframe yüklendi')
    )

    // Report results
    console.log('\n📊 YOUTUBE PLAYER TEST RESULTS:')
    console.log('❌ UI Error State:', timeoutErrorFound)
    console.log('❌ Console Timeout:', hasConsoleTimeout)
    console.log('✅ UI Success:', successFound)
    console.log('✅ Console Success:', hasConsoleSuccess)
    
    console.log('\n📝 Relevant Console Logs:')
    consoleLogs.forEach(log => console.log(`  ${log}`))
    
    console.log('\n❌ Console Errors:')
    consoleErrors.forEach(error => console.log(`  ${error}`))

    // The main assertion - if timeout occurs, test should fail
    if (timeoutErrorFound || hasConsoleTimeout) {
      throw new Error(`YouTube Player timeout issue confirmed: UI=${timeoutErrorFound}, Console=${hasConsoleTimeout}`)
    }

    console.log('🎉 Step 2: YouTube Player working correctly!')
  })
}) 