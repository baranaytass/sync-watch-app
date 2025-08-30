import { test, expect } from '@playwright/test'

const createSession = async (page: any, title: string): Promise<string> => {
  // Home page (authenticated user dashboard)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Find "Create New Session" button on authenticated homepage
  const createSessionBtn = page.locator('[data-testid="create-session-button"]')
  
  await expect(createSessionBtn).toBeVisible({ timeout: 8000 })
  
  // Click button to open modal
  await createSessionBtn.click()

  // Modal should be visible
  const modal = page.locator('.modal')
  await expect(modal).toBeVisible()

  // Fill session title if provided
  if (title) {
    const titleInput = page.locator('input[name="title"]')
    await titleInput.fill(title)
  }

  // Submit session creation
  const submitButton = modal.getByRole('button', { name: /(oluştur|create)/i })
  await submitButton.click()

  // Wait for redirect to session page
  await page.waitForURL(/\/session\//)
  return page.url()
}

test.describe('Session – create & join', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    const guestBtn = page.locator('[data-testid="guest-login-button"]')
    
    if (await guestNameInput.isVisible() && await guestBtn.isVisible()) {
      await guestNameInput.fill('Session Test User')
      await expect(guestBtn).toBeEnabled()
      await guestBtn.click()
      await page.waitForURL(/\/$/)
    }
  })

  test('user can create and join a session', async ({ page }) => {
    const url = await createSession(page, 'Quick Session')

    // Check if session room loaded
    await expect(page).toHaveURL(url)
    
    // Wait for participants to load
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.participant-item')).toHaveCount(1, { timeout: 10000 })

    // Check if we see ourselves in participant list
    await expect(page.locator('text=Session Test User')).toBeVisible()
  })

  test('sessions are listed correctly in dashboard', async ({ page }) => {
    // Create first session
    const url1 = await createSession(page, 'Test Session 1')
    
    // Return to home
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open sessions panel
    const browseSessions = page.locator('text=Browse Sessions')
    await expect(browseSessions).toBeVisible()
    await browseSessions.click()
    
    // Wait for loading spinner to pass
    await page.waitForTimeout(2000)
    
    // Our created session should appear in the list
    await expect(page.locator('text=Test Session 1').first()).toBeVisible({ timeout: 10000 })
    
    // Create second session
    const url2 = await createSession(page, 'Test Session 2')
    
    // Return to home again
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open sessions panel again
    await browseSessions.click()
    await page.waitForTimeout(2000)
    
    // Both sessions should be visible (we expect at least 2)
    const sessionItems = page.locator('text=Test Session')
    const count = await sessionItems.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })
}) 