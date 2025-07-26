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
}) 