import { test, expect } from '@playwright/test'

test.describe('Auth – Guest Login/Logout', () => {
  test('guest login and logout flow works', async ({ page }) => {
    // Listen for console errors and fail test if any occur
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Listen for page errors
    page.on('pageerror', (error) => {
      throw error
    })

    // Go to login page
    await page.goto('/login')

    // Guest name input is visible
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    await expect(guestNameInput).toBeVisible()

    // Guest login button is visible but disabled
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await expect(guestButton).toBeVisible()
    await expect(guestButton).toBeDisabled()

    // Enter guest name
    await guestNameInput.fill('Test Guest')
    
    // Button should now be enabled
    await expect(guestButton).toBeEnabled()

    // Click and wait for redirect
    await guestButton.click()
    await page.waitForURL(/\/$/)

    // See username in navbar
    await expect(page.locator('nav').locator('text=Test Guest').first()).toBeVisible()

    // Check if cookie was set
    const cookies = await page.context().cookies()
    const hasToken = cookies.some(c => c.name === 'token' && c.domain.includes('localhost'))
    expect(hasToken).toBeTruthy()

    // Logout
    await page.locator('[data-testid="logout-button"]').click()
    
    // Wait for logout process to complete
    await page.waitForFunction(() => {
      return !localStorage.getItem('user')
    }, { timeout: 10000 })
    
    // Wait for redirect to login page
    await page.waitForURL('/login', { timeout: 15000 })

    // Verify token cookie is cleared after logout (may take some time)
    await expect(async () => {
      const cookiesAfter = await page.context().cookies()
      const hasToken = cookiesAfter.some(c => c.name === 'token')
      expect(hasToken).toBeFalsy()
    }).toPass({ timeout: 5000 })
    
    // Check for console errors at end of test
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected: ${consoleErrors.join(', ')}`)
    }
  })

  test('guest can create session after login', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    page.on('pageerror', (error) => {
      throw error
    })

    // Login as guest
    await page.goto('/login')
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    await guestNameInput.fill('Session Creator')
    
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await guestButton.click()
    await page.waitForURL(/\/$/)

    // Create session using data-testid
    const createButton = page.locator('[data-testid="create-session-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.click()

    // Modal should be visible
    const modal = page.locator('.modal')
    await expect(modal).toBeVisible()

    // Fill session title
    const titleInput = page.locator('input[name="title"]')
    await titleInput.fill('Test Session')

    // Submit - try both Turkish and English button text
    const submitButton = modal.getByRole('button', { name: /(oluştur|create)/i })
    await submitButton.click()

    // Should redirect to session page
    await expect(page).toHaveURL(/\/session\/[a-f0-9-]+/, { timeout: 15000 })

    // Check for console errors
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected: ${consoleErrors.join(', ')}`)
    }
  })
})