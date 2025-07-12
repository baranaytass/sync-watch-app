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

// Helper function to trigger video play/pause via click
async function triggerVideoAction(page: any, action: 'play' | 'pause', userLabel: string) {
  try {
    console.log(`🎯 ${userLabel}: Triggering ${action}`)
    
    // Try clicking on iframe
    const iframe = page.locator('iframe').first()
    if (await iframe.isVisible()) {
      await iframe.click()
      console.log(`🎯 ${userLabel}: Clicked on YouTube iframe for ${action}`)
    }
    
    // Alternative: Try exposed methods
    await page.evaluate(async (actionType: string) => {
      const videoPlayer = document.querySelector('[data-testid="video-player"]')
      if (videoPlayer) {
        const vueInstance = (videoPlayer as any)?.__vue__ || (videoPlayer as any)?._vnode?.component
        if (vueInstance?.exposed?.[actionType]) {
          console.log(`🎯 Calling exposed ${actionType} method`)
          vueInstance.exposed[actionType]()
        }
      }
    }, action)
    
    // Wait for action to be processed
    await page.waitForTimeout(1000)
    
  } catch (error) {
    console.log(`❌ ${userLabel}: Could not trigger ${action}:`, error)
  }
}

test.describe('Video Sync – Advanced Scenarios', () => {
  
  test('complex multi-user play/pause sequences', async ({ browser }) => {
    console.log('🎬 ADVANCED VIDEO SYNC TEST – Complex Play/Pause Sequences')
    
    // Create 2 different browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const user1Page = await context1.newPage()
    const user2Page = await context2.newPage()
    
    // Console message tracking
    const user1Messages: string[] = []
    const user2Messages: string[] = []
    
    user1Page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video') || msg.text().includes('YouTube Player')) {
        user1Messages.push(`[USER1] ${msg.text()}`)
        console.log(`[USER1] ${msg.text()}`)
      }
    })
    
    user2Page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video') || msg.text().includes('YouTube Player')) {
        user2Messages.push(`[USER2] ${msg.text()}`)
        console.log(`[USER2] ${msg.text()}`)
      }
    })
    
    try {
      // 1. Setup: User 1 creates session, User 2 joins
      console.log('👑 USER1: Creating session')
      await guestLogin(user1Page)
      const createBtn = await findCreateSessionButton(user1Page)
      await createBtn.click()
      await user1Page.locator('input#title').fill('Advanced Video Sync Test')
      await user1Page.locator('button[type="submit"]').click()
      await user1Page.waitForURL(/\/session\//)
      
      const sessionUrl = user1Page.url()
      const sessionId = sessionUrl.split('/session/')[1]
      console.log('📝 Session ID:', sessionId)
      
      console.log('👤 USER2: Joining session')
      await guestLogin(user2Page)
      await user2Page.goto(`/session/${sessionId}`)
      await user2Page.waitForLoadState('networkidle')
      
      // 2. Setup video
      console.log('🎥 USER1: Setting video')
      const videoInput = user1Page.locator('input[placeholder*="youtube"]').first()
      await videoInput.fill(TEST_VIDEO_URL)
      await user1Page.locator('[data-testid="set-video-button"]').click()
      await waitForVideoToLoad(user1Page)
      await waitForVideoToLoad(user2Page)
      
      // 3. Complex play/pause sequence
      console.log('🎮 STARTING COMPLEX PLAY/PAUSE SEQUENCE')
      
      // Scenario: User2 plays, User2 pauses, User2 plays, User1 pauses
      console.log('📋 SCENARIO: User2 plays → User2 pauses → User2 plays → User1 pauses')
      
      console.log('▶️ STEP 1: User2 plays video')
      await triggerVideoAction(user2Page, 'play', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      console.log('⏸️ STEP 2: User2 pauses video')
      await triggerVideoAction(user2Page, 'pause', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      console.log('▶️ STEP 3: User2 plays video again')
      await triggerVideoAction(user2Page, 'play', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      console.log('⏸️ STEP 4: User1 pauses video')
      await triggerVideoAction(user1Page, 'pause', 'USER1')
      await user1Page.waitForTimeout(2000)
      
      console.log('▶️ STEP 5: User1 plays video')
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(2000)
      
      console.log('⏸️ STEP 6: User2 pauses video again')
      await triggerVideoAction(user2Page, 'pause', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      // Analyze results
      console.log('📊 ANALYZING RESULTS:')
      console.log('USER1 video messages:', user1Messages.filter(msg => msg.includes('video-action') || msg.includes('User clicked')))
      console.log('USER2 video messages:', user2Messages.filter(msg => msg.includes('video-action') || msg.includes('User clicked')))
      
      // Verify both players are still working
      await expect(user1Page.locator('iframe').first()).toBeVisible()
      await expect(user2Page.locator('iframe').first()).toBeVisible()
      
      console.log('✅ COMPLEX PLAY/PAUSE SEQUENCE – Completed')
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('third user joins during active video playback', async ({ browser }) => {
    console.log('🎬 THIRD USER JOIN TEST – User joins during active video')
    
    // Create 3 different browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const context3 = await browser.newContext()
    const user1Page = await context1.newPage()
    const user2Page = await context2.newPage()
    const user3Page = await context3.newPage()
    
    // Console message tracking
    const user1Messages: string[] = []
    const user2Messages: string[] = []
    const user3Messages: string[] = []
    
    user1Page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video') || msg.text().includes('YouTube Player')) {
        user1Messages.push(`[USER1] ${msg.text()}`)
        console.log(`[USER1] ${msg.text()}`)
      }
    })
    
    user2Page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video') || msg.text().includes('YouTube Player')) {
        user2Messages.push(`[USER2] ${msg.text()}`)
        console.log(`[USER2] ${msg.text()}`)
      }
    })
    
    user3Page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video') || msg.text().includes('YouTube Player')) {
        user3Messages.push(`[USER3] ${msg.text()}`)
        console.log(`[USER3] ${msg.text()}`)
      }
    })
    
    try {
      // 1. Setup: User 1 creates session, User 2 joins
      console.log('👑 USER1: Creating session')
      await guestLogin(user1Page)
      const createBtn = await findCreateSessionButton(user1Page)
      await createBtn.click()
      await user1Page.locator('input#title').fill('Third User Join Test')
      await user1Page.locator('button[type="submit"]').click()
      await user1Page.waitForURL(/\/session\//)
      
      const sessionUrl = user1Page.url()
      const sessionId = sessionUrl.split('/session/')[1]
      console.log('📝 Session ID:', sessionId)
      
      console.log('👤 USER2: Joining session')
      await guestLogin(user2Page)
      await user2Page.goto(`/session/${sessionId}`)
      await user2Page.waitForLoadState('networkidle')
      
      // 2. Setup video and start playing
      console.log('🎥 USER1: Setting video')
      const videoInput = user1Page.locator('input[placeholder*="youtube"]').first()
      await videoInput.fill(TEST_VIDEO_URL)
      await user1Page.locator('[data-testid="set-video-button"]').click()
      await waitForVideoToLoad(user1Page)
      await waitForVideoToLoad(user2Page)
      
      console.log('▶️ USER1: Starting video playback')
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(3000)
      
      // 3. USER3 joins while video is playing
      console.log('👥 USER3: Joining session while video is playing')
      await guestLogin(user3Page)
      await user3Page.goto(`/session/${sessionId}`)
      await user3Page.waitForLoadState('networkidle')
      
      // Wait for User3's video to load and sync
      await waitForVideoToLoad(user3Page)
      await user3Page.waitForTimeout(2000)
      
      // Verify all 3 users see each other
      await expect(user1Page.locator('[data-testid="participant-item"]')).toHaveCount(3, { timeout: 10000 })
      await expect(user2Page.locator('[data-testid="participant-item"]')).toHaveCount(3, { timeout: 10000 })
      await expect(user3Page.locator('[data-testid="participant-item"]')).toHaveCount(3, { timeout: 10000 })
      
      console.log('🎮 USER3: Testing video control after joining')
      
      // 4. User3 pauses the video (should work immediately)
      console.log('⏸️ USER3: Pausing video after joining')
      await triggerVideoAction(user3Page, 'pause', 'USER3')
      await user1Page.waitForTimeout(2000)
      
      // 5. User1 resumes video
      console.log('▶️ USER1: Resuming video')
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(2000)
      
      // 6. User2 pauses video
      console.log('⏸️ USER2: Pausing video')
      await triggerVideoAction(user2Page, 'pause', 'USER2')
      await user1Page.waitForTimeout(2000)
      
      // Analyze results
      console.log('📊 ANALYZING THIRD USER JOIN RESULTS:')
      console.log('USER1 sync messages:', user1Messages.filter(msg => msg.includes('video_sync') || msg.includes('Sync video')))
      console.log('USER2 sync messages:', user2Messages.filter(msg => msg.includes('video_sync') || msg.includes('Sync video')))
      console.log('USER3 sync messages:', user3Messages.filter(msg => msg.includes('video_sync') || msg.includes('Sync video')))
      
      // Verify all players are still working
      await expect(user1Page.locator('iframe').first()).toBeVisible()
      await expect(user2Page.locator('iframe').first()).toBeVisible()
      await expect(user3Page.locator('iframe').first()).toBeVisible()
      
      console.log('✅ THIRD USER JOIN TEST – Completed')
      
    } finally {
      await context1.close()
      await context2.close()
      await context3.close()
    }
  })

  test('rapid play/pause stress test', async ({ browser }) => {
    console.log('🎬 RAPID PLAY/PAUSE STRESS TEST')
    
    // Create 2 different browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const user1Page = await context1.newPage()
    const user2Page = await context2.newPage()
    
    // Console message tracking
    const user1Messages: string[] = []
    const user2Messages: string[] = []
    
    user1Page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video-action') || msg.text().includes('User clicked')) {
        user1Messages.push(`[USER1] ${msg.text()}`)
        console.log(`[USER1] ${msg.text()}`)
      }
    })
    
    user2Page.on('console', (msg) => {
      if (msg.text().includes('WebSocket') || msg.text().includes('video-action') || msg.text().includes('User clicked')) {
        user2Messages.push(`[USER2] ${msg.text()}`)
        console.log(`[USER2] ${msg.text()}`)
      }
    })
    
    try {
      // 1. Setup
      console.log('👑 USER1: Creating session')
      await guestLogin(user1Page)
      const createBtn = await findCreateSessionButton(user1Page)
      await createBtn.click()
      await user1Page.locator('input#title').fill('Rapid Action Stress Test')
      await user1Page.locator('button[type="submit"]').click()
      await user1Page.waitForURL(/\/session\//)
      
      const sessionUrl = user1Page.url()
      const sessionId = sessionUrl.split('/session/')[1]
      
      console.log('👤 USER2: Joining session')
      await guestLogin(user2Page)
      await user2Page.goto(`/session/${sessionId}`)
      await user2Page.waitForLoadState('networkidle')
      
      // 2. Setup video
      const videoInput = user1Page.locator('input[placeholder*="youtube"]').first()
      await videoInput.fill(TEST_VIDEO_URL)
      await user1Page.locator('[data-testid="set-video-button"]').click()
      await waitForVideoToLoad(user1Page)
      await waitForVideoToLoad(user2Page)
      
      // 3. Rapid sequence with shorter waits
      console.log('🚀 RAPID SEQUENCE START')
      
      console.log('▶️ USER1: Play')
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(800)
      
      console.log('⏸️ USER2: Pause')
      await triggerVideoAction(user2Page, 'pause', 'USER2')
      await user1Page.waitForTimeout(800)
      
      console.log('▶️ USER1: Play')
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(800)
      
      console.log('⏸️ USER1: Pause')
      await triggerVideoAction(user1Page, 'pause', 'USER1')
      await user1Page.waitForTimeout(800)
      
      console.log('▶️ USER2: Play')
      await triggerVideoAction(user2Page, 'play', 'USER2')
      await user1Page.waitForTimeout(800)
      
      console.log('⏸️ USER2: Pause')
      await triggerVideoAction(user2Page, 'pause', 'USER2')
      await user1Page.waitForTimeout(800)
      
      console.log('▶️ USER1: Play')
      await triggerVideoAction(user1Page, 'play', 'USER1')
      await user1Page.waitForTimeout(800)
      
      console.log('⏸️ USER1: Final pause')
      await triggerVideoAction(user1Page, 'pause', 'USER1')
      await user1Page.waitForTimeout(1000)
      
      // Count actual WebSocket messages sent
      const user1ActionsSent = user1Messages.filter(msg => msg.includes('Sent video_action')).length
      const user2ActionsSent = user2Messages.filter(msg => msg.includes('Sent video_action')).length
      const user1ActionsReceived = user1Messages.filter(msg => msg.includes('Video sync -')).length
      const user2ActionsReceived = user2Messages.filter(msg => msg.includes('Video sync -')).length
      
      console.log('📊 RAPID TEST RESULTS:')
      console.log(`USER1: Sent ${user1ActionsSent} actions, Received ${user1ActionsReceived} syncs`)
      console.log(`USER2: Sent ${user2ActionsSent} actions, Received ${user2ActionsReceived} syncs`)
      
      // Expected: Each user should send some actions and receive syncs from the other
      expect(user1ActionsSent + user2ActionsSent).toBeGreaterThan(4) // At least some actions sent
      expect(user1ActionsReceived + user2ActionsReceived).toBeGreaterThan(2) // At least some syncs received
      
      console.log('✅ RAPID PLAY/PAUSE STRESS TEST – Completed')
      
    } finally {
      await context1.close()
      await context2.close()
    }
  })
}) 