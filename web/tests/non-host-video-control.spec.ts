import { test, expect } from '@playwright/test'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

test.describe('Non-Host Video Control', () => {
  test('all users can control video regardless of role', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()  
    const host = await context1.newPage()
    const nonHost = await context2.newPage()
    
    // Track sync messages
    const hostSyncMessages: string[] = []
    const nonHostSyncMessages: string[] = []
    
    host.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        hostSyncMessages.push(text)
      }
    })
    
    nonHost.on('console', msg => {
      const text = msg.text()
      if (text.includes('YouTubePlayer: Applying sync state')) {
        nonHostSyncMessages.push(text)
      }
    })
    
    try {
      // Host creates session
      await host.goto('/login')
      await host.locator('[data-testid="guest-name-input"]').fill('Host User')
      await host.locator('[data-testid="guest-login-button"]').click()
      await host.waitForURL('/')
      
      await host.locator('[data-testid="create-session-button"]').click()
      await host.locator('.modal input[name="title"]').fill('Simple Control Test')
      await host.locator('.modal button[type="submit"]').click()
      await host.waitForURL(/\/session\//)
      
      const sessionId = host.url().split('/session/')[1]
      
      // Set video
      await host.locator('input[placeholder*="youtube"]').fill(TEST_VIDEO_URL)
      await host.locator('[data-testid="set-video-button"]').click()
      await host.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await host.waitForTimeout(3000)
      
      // Non-host joins
      await nonHost.goto('/login')
      await nonHost.locator('[data-testid="guest-name-input"]').fill('Non-Host User')
      await nonHost.locator('[data-testid="guest-login-button"]').click()
      await nonHost.waitForURL('/')
      
      await nonHost.goto(`/session/${sessionId}`)
      await nonHost.waitForLoadState('networkidle')
      await nonHost.locator('iframe').waitFor({ state: 'visible', timeout: 15000 })
      await nonHost.waitForTimeout(3000)
      
      // Simple test: Non-host clicks play from beginning
      hostSyncMessages.length = 0
      nonHostSyncMessages.length = 0
      
      // Non-host clicks to play
      await nonHost.locator('iframe').click()
      await nonHost.waitForTimeout(4000)
      
      // Check if host received ANY sync from non-host
      const hostReceivedSync = hostSyncMessages.length > 0
      console.log('Host received any sync from non-host:', hostReceivedSync)
      console.log('Host messages:', hostSyncMessages)
      
      expect(hostReceivedSync).toBeTruthy()
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})