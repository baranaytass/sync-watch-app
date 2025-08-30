import { test, expect } from '@playwright/test'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Shorter video for faster testing

test.describe('Video Sync – Core Functionality', () => {
  
  test('two users can sync video playback', async ({ browser }) => {
    // Create 2 browser contexts for two users
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const user1 = await context1.newPage()
    const user2 = await context2.newPage()
    
    // Track console messages to verify sync is working
    const user1SyncMessages: string[] = []
    const user2SyncMessages: string[] = []
    
    user1.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        user1SyncMessages.push(text)
      }
    })
    
    user2.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        user2SyncMessages.push(text)
      }
    })
    
    try {
      // User 1 creates session and sets video
      await user1.goto('/login')
      await user1.locator('[data-testid="guest-name-input"]').fill('User 1')
      await user1.locator('[data-testid="guest-login-button"]').click()
      await user1.waitForURL('/')
      
      // Create session
      await user1.locator('[data-testid="create-session-button"]').click()
      await user1.locator('.modal input[name="title"]').fill('Sync Test')
      await user1.locator('.modal button[type="submit"]').click()
      await user1.waitForURL(/\/session\//)
      
      // Get session ID for user 2
      const sessionId = user1.url().split('/session/')[1]
      
      // Set video
      const videoInput = user1.locator('input[placeholder*="youtube"]')
      await videoInput.fill(TEST_VIDEO_URL)
      await user1.locator('[data-testid="set-video-button"]').click()
      
      // Wait for video to load
      await user1.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user1.waitForTimeout(3000)
      
      // User 2 joins session
      await user2.goto('/login')
      await user2.locator('[data-testid="guest-name-input"]').fill('User 2')
      await user2.locator('[data-testid="guest-login-button"]').click()
      await user2.waitForURL('/')
      
      await user2.goto(`/session/${sessionId}`)
      await user2.waitForLoadState('networkidle')
      
      // Wait for video to load for user 2
      await user2.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user2.waitForTimeout(3000)
      
      // Verify both users see the video
      await expect(user1.locator('iframe')).toBeVisible()
      await expect(user2.locator('iframe')).toBeVisible()
      
      // Test sync: User 1 plays video
      await user1.locator('iframe').click() // play
      await user1.waitForTimeout(3000) // Wait for sync to propagate
      
      // User 2 should have received sync play message
      expect(user2SyncMessages.some(msg => msg.includes('YouTubePlayer: Applying sync state - play'))).toBeTruthy()
      
      // Test sync: User 1 pauses video  
      await user1.locator('iframe').click() // pause
      await user1.waitForTimeout(3000) // Wait for sync to propagate
      
      // User 2 should have received sync pause message
      expect(user2SyncMessages.some(msg => msg.includes('YouTubePlayer: Applying sync state - pause'))).toBeTruthy()
      
      // Both videos should still be visible and working
      await expect(user1.locator('iframe')).toBeVisible()
      await expect(user2.locator('iframe')).toBeVisible()
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })
  
  test('video sync works when user joins during playback', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const host = await context1.newPage()
    const joiner = await context2.newPage()
    
    // Track sync messages for joining user
    const joinerSyncMessages: string[] = []
    
    joiner.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        joinerSyncMessages.push(text)
      }
    })
    
    try {
      // Host creates session and starts video
      await host.goto('/login')
      await host.locator('[data-testid="guest-name-input"]').fill('Host')
      await host.locator('[data-testid="guest-login-button"]').click()
      await host.waitForURL('/')
      
      await host.locator('[data-testid="create-session-button"]').click()
      await host.locator('.modal input[name="title"]').fill('Join During Play Test')
      await host.locator('.modal button[type="submit"]').click()
      await host.waitForURL(/\/session\//)
      
      const sessionId = host.url().split('/session/')[1]
      
      // Set video
      await host.locator('input[placeholder*="youtube"]').fill(TEST_VIDEO_URL)
      await host.locator('[data-testid="set-video-button"]').click()
      await host.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await host.waitForTimeout(3000)
      
      // Start playback
      await host.locator('iframe').click() // play
      await host.waitForTimeout(5000) // let it play for 5 seconds
      
      // User joins while video is playing
      await joiner.goto('/login')
      await joiner.locator('[data-testid="guest-name-input"]').fill('Joiner')
      await joiner.locator('[data-testid="guest-login-button"]').click()
      await joiner.waitForURL('/')
      
      await joiner.goto(`/session/${sessionId}`)
      await joiner.waitForLoadState('networkidle')
      await joiner.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await joiner.waitForTimeout(5000) // Wait for initial sync state to be applied
      
      // Verify both users can see the video
      await expect(host.locator('iframe')).toBeVisible()
      await expect(joiner.locator('iframe')).toBeVisible()
      
      // Joining user should have received initial sync state (play)
      expect(joinerSyncMessages.some(msg => msg.includes('YouTubePlayer: Applying sync state - play'))).toBeTruthy()
      
      // Test that subsequent sync works - host pauses
      await host.locator('iframe').click() // pause
      await host.waitForTimeout(3000)
      
      // Joiner should receive pause sync
      expect(joinerSyncMessages.some(msg => msg.includes('YouTubePlayer: Applying sync state - pause'))).toBeTruthy()
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('three users sync correctly', async ({ browser }) => {
    // Create 3 browser contexts for multi-user testing
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const context3 = await browser.newContext()
    const user1 = await context1.newPage()
    const user2 = await context2.newPage()
    const user3 = await context3.newPage()
    
    // Track sync messages for receiver users only (not the action trigger)
    const user1SyncMessages: string[] = []
    const user2SyncMessages: string[] = []
    const user3SyncMessages: string[] = []
    
    user1.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        user1SyncMessages.push(text)
      }
    })
    
    user2.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        user2SyncMessages.push(text)
      }
    })
    
    user3.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        user3SyncMessages.push(text)
      }
    })
    
    try {
      // User 1 creates session and sets video
      await user1.goto('/login')
      await user1.locator('[data-testid="guest-name-input"]').fill('User 1')
      await user1.locator('[data-testid="guest-login-button"]').click()
      await user1.waitForURL('/')
      
      await user1.locator('[data-testid="create-session-button"]').click()
      await user1.locator('.modal input[name="title"]').fill('Multi-User Sync Test')
      await user1.locator('.modal button[type="submit"]').click()
      await user1.waitForURL(/\/session\//)
      
      const sessionId = user1.url().split('/session/')[1]
      
      // Set video
      const videoInput = user1.locator('input[placeholder*="youtube"]')
      await videoInput.fill(TEST_VIDEO_URL)
      await user1.locator('[data-testid="set-video-button"]').click()
      await user1.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user1.waitForTimeout(3000)
      
      // Users 2 and 3 join
      await user2.goto('/login')
      await user2.locator('[data-testid="guest-name-input"]').fill('User 2')  
      await user2.locator('[data-testid="guest-login-button"]').click()
      await user2.waitForURL('/')
      await user2.goto(`/session/${sessionId}`)
      await user2.waitForLoadState('networkidle')
      await user2.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user2.waitForTimeout(3000)
      
      await user3.goto('/login')
      await user3.locator('[data-testid="guest-name-input"]').fill('User 3')
      await user3.locator('[data-testid="guest-login-button"]').click() 
      await user3.waitForURL('/')
      await user3.goto(`/session/${sessionId}`)
      await user3.waitForLoadState('networkidle')
      await user3.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await user3.waitForTimeout(3000)
      
      // Test: User1 plays video - User2 and User3 should receive sync
      await user1.locator('iframe').click() // play
      await user1.waitForTimeout(4000)
      
      // Verify other users received the play sync
      expect(user2SyncMessages.some(msg => msg.includes('YouTubePlayer: Applying sync state - play'))).toBeTruthy()
      expect(user3SyncMessages.some(msg => msg.includes('YouTubePlayer: Applying sync state - play'))).toBeTruthy()
      
      // All users should still have video visible
      await expect(user1.locator('iframe')).toBeVisible()
      await expect(user2.locator('iframe')).toBeVisible() 
      await expect(user3.locator('iframe')).toBeVisible()
      
    } finally {
      await context1.close()
      await context2.close()
      await context3.close()
    }
  })
  
})