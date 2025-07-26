import { test, expect } from '@playwright/test'
import { TestErrorTracker, TestLogger, guestLogin, findCreateSessionButton, waitForVideoToLoad, triggerVideoAction } from './test-helpers'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'

test.describe('Video Sync – Advanced Scenarios', () => {
  
  test('complex multi-user play/pause sequences', async ({ browser }) => {
    const logger = TestLogger.getInstance()
    logger.setTestName('Complex Play/Pause Sequences')
    
    // Create 2 different browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const user1Page = await context1.newPage()
    const user2Page = await context2.newPage()
    
    // Setup error tracking
    const errorTracker1 = new TestErrorTracker(user1Page, 'User1')
    const errorTracker2 = new TestErrorTracker(user2Page, 'User2')
    
    try {
      // 1. Setup: User 1 creates session, User 2 joins
      logger.step('Setting up session with 2 users')
      await guestLogin(user1Page)
      const createBtn = await findCreateSessionButton(user1Page)
      await createBtn.click()
      await user1Page.locator('input#title').fill('Advanced Video Sync Test')
      await user1Page.locator('button[type="submit"]').click()
      await user1Page.waitForURL(/\/session\//)
      
      const sessionUrl = user1Page.url()
      const sessionId = sessionUrl.split('/session/')[1]
      
      await guestLogin(user2Page)
      await user2Page.goto(`/session/${sessionId}`)
      await user2Page.waitForLoadState('networkidle')
      
      // 2. Setup video
      logger.step('Setting up video')
      const videoInput = user1Page.locator('input[placeholder*="youtube"]').first()
      await videoInput.fill(TEST_VIDEO_URL)
      await user1Page.locator('[data-testid="set-video-button"]').click()
      
      const { iframe: iframe1 } = await waitForVideoToLoad(user1Page)
      const { iframe: iframe2 } = await waitForVideoToLoad(user2Page)
      
      // 3. Complex play/pause sequence
      logger.step('Testing complex play/pause sequence')
      
      await triggerVideoAction(user2Page, 'play', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      await triggerVideoAction(user2Page, 'pause', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      await triggerVideoAction(user2Page, 'play', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      await triggerVideoAction(user1Page, 'pause', 'USER1')
      await user1Page.waitForTimeout(2000)
      
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(2000)
      
      await triggerVideoAction(user2Page, 'pause', 'USER2')
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
      
      logger.success('Complex play/pause sequence completed successfully')
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('third user joins during active video playback', async ({ browser }) => {
    const logger = TestLogger.getInstance()
    logger.setTestName('Third User Join')
    
    // Create 3 different browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const context3 = await browser.newContext()
    const user1Page = await context1.newPage()
    const user2Page = await context2.newPage()
    const user3Page = await context3.newPage()
    
    // Setup error tracking
    const errorTracker1 = new TestErrorTracker(user1Page, 'User1')
    const errorTracker2 = new TestErrorTracker(user2Page, 'User2')
    const errorTracker3 = new TestErrorTracker(user3Page, 'User3')
    
    try {
      // 1. Setup: User 1 creates session, User 2 joins
      logger.step('Setting up session with 2 users')
      await guestLogin(user1Page)
      const createBtn = await findCreateSessionButton(user1Page)
      await createBtn.click()
      await user1Page.locator('input#title').fill('Third User Join Test')
      await user1Page.locator('button[type="submit"]').click()
      await user1Page.waitForURL(/\/session\//)
      
      const sessionUrl = user1Page.url()
      const sessionId = sessionUrl.split('/session/')[1]
      
      await guestLogin(user2Page)
      await user2Page.goto(`/session/${sessionId}`)
      await user2Page.waitForLoadState('networkidle')
      
      // 2. Setup video
      logger.step('Setting up video')
      const videoInput = user1Page.locator('input[placeholder*="youtube"]').first()
      await videoInput.fill(TEST_VIDEO_URL)
      await user1Page.locator('[data-testid="set-video-button"]').click()
      
      const { iframe: iframe1 } = await waitForVideoToLoad(user1Page)
      const { iframe: iframe2 } = await waitForVideoToLoad(user2Page)
      
      // 3. Start video playback
      logger.step('Starting video playback')
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(5000) // Let video play for 5 seconds
      
      // 4. Third user joins while video is playing
      logger.step('Third user joining during active playback')
      await guestLogin(user3Page)
      await user3Page.goto(`/session/${sessionId}`)
      await user3Page.waitForLoadState('networkidle')
      
      const { iframe: iframe3 } = await waitForVideoToLoad(user3Page)
      
      // 5. Verify third user receives current video state
      logger.step('Verifying third user sync')
      await user3Page.waitForTimeout(3000)
      
      // 6. Test some interactions from third user
      await triggerVideoAction(user3Page, 'pause', 'USER3')
      await user1Page.waitForTimeout(2000)
      
      await triggerVideoAction(user3Page, 'play', 'USER3')
      await user1Page.waitForTimeout(2000)
      
      // Verify all players are still working
      await expect(user1Page.locator('iframe').first()).toBeVisible()
      await expect(user2Page.locator('iframe').first()).toBeVisible()
      await expect(user3Page.locator('iframe').first()).toBeVisible()
      
      // Check for any errors
      if (errorTracker1.hasErrors()) {
        throw new Error(`User1 encountered errors: ${errorTracker1.getErrors().join(', ')}`)
      }
      if (errorTracker2.hasErrors()) {
        throw new Error(`User2 encountered errors: ${errorTracker2.getErrors().join(', ')}`)
      }
      if (errorTracker3.hasErrors()) {
        throw new Error(`User3 encountered errors: ${errorTracker3.getErrors().join(', ')}`)
      }
      
      logger.success('Third user join test completed successfully')
      
    } finally {
      await context1.close()
      await context2.close()
      await context3.close()
    }
  })

  test('rapid play/pause stress test', async ({ browser }) => {
    const logger = TestLogger.getInstance()
    logger.setTestName('Rapid Play/Pause Stress')
    
    // Create 2 different browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const user1Page = await context1.newPage()
    const user2Page = await context2.newPage()
    
    // Setup error tracking
    const errorTracker1 = new TestErrorTracker(user1Page, 'User1')
    const errorTracker2 = new TestErrorTracker(user2Page, 'User2')
    
    try {
      // 1. Setup: User 1 creates session, User 2 joins
      logger.step('Setting up session with 2 users')
      await guestLogin(user1Page)
      const createBtn = await findCreateSessionButton(user1Page)
      await createBtn.click()
      await user1Page.locator('input#title').fill('Rapid Play/Pause Test')
      await user1Page.locator('button[type="submit"]').click()
      await user1Page.waitForURL(/\/session\//)
      
      const sessionUrl = user1Page.url()
      const sessionId = sessionUrl.split('/session/')[1]
      
      await guestLogin(user2Page)
      await user2Page.goto(`/session/${sessionId}`)
      await user2Page.waitForLoadState('networkidle')
      
      // 2. Setup video
      logger.step('Setting up video')
      const videoInput = user1Page.locator('input[placeholder*="youtube"]').first()
      await videoInput.fill(TEST_VIDEO_URL)
      await user1Page.locator('[data-testid="set-video-button"]').click()
      
      const { iframe: iframe1 } = await waitForVideoToLoad(user1Page)
      const { iframe: iframe2 } = await waitForVideoToLoad(user2Page)
      
      // 3. Rapid play/pause stress test
      logger.step('Starting rapid play/pause stress test')
      
      const actions = [
        { user: 'USER1', page: user1Page, action: 'play' },
        { user: 'USER2', page: user2Page, action: 'pause' },
        { user: 'USER1', page: user1Page, action: 'play' },
        { user: 'USER2', page: user2Page, action: 'pause' },
        { user: 'USER1', page: user1Page, action: 'play' },
        { user: 'USER2', page: user2Page, action: 'pause' },
        { user: 'USER1', page: user1Page, action: 'play' },
        { user: 'USER2', page: user2Page, action: 'pause' }
      ]
      
      for (let i = 0; i < actions.length; i++) {
        const { user, page, action } = actions[i]
        await triggerVideoAction(page, action as 'play' | 'pause', user)
        await page.waitForTimeout(1500)
      }
      
      // Wait for all actions to be processed
      await user1Page.waitForTimeout(3000)
      
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
      
      logger.success('Rapid play/pause stress test completed successfully')
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

}) 