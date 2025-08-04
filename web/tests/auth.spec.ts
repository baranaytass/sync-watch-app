import { test, expect } from '@playwright/test'

// Simple guest authentication test

test.describe('Auth – Guest Login/Logout', () => {
  test('guest login and logout flow works', async ({ page }) => {
    console.log('🚀 AUTH TEST – Navigating to page')
    // Go to login page
    await page.goto('/login')

    // Guest name input is visible
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    await expect(guestNameInput).toBeVisible()

    // Guest login button is visible but disabled
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await expect(guestButton).toBeVisible()
    await expect(guestButton).toBeDisabled()

    console.log('📝 Entering guest name')
    // Enter guest name
    await guestNameInput.fill('Test Guest')
    
    // Button should now be enabled
    await expect(guestButton).toBeEnabled()

    console.log('🔑 Clicking guest login button')
    // Click and wait for redirect (now redirects to home page)
    await guestButton.click()
    await page.waitForURL(/\/$/)
    console.log('✅ Logged in successfully, now on authenticated home page')

    // See username in navbar (language-independent text check)
    await expect(page.locator('nav').locator('text=Test Guest').first()).toBeVisible()

    // Check if cookie was set
    const cookies = await page.context().cookies()
    const hasToken = cookies.some(c => c.name === 'token' && c.domain.includes('localhost'))
    console.log('🍪 JWT cookie set:', hasToken)
    expect(hasToken).toBeTruthy()

    // Logout
    console.log('🚪 Clicking logout button')
    await page.locator('[data-testid="logout-button"]').click()
    
    // Wait for logout process to complete (user auth state should be cleared)
    await page.waitForFunction(() => {
      return !localStorage.getItem('user')
    }, { timeout: 10000 })
    
    // Wait for redirect to login page
    await page.waitForURL('/login', { timeout: 15000 })

    // Check if cookie was cleared
    const cookiesAfter = await page.context().cookies()
    const cleared = cookiesAfter.every(c => c.name !== 'token')
    console.log('🧹 Cookie cleared:', cleared)
    expect(cleared).toBeTruthy()
  })

  test('guest can create session after login', async ({ page }) => {
    console.log('🚀 SESSION CREATE TEST – Starting guest login flow')
    
    // Login as guest first
    await page.goto('/login')
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    await expect(guestNameInput).toBeVisible()
    
    await guestNameInput.fill('Session Creator')
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await guestButton.click()
    await page.waitForURL(/\/$/)
    
    console.log('✅ Guest login completed, now testing session creation')
    
    // Verify we're on authenticated home page and create session button is visible
    const createButton = page.locator('[data-testid="create-session-button"]')
    await expect(createButton).toBeVisible()
    
    console.log('🎬 Clicking create session button')
    
    // Listen for console logs to debug cookie issues
    page.on('console', msg => {
      if (msg.text().includes('🍪') || msg.text().includes('401') || msg.text().includes('Sessions Store')) {
        console.log('Browser Console:', msg.text())
      }
    })
    
    // Click create session and wait for either success or error
    await createButton.click()
    
    // Wait for either successful redirect to session page or error
    try {
      // If successful, should redirect to /session/{id}
      await page.waitForURL(/\/session\/[a-f0-9-]+/, { timeout: 10000 })
      console.log('✅ Session created successfully, redirected to session page')
      
      // Verify we're in a session page
      expect(page.url()).toMatch(/\/session\/[a-f0-9-]+/)
      
    } catch (error) {
      // If failed, check for error logs
      console.log('❌ Session creation failed or timeout')
      
      // Wait a bit to capture console logs
      await page.waitForTimeout(2000)
      
      // Check if still on home page (failed creation)
      const currentUrl = page.url()
      console.log('Current URL after create attempt:', currentUrl)
      
      // This test should fail if we can't create session
      throw new Error('Session creation failed - either 401 error or timeout')
    }
  })
}) 