import { test, expect } from '@playwright/test'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

test.describe('Mid-Playback Join Fix', () => {
  test('existing user video should not restart when new user joins', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const existingUser = await context1.newPage()
    const newUser = await context2.newPage()
    
    // Track video state changes for existing user
    const existingUserVideoActions: string[] = []
    let existingUserVideoStarted = false
    let existingUserVideoRestarted = false
    
    existingUser.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state') || text.includes('YouTubePlayer: Applying direct sync')) {
        existingUserVideoActions.push(text)
        
        // Track if video starts playing
        if (text.includes('play at 0s') || text.includes('play at 0.0')) {
          if (existingUserVideoStarted) {
            existingUserVideoRestarted = true // Video restarted from beginning
          } else {
            existingUserVideoStarted = true // First play
          }
        }
      }
    })
    
    try {
      // Existing user creates session and starts video
      await existingUser.goto('/login')
      await existingUser.locator('[data-testid="guest-name-input"]').fill('Existing User')
      await existingUser.locator('[data-testid="guest-login-button"]').click()
      await existingUser.waitForURL('/')
      
      await existingUser.locator('[data-testid="create-session-button"]').click()
      await existingUser.locator('.modal input[name="title"]').fill('Mid-Playback Test')
      await existingUser.locator('.modal button[type="submit"]').click()
      await existingUser.waitForURL(/\/session\//)
      
      const sessionId = existingUser.url().split('/session/')[1]
      
      // Set video and start playing
      await existingUser.locator('input[placeholder*="youtube"]').fill(TEST_VIDEO_URL)
      await existingUser.locator('[data-testid="set-video-button"]').click()
      await existingUser.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await existingUser.waitForTimeout(3000)
      
      // Start playing video
      await existingUser.locator('iframe').click() // play
      await existingUser.waitForTimeout(5000) // Let it play for 5 seconds
      
      // Clear sync messages after initial play
      existingUserVideoActions.length = 0
      existingUserVideoStarted = true
      existingUserVideoRestarted = false
      
      console.log('✅ Existing user video is playing, now new user will join...')
      
      // New user joins the session
      await newUser.goto('/login')
      await newUser.locator('[data-testid="guest-name-input"]').fill('New User')
      await newUser.locator('[data-testid="guest-login-button"]').click()
      await newUser.waitForURL('/')
      
      await newUser.goto(`/session/${sessionId}`)
      await newUser.waitForLoadState('networkidle')
      await newUser.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await newUser.waitForTimeout(5000) // Wait for join sync to complete
      
      console.log('📊 Existing user video actions after new user joined:', existingUserVideoActions)
      
      // CRITICAL TEST: Existing user's video should NOT have restarted from 0s
      const hasRestartFromZero = existingUserVideoActions.some(msg => 
        (msg.includes('play at 0s') || msg.includes('play at 0.0')) && !msg.includes('direct sync')
      )
      
      console.log('🎯 Video restarted from zero:', hasRestartFromZero)
      console.log('🎯 Existing user video restarted flag:', existingUserVideoRestarted)
      
      // The fix should prevent existing user's video from restarting
      expect(hasRestartFromZero).toBeFalsy()
      expect(existingUserVideoRestarted).toBeFalsy()
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})