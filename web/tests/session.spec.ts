import { test, expect } from '@playwright/test'

const createSession = async (page: any, title: string): Promise<string> => {
  // Home page (authenticated user dashboard)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Find "Create New Session" button on authenticated homepage
  const createSessionBtn = page.locator('[data-testid="create-session-button"]')
  
  await expect(createSessionBtn).toBeVisible({ timeout: 8000 })
  
  // Click button - directly creates quick session and redirects
  await createSessionBtn.click()

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
    console.log('🎬 SESSION TEST – Guest login completed')
  })

  test('user can create and join a session', async ({ page }) => {
    console.log('🏗️ Starting session creation')
    const url = await createSession(page, 'Quick Session') // title no longer used but kept for compatibility
    console.log('✅ Session created:', url)

    // Check if session room loaded
    await expect(page).toHaveURL(url)
    console.log('👥 Checking participants')
    await expect(page.locator('[data-testid="participant-item"]')).toHaveCount(1, { timeout: 10000 })

    // Check if we see ourselves in participant list
    console.log('🔎 We can see ourselves in participant list')
    await expect(page.locator('text=Session Test User')).toBeVisible()
  })

  test('sessions are listed correctly in dashboard', async ({ page }) => {
    console.log('📋 Starting session listing test')
    
    // Create first session
    const url1 = await createSession(page, 'Test Session 1')
    console.log('✅ First session created:', url1)
    
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
    await expect(page.locator('text=Quick Session').first()).toBeVisible({ timeout: 10000 })
    console.log('✅ Session appears in list')
    
    // Create second session
    const createBtn = page.locator('[data-testid="create-session-button"]')
    await createBtn.click()
    await page.waitForURL(/\/session\//)
    
    // Return to home again
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open sessions panel again
    await browseSessions.click()
    await page.waitForTimeout(2000)
    
    // Both sessions should be visible (we expect at least 2)
    const sessionItems = page.locator('text=Quick Session')
    const count = await sessionItems.count()
    expect(count).toBeGreaterThanOrEqual(2)
    console.log(`✅ Sessions appear in list (found ${count} sessions)`)
  })
}) 