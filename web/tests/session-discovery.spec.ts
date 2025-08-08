import { test, expect } from '@playwright/test'

test.describe('Session Discovery - Multi-User', () => {
  test('session created by one user is visible to other users in session list', async ({ browser }) => {
    console.log('🔍 SESSION DISCOVERY TEST – Starting multi-user session listing test')
    
    // Create two separate browser contexts (different users)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const userPage1 = await context1.newPage()
    const userPage2 = await context2.newPage()
    
    try {
      // User 1: Login as guest
      console.log('👤 USER 1: Guest login')
      await userPage1.goto('/login')
      const user1GuestInput = userPage1.locator('[data-testid="guest-name-input"]')
      const user1GuestBtn = userPage1.locator('[data-testid="guest-login-button"]')
      await user1GuestInput.fill('Test User 1')
      await user1GuestBtn.click()
      await userPage1.waitForURL('/')
      
      // User 1: Create session
      console.log('👤 USER 1: Creating session')
      const createBtn = userPage1.locator('[data-testid="create-session-button"]')
      await expect(createBtn).toBeVisible()
      await createBtn.click()
      
      // Wait for session creation and get session ID
      await userPage1.waitForURL(/\/session\//)
      const sessionUrl = userPage1.url()
      const sessionId = sessionUrl.split('/session/')[1]
      console.log('✅ USER 1: Session created with ID:', sessionId)
      
      // User 2: Login as different guest
      console.log('👤 USER 2: Guest login')
      await userPage2.goto('/login')
      const user2GuestInput = userPage2.locator('[data-testid="guest-name-input"]')
      const user2GuestBtn = userPage2.locator('[data-testid="guest-login-button"]')
      await user2GuestInput.fill('Test User 2')
      await user2GuestBtn.click()
      await userPage2.waitForURL('/')
      
      // User 2: Check if User 1's session appears in session list
      console.log('👤 USER 2: Checking session list')
      await userPage2.waitForLoadState('networkidle')
      
      // Look for "Browse Sessions" button/link
      const browseSessionsBtn = userPage2.locator('text=Browse Sessions')
      if (await browseSessionsBtn.isVisible({ timeout: 5000 })) {
        console.log('👤 USER 2: Clicking Browse Sessions')
        await browseSessionsBtn.click()
        await userPage2.waitForTimeout(2000) // Wait for sessions to load
      }
      
      // Check if the session created by User 1 is visible to User 2
      const sessionInList = userPage2.locator(`text=Quick Session`).first()
      const isSessionVisible = await sessionInList.isVisible({ timeout: 10000 })
      
      if (isSessionVisible) {
        console.log('✅ SUCCESS: Session is visible to other users')
        
        // Try to join the session
        console.log('👤 USER 2: Attempting to join session')
        const joinButton = userPage2.locator('button:has-text("Join")').first()
        await joinButton.click()
        
        // Check if we can navigate to the session
        await userPage2.waitForURL(/\/session\//, { timeout: 10000 })
        console.log('✅ SUCCESS: User 2 can join User 1\'s session')
        
        // Verify both users are in the same session
        await expect(userPage1.locator('[data-testid="participant-item"]')).toHaveCount(2, { timeout: 10000 })
        await expect(userPage2.locator('[data-testid="participant-item"]')).toHaveCount(2, { timeout: 10000 })
        console.log('✅ SUCCESS: Both users see 2 participants in session')
        
      } else {
        console.log('❌ FAILED: Session created by User 1 is NOT visible to User 2')
        
        // Debug: Check what sessions are actually visible
        const allSessions = await userPage2.locator('[data-testid="session-item"]').count()
        console.log('🔍 DEBUG: Total sessions visible to User 2:', allSessions)
        
        // Try direct navigation to session
        console.log('🔗 DEBUG: Trying direct navigation to session')
        await userPage2.goto(`/session/${sessionId}`)
        await userPage2.waitForLoadState('networkidle')
        
        const canAccessDirectly = userPage2.url().includes(sessionId)
        console.log('🔗 DEBUG: Can access session directly:', canAccessDirectly)
        
        throw new Error('Session discovery failed - sessions not visible across users')
      }
      
    } finally {
      // Cleanup
      await context1.close()
      await context2.close()
    }
  })
})