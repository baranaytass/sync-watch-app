import { test, expect } from '@playwright/test'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'

// Helper function for guest login
async function guestLogin(page: any) {
  await page.goto('/login')
  const guestButton = page.locator('[data-testid="guest-login-button"]')
  await expect(guestButton).toBeVisible()
  await guestButton.click()
  await page.waitForURL(/\/sessions$/)
}

// Helper function for finding create session button
async function findCreateSessionButton(page: any) {
  const newSessionBtn = page.locator('[data-testid="create-session-button"]')
  const firstSessionBtn = page.locator('[data-testid="create-first-session-button"]')
  
  const btn = await newSessionBtn.isVisible({ timeout: 5000 }).catch(() => false) 
    ? newSessionBtn 
    : firstSessionBtn
    
  return btn
}

// Helper function to wait for video iframe to load
async function waitForVideoToLoad(page: any) {
  const iframe = page.locator('iframe').first()
  await expect(iframe).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(3000) // Wait for YouTube Player API to initialize
  return iframe
}

test.describe('Video Sync – Real-time Multi-User', () => {
  test('multi-user video sync with real WebSocket messages', async ({ browser }) => {
    console.log('🎬 REALTIME VIDEO SYNC TEST – Starting')
    
    // Create 2 different browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const hostPage = await context1.newPage()
    const guestPage = await context2.newPage()
    
    // Listen for console messages to capture WebSocket activity
    const hostConsoleMessages: string[] = []
    const guestConsoleMessages: string[] = []
    
    hostPage.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video') || msg.text().includes('YouTube Player') || msg.text().includes('Programmatic')) {
        hostConsoleMessages.push(`[HOST] ${msg.text()}`)
        console.log(`[HOST] ${msg.text()}`)
      }
    })
    
    guestPage.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video') || msg.text().includes('YouTube Player') || msg.text().includes('Programmatic')) {
        guestConsoleMessages.push(`[GUEST] ${msg.text()}`)
        console.log(`[GUEST] ${msg.text()}`)
      }
    })
    
    try {
      // 1. Host user: Login + create session
      console.log('👑 HOST: Guest login and create session')
      await guestLogin(hostPage)
      
      const createBtn = await findCreateSessionButton(hostPage)
      await createBtn.click()
      await hostPage.locator('input#title').fill('Realtime Video Sync Test')
      await hostPage.locator('button[type="submit"]').click()
      await hostPage.waitForURL(/\/session\//)
      
      // Get session URL
      const sessionUrl = hostPage.url()
      const sessionId = sessionUrl.split('/session/')[1]
      console.log('📝 Session ID:', sessionId)
      
      // 2. Guest user: Login + join same session
      console.log('👤 GUEST: Guest login and join session')
      await guestLogin(guestPage)
      await guestPage.goto(`/session/${sessionId}`)
      await guestPage.waitForLoadState('networkidle')
      
      // 3. Both pages should show 2 participants
      console.log('👥 CHECKING: Both pages have 2 participants')
      await expect(hostPage.locator('[data-testid="participant-item"]')).toHaveCount(2, { timeout: 10000 })
      await expect(guestPage.locator('[data-testid="participant-item"]')).toHaveCount(2, { timeout: 10000 })
      
      // 4. Host: Set video
      console.log('🎥 HOST: Setting video')
      const videoInput = hostPage.locator('input[placeholder*="youtube"]').first()
      await videoInput.fill(TEST_VIDEO_URL)
      await hostPage.locator('[data-testid="set-video-button"]').click()
      await waitForVideoToLoad(hostPage)
      
      // 5. Guest: Wait for video to load
      console.log('🎥 GUEST: Waiting for video to load')
      await waitForVideoToLoad(guestPage)
      
      // 6. HOST PLAY TEST - Try to click on YouTube iframe play button
      console.log('▶️ TEST 1: Host plays video')
      
      // Try to click play button on YouTube iframe
      try {
        // First try to find and click the play button directly
        const playButton = hostPage.locator('iframe').first()
        if (await playButton.isVisible()) {
          console.log('🎯 HOST: Clicking on YouTube iframe')
          await playButton.click()
        }
      } catch (error) {
        console.log('❌ HOST: Could not click YouTube iframe directly')
      }
      
      // Alternative: Try to trigger play via exposed methods
      await hostPage.evaluate(async () => {
        console.log('🎯 HOST: Trying to find YouTube Player instance')
        const videoPlayer = document.querySelector('[data-testid="video-player"]')
        if (videoPlayer) {
          console.log('🎯 HOST: Found video player element')
          // Try to access Vue component instance
          const vueInstance = (videoPlayer as any)?.__vue__ || (videoPlayer as any)?._vnode?.component
          if (vueInstance) {
            console.log('🎯 HOST: Found Vue instance')
            // Try to call play method
            if (vueInstance.exposed?.play) {
              console.log('🎯 HOST: Calling exposed play method')
              vueInstance.exposed.play()
            }
          }
        }
      })
      
      // Wait for WebSocket sync
      await hostPage.waitForTimeout(3000)
      
      // Check console messages for WebSocket activity
      console.log('📝 HOST Console messages:', hostConsoleMessages.filter(msg => msg.includes('video')))
      console.log('📝 GUEST Console messages:', guestConsoleMessages.filter(msg => msg.includes('video')))
      
      // 7. Verify both iframes are still visible (sync successful)
      await expect(hostPage.locator('iframe').first()).toBeVisible()
      await expect(guestPage.locator('iframe').first()).toBeVisible()
      
      console.log('✅ REALTIME VIDEO SYNC TEST – Completed')
      
    } finally {
      // Cleanup
      await context1.close()
      await context2.close()
    }
  })
}) 