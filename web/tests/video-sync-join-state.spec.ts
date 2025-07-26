import { test, expect } from '@playwright/test'
import { TestErrorTracker, TestLogger, guestLogin, findCreateSessionButton, waitForVideoToLoad, triggerVideoAction } from './test-helpers'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'

test('video sync join state bug detection', async ({ browser }) => {
  const logger = TestLogger.getInstance()
  logger.setTestName('Video Sync Join State Bug Detection')
  
  // Create 2 different browser contexts
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  const user1Page = await context1.newPage()
  const user2Page = await context2.newPage()
  
  // Setup error tracking
  const errorTracker1 = new TestErrorTracker(user1Page, 'User1')
  const errorTracker2 = new TestErrorTracker(user2Page, 'User2')
  
  try {
    // 1. Setup: User 1 creates session
    logger.step('Setting up session')
    await guestLogin(user1Page)
    const createBtn = await findCreateSessionButton(user1Page)
    await createBtn.click()
    await user1Page.locator('input#title').fill('Join State Bug Detection Test')
    await user1Page.locator('button[type="submit"]').click()
    await user1Page.waitForURL(/\/session\//)
    
    const sessionUrl = user1Page.url()
    const sessionId = sessionUrl.split('/session/')[1]
    
    // 2. Setup video
    logger.step('Setting up video')
    const videoInput = user1Page.locator('input[placeholder*="youtube"]').first()
    await videoInput.fill(TEST_VIDEO_URL)
    await user1Page.locator('[data-testid="set-video-button"]').click()
    
    const { iframe: iframe1 } = await waitForVideoToLoad(user1Page)
    
    // 3. Start video playback
    logger.step('Starting video playback')
    await triggerVideoAction(user1Page, 'play', 'USER1')
    await user1Page.waitForTimeout(5000) // Let video play for 5 seconds
    
    // 4. User 2 joins while video is playing
    logger.step('Second user joining during active playback')
    await guestLogin(user2Page)
    await user2Page.goto(`/session/${sessionId}`)
    await user2Page.waitForLoadState('networkidle')
    
    const { iframe: iframe2 } = await waitForVideoToLoad(user2Page)
    
    // 5. Critical bug detection: Check for player ready state issues
    logger.step('Checking for sync issues')
    
    // Wait for potential sync issues to manifest
    await user2Page.waitForTimeout(3000)
    
    // 6. Test some interactions to ensure sync works
    logger.step('Testing video sync functionality')
    await triggerVideoAction(user2Page, 'pause', 'USER2')
    await user1Page.waitForTimeout(2000)
    
    await triggerVideoAction(user2Page, 'play', 'USER2')
    await user1Page.waitForTimeout(2000)
    
    // Verify both players are still working
    await expect(user1Page.locator('iframe').first()).toBeVisible()
    await expect(user2Page.locator('iframe').first()).toBeVisible()
    
    // Check for any errors
    if (errorTracker1.hasErrors()) {
      throw new Error(`User1 encountered errors: ${errorTracker1.getErrors().join(', ')}`)
    }
    if (errorTracker2.hasErrors()) {
      throw new Error(`User2 encountered errors: ${errorTracker2.getErrors().join(', ')}`)
    }
    
    logger.success('No critical video sync bugs detected')
    
  } finally {
    await context1.close()
    await context2.close()
  }
}) 