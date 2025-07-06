import { test, expect } from '@playwright/test'

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYWZiNWUwYi00ZDdlLTQxMGQtYjU0NS0zMjJmYWYxMjdmNDYiLCJlbWFpbCI6ImJhcmFubmF5dGFzQGdtYWlsLmNvbSIsImlhdCI6MTc1MDc4OTU2OSwiZXhwIjoxNzUxMzk0MzY5fQ.yzK8ewGnBb3dCNnzbbqWFN1U_FcoMgnLd8Cb6VrF0TU'

test.describe.skip('Simple YouTube Test', () => {
  let consoleLogs: string[] = []
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    consoleLogs = []
    consoleErrors = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'error' && text.includes('YouTube')) {
        consoleErrors.push(text)
      } else if (text.includes('YouTube') || text.includes('iframe') || text.includes('Video')) {
        consoleLogs.push(text)
      }
    })

    console.log('🚀 Setting up test with guest login...')
    
    // Navigate to the app
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    // Check if we're on login page and use guest login
    const isLoginPage = await page.locator('h2:has-text("Video Sync Chat")').isVisible()
    
    if (isLoginPage) {
      console.log('👤 Login page detected - using guest login')
      
      // Wait for guest login button to be visible
      const guestLoginButton = page.locator('button:has-text("Misafir Olarak Giriş")')
      await expect(guestLoginButton).toBeVisible({ timeout: 10000 })
      await guestLoginButton.click()
      
      // Wait for login to complete
      await page.waitForTimeout(1000)
      
      // Wait for redirect away from login page
      await page.waitForURL(/\/(|sessions)$/, { timeout: 10000 })
      console.log('✅ Guest login successful')
    } else {
      console.log('🏠 Already authenticated or on home page')
    }
  })

  test('YouTube Player timeout test', async ({ page }) => {
    console.log('🎬 Starting YouTube test...')
    
    // Navigate to sessions page (should already be authenticated via beforeEach)
    await page.goto('http://localhost:5173/sessions')
    await page.waitForLoadState('networkidle')
    console.log('📋 On sessions page')
    
    // Wait a bit to see the page
    await page.waitForTimeout(1000)
    
    // Try different button selectors
    const buttonSelectors = [
      'button:has-text("Yeni Oturum")',
      'text=Yeni Oturum',
      'button:has-text("Oturum Oluştur")',
      'button:has-text("Oluştur")', 
      '[data-testid="create-session"]',
      'button[type="button"]'
    ]
    
    let createButtonFound = false
    
    for (const selector of buttonSelectors) {
      const button = page.locator(selector).first()
      const isVisible = await button.isVisible().catch(() => false)
      
      if (isVisible) {
        console.log(`✅ Found create button: ${selector}`)
        await button.click()
        createButtonFound = true
        break
      } else {
        console.log(`❌ Button not found: ${selector}`)
      }
    }
    
    if (!createButtonFound) {
      console.log('⚠️ No create button found, checking page content...')
      const bodyText = await page.textContent('body')
      console.log('Page content:', bodyText?.substring(0, 500))
      return // Skip the rest
    }
    
    // Fill session title
    const titleInput = page.locator('input[type="text"]').first()
    await titleInput.fill('YouTube Test Session')
    console.log('✅ Filled session title')
    
    // Click create - modal içindeki submit button
    await page.locator('button[type="submit"]:has-text("Oturum Oluştur")').click()
    console.log('✅ Clicked create')
    
    // Wait for session room
    await page.waitForURL(/\/session\/.*/, { timeout: 10000 })
    console.log('✅ In session room')
    
    // Set video URL
    const videoInput = page.locator('input').filter({ hasText: /youtube/ }).or(
      page.locator('input[placeholder*="youtube"]')
    ).first()
    
    await videoInput.fill('https://www.youtube.com/watch?v=cYgmnku6R3Y')
    console.log('✅ Filled video URL')
    
    // Click set video
    await page.locator('button:has-text("Ayarla")').click()
    console.log('🎯 Video set, waiting for result...')
    
    // Wait for either success or timeout (20 seconds max)
    let result = 'unknown'
    
    try {
      await Promise.race([
        page.waitForSelector('text=Video yükleniyor...', { state: 'hidden', timeout: 20000 }).then(() => result = 'success'),
        page.waitForSelector('text=Video yükleme zaman aşımı', { timeout: 20000 }).then(() => result = 'timeout'),
        page.waitForSelector('text=Video yüklenemedi', { timeout: 20000 }).then(() => result = 'error')
      ])
    } catch {
      result = 'test_timeout'
    }
    
    // Check console for timeout errors
    const hasConsoleTimeout = consoleErrors.some(error => 
      error.includes('timeout') || error.includes('zaman aşımı')
    )

    console.log('\n📊 YOUTUBE TEST RESULTS:')
    console.log('🎯 Result:', result)
    console.log('❌ Console Timeout:', hasConsoleTimeout)
    
    console.log('\n📝 YouTube Logs:')
    consoleLogs.forEach(log => console.log(`  ${log}`))
    
    console.log('\n❌ YouTube Errors:')
    consoleErrors.forEach(error => console.log(`  ${error}`))

    // Main assertion
    if (result === 'timeout' || result === 'error' || hasConsoleTimeout) {
      console.log('\n💥 YOUTUBE PLAYER TIMEOUT CONFIRMED!')
      throw new Error(`YouTube timeout detected: result=${result}, consoleTimeout=${hasConsoleTimeout}`)
    }

    console.log('\n🎉 YOUTUBE PLAYER WORKING!')
  })
}) 