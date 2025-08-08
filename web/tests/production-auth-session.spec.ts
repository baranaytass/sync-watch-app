import { test, expect } from '@playwright/test'

test('production guest login and create session flow', async ({ page }) => {
    console.log('🚀 PRODUCTION TEST – Starting guest login and session creation flow')
    
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.text().includes('🍪') || msg.text().includes('401') || msg.text().includes('error') || msg.text().includes('Sessions Store')) {
        console.log('🔍 Browser Console:', msg.text())
      }
    })

    // Monitor network requests
    page.on('response', response => {
      if (response.status() >= 400) {  
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`)
      }
    })
    
    console.log('📄 Navigating to production login page')
    const baseUrl = process.env.BASE_URL || 'https://sync-watch-frontend.onrender.com'
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
    
    // Check if page loaded correctly
    await expect(page).toHaveTitle(/Video Sync Chat/)
    
    // Guest name input should be visible
    console.log('🔍 Looking for guest name input')
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    await expect(guestNameInput).toBeVisible({ timeout: 15000 })
    
    // Guest login button should be visible but disabled
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await expect(guestButton).toBeVisible()
    await expect(guestButton).toBeDisabled()
    
    console.log('📝 Entering guest name: Prod Test User')
    await guestNameInput.fill('Prod Test User')
    
    // Button should now be enabled
    await expect(guestButton).toBeEnabled()
    
    console.log('🔑 Clicking guest login button...')
    await guestButton.click()
    
    // Wait for authentication to complete and redirect to home
    console.log('⏳ Waiting for redirect to home page...')
    await page.waitForURL(`${baseUrl}/`, { timeout: 30000 })
    console.log('✅ Successfully redirected to authenticated home page')
    
    // Verify we're authenticated - username should appear in navbar
    await expect(page.locator('nav').locator('text=Prod Test User').first()).toBeVisible()
    
    // Check JWT cookie was set (production domains may have different cookie behavior)
    const cookies = await page.context().cookies()
    const hasToken = cookies.some(c => c.name === 'token' || c.name.includes('token'))
    console.log('🍪 JWT cookie found:', hasToken)
    console.log('🍪 All cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 10)}...`))
    
    // For production, we'll verify authentication by checking localStorage instead
    const hasLocalStorageAuth = await page.evaluate(() => {
      return localStorage.getItem('user') !== null || localStorage.getItem('jwt') !== null
    })
    console.log('💾 LocalStorage auth found:', hasLocalStorageAuth)
    
    // Either cookie or localStorage should work for authentication
    expect(hasToken || hasLocalStorageAuth).toBeTruthy()
    
    // Now test session creation
    console.log('🎬 Testing session creation...')
    
    const createButton = page.locator('[data-testid="create-session-button"]')
    await expect(createButton).toBeVisible({ timeout: 15000 })
    
    console.log('🔘 Clicking create session button...')
    await createButton.click()
    
    // Wait for session creation - should redirect to /session/{id}
    console.log('⏳ Waiting for session to be created and redirected...')
    
    try {
      await page.waitForURL(/\/session\/[a-f0-9-]+/, { timeout: 30000 })
      console.log('✅ SUCCESS: Session created and redirected to session page')
      
      // Verify we're in a session page with correct URL pattern
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/session\/[a-f0-9-]+/)
      console.log('🎯 Session URL:', currentUrl)
      
      // Additional verification - check session page elements (use leave button as indicator)
      await expect(page.locator('[data-testid="leave-session-button"]')).toBeVisible({ timeout: 10000 })
      console.log('📋 Session page loaded with leave button visible')
      
    } catch (error) {
      console.log('❌ FAILED: Session creation timeout or error')
      
      // Wait a bit more to capture any delayed responses
      await page.waitForTimeout(5000)
      
      // Get current URL for debugging
      const currentUrl = page.url()
      console.log('🔍 Current URL after create attempt:', currentUrl)
      
      // Check for any error messages on page
      const errorElements = await page.locator('[class*="error"], [class*="alert"]').all()
      for (const element of errorElements) {
        const text = await element.textContent()
        if (text) {
          console.log('⚠️  Error message found:', text)
        }
      }
      
      // Check network tab for failed requests
      console.log('🌐 Checking recent network activity...')
      
      throw new Error(`Session creation failed: ${error.message}. Current URL: ${currentUrl}`)
    }
})

test('production health check', async ({ page }) => {
    console.log('🏥 Testing production backend health endpoint')
    
    const response = await page.request.get('https://sync-watch-backend.onrender.com/health')
    expect(response.status()).toBe(200)
    
    const body = await response.text()
    console.log('💚 Backend health response:', body)
})