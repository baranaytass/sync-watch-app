import { test, expect } from '@playwright/test'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

test.describe('Echo Prevention Advanced', () => {
  test('complex multi-user sync scenarios without echo loops', async ({ browser }) => {
    // Create 3 users for comprehensive testing
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const context3 = await browser.newContext()
    const user1 = await context1.newPage()
    const user2 = await context2.newPage()
    const user3 = await context3.newPage()
    
    // Track all sync messages and video actions
    const user1Messages: string[] = []
    const user2Messages: string[] = []
    const user3Messages: string[] = []
    
    // Track WebSocket messages and backend state
    const trackUserMessages = (user: any, messages: string[], userName: string) => {
      user.on('console', (msg: any) => {
        const text = msg.text()
        if (text.includes('VideoSync:') || text.includes('YouTubePlayer:') || text.includes('WebSocket:') || text.includes('video_action')) {
          messages.push(`[${userName}] ${text}`)
          console.log(`[${userName}] ${text}`)
        }
      })
    }
    
    trackUserMessages(user1, user1Messages, 'USER1')
    trackUserMessages(user2, user2Messages, 'USER2') 
    trackUserMessages(user3, user3Messages, 'USER3')
    
    try {
      // User 1 creates session and sets video
      console.log('🎬 PHASE 1: User1 creates session and starts video')
      await user1.goto('/login')
      await user1.locator('[data-testid="guest-name-input"]').fill('User1')
      await user1.locator('[data-testid="guest-login-button"]').click()
      await user1.waitForURL('/')
      
      await user1.locator('[data-testid="create-session-button"]').click()
      await user1.locator('.modal input[name="title"]').fill('Echo Prevention Test')
      await user1.locator('.modal button[type="submit"]').click()
      await user1.waitForURL(/\/session\//)
      
      const sessionId = user1.url().split('/session/')[1]
      
      // Set video
      await user1.locator('input[placeholder*="youtube"]').fill(TEST_VIDEO_URL)
      await user1.locator('[data-testid="set-video-button"]').click()
      await user1.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user1.waitForTimeout(3000)
      
      // Start playing
      await user1.locator('iframe').click() // play
      await user1.waitForTimeout(5000) // Let it play for 5 seconds
      
      console.log('📊 USER1 messages after starting video:', user1Messages.slice(-3))
      
      // User 2 joins mid-playback
      console.log('🎬 PHASE 2: User2 joins mid-playback')
      user1Messages.length = 0 // Clear to monitor impact
      
      await user2.goto('/login')
      await user2.locator('[data-testid="guest-name-input"]').fill('User2')
      await user2.locator('[data-testid="guest-login-button"]').click()
      await user2.waitForURL('/')
      
      await user2.goto(`/session/${sessionId}`)
      await user2.waitForLoadState('networkidle')
      await user2.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user2.waitForTimeout(5000) // Wait for join sync
      
      console.log('📊 USER1 messages after USER2 joined:', user1Messages)
      console.log('📊 USER2 messages after joining:', user2Messages.slice(-5))
      
      // CRITICAL TEST 1: User1's video should not restart
      const user1VideoRestarted = user1Messages.some(msg => 
        (msg.includes('play at 0s') || msg.includes('pause at 0s')) && !msg.includes('INITIAL SYNC')
      )
      expect(user1VideoRestarted).toBeFalsy()
      
      // User 3 joins later
      console.log('🎬 PHASE 3: User3 joins session')
      user1Messages.length = 0
      user2Messages.length = 0
      
      await user3.goto('/login')
      await user3.locator('[data-testid="guest-name-input"]').fill('User3')
      await user3.locator('[data-testid="guest-login-button"]').click()
      await user3.waitForURL('/')
      
      await user3.goto(`/session/${sessionId}`)
      await user3.waitForLoadState('networkidle')
      await user3.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user3.waitForTimeout(5000)
      
      console.log('📊 USER1 messages after USER3 joined:', user1Messages)
      console.log('📊 USER2 messages after USER3 joined:', user2Messages)
      console.log('📊 USER3 messages after joining:', user3Messages.slice(-5))
      
      // CRITICAL TEST 2: Neither User1 nor User2 should restart
      const user1RestartedAgain = user1Messages.some(msg => 
        (msg.includes('play at 0s') || msg.includes('pause at 0s')) && !msg.includes('INITIAL SYNC')
      )
      const user2Restarted = user2Messages.some(msg => 
        (msg.includes('play at 0s') || msg.includes('pause at 0s')) && !msg.includes('INITIAL SYNC')
      )
      
      expect(user1RestartedAgain).toBeFalsy()
      expect(user2Restarted).toBeFalsy()
      
      // Test sync functionality - User2 pauses
      console.log('🎬 PHASE 4: User2 pauses video')
      user1Messages.length = 0
      user3Messages.length = 0
      
      // FIXED: Use exposed test function to send video action
      // This bypasses YouTube Player iframe click issues in test environment
      await user2.evaluate(() => {
        console.log('🎯 TEST: Triggering pause action directly')
        
        const sendVideoActionTest = (window as any).sendVideoActionTest
        if (sendVideoActionTest) {
          sendVideoActionTest('pause', 10.5)
        } else {
          console.log('🎯 TEST: sendVideoActionTest not available')
        }
      })
      
      await user2.waitForTimeout(3000)
      
      console.log('📊 USER1 messages after USER2 pause:', user1Messages.slice(-3))
      console.log('📊 USER3 messages after USER2 pause:', user3Messages.slice(-3))
      
      // All users should receive pause sync - more tolerant matching
      const user1ReceivedPause = user1Messages.some(msg => msg.includes('pause at 10.5s'))
      const user3ReceivedPause = user3Messages.some(msg => msg.includes('pause at 10.5s'))
      
      expect(user1ReceivedPause).toBeTruthy()
      expect(user3ReceivedPause).toBeTruthy()
      
      // Test reverse sync - User3 plays
      console.log('🎬 PHASE 5: User3 plays video')
      user1Messages.length = 0
      user2Messages.length = 0
      
      // FIXED: Use exposed test function to send play action
      await user3.evaluate(() => {
        console.log('🎯 TEST: Triggering play action directly')
        
        const sendVideoActionTest = (window as any).sendVideoActionTest
        if (sendVideoActionTest) {
          sendVideoActionTest('play', 15.2)
        } else {
          console.log('🎯 TEST: sendVideoActionTest not available')
        }
      })
      
      await user3.waitForTimeout(4000)
      
      console.log('📊 USER1 messages after USER3 play:', user1Messages)
      console.log('📊 USER2 messages after USER3 play:', user2Messages)
      
      // All users should receive play sync
      const user1ReceivedPlay = user1Messages.some(msg => msg.includes('play') && !msg.includes('at 0s'))
      const user2ReceivedPlay = user2Messages.some(msg => msg.includes('play') && !msg.includes('at 0s'))
      
      expect(user1ReceivedPlay).toBeTruthy()
      expect(user2ReceivedPlay).toBeTruthy()
      
      console.log('✅ All echo prevention tests passed!')
      
    } finally {
      await context1.close()
      await context2.close()
      await context3.close()
    }
  })
})