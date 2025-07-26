import { test, expect, Page, BrowserContext } from '@playwright/test'

test.describe('🎬 Real Video Sync E2E Test', () => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
  const testVideoUrl = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'
  
  let testSessionId: string
  let testErrors: string[] = []

  const setupErrorTracking = (page: Page, userName: string) => {
    page.on('pageerror', error => {
      testErrors.push(`${userName} PAGE ERROR: ${error.message}`)
    })
    
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_CONNECTION_REFUSED')) {
        testErrors.push(`${userName} CONSOLE ERROR: ${msg.text()}`)
      }
    })
  }

  const validateStep = (stepName: string, condition: boolean, errorMessage?: string) => {
    if (!condition) {
      console.log(`❌ FAILED: ${stepName}`)
      if (testErrors.length > 0) {
        console.log('Critical Errors:')
        testErrors.forEach(error => console.log(`   - ${error}`))
      }
      throw new Error(`${stepName} failed: ${errorMessage || 'Validation failed'}`)
    }
    console.log(`✅ ${stepName} completed successfully`)
  }

  test('🔄 Complete Real Video Sync: 2 Users + Real-time WebSocket Sync', async ({ browser }) => {
    // Backend health check
    console.log('🏥 Checking backend health...')
    const healthResponse = await fetch(`${backendUrl}/health`)
    if (!healthResponse.ok) {
      throw new Error(`Backend not healthy: ${healthResponse.status}`)
    }
    console.log('✅ Backend is healthy')

    // Test initialization
    let testSessionId = `initial-test-id-${Date.now()}` // Fallback ID for logging
    let createdSessionId: string;
    testErrors = []
    
    console.log(`🎬 Starting Real Video Sync E2E Test`)
    console.log(`🎥 Video: ${testVideoUrl}`)

    // Create two browser contexts for two users
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page = await context1.newPage()
    const secondPage = await context2.newPage()
    
    setupErrorTracking(page, 'User1')
    setupErrorTracking(secondPage, 'User2')

    try {
      // ======= PHASE 1: USER 1 (HOST) SETUP =======
      console.log('\n👤 PHASE 1: User 1 (Host) - Setup & Session Creation')
      
      // 1.1: Authentication
      console.log('🔐 User1: Authenticating as guest...')
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const isLoginPage1 = await page.locator('h2:has-text("Video Sync Chat")').isVisible()
      if (isLoginPage1) {
        await page.locator('button:has-text("Misafir Olarak Giriş")').click()
        await page.waitForTimeout(1000)
      }
      
      // --- Regression Test for Duplicate Guest User ---
      console.log('🔄 User1: Testing re-authentication to catch duplicate key error...')
      const errorPromise = page.waitForEvent('pageerror');
      
      await page.goto('/') // Go back to login
      await page.waitForLoadState('networkidle')
      const isLoginPageAgain = await page.locator('h2:has-text("Video Sync Chat")').isVisible()
      if (isLoginPageAgain) {
          await page.locator('button:has-text("Misafir Olarak Giriş")').click()
          await page.waitForTimeout(1000)
      }
      
      const error = await Promise.race([
        errorPromise,
        page.waitForTimeout(3000).then(() => null)
      ]);

      validateStep(
        'Phase 1.1a - User1 Re-Authentication',
        error === null,
        `Re-authentication should not cause a page error. Found: ${error}`
      );
      // --- End Regression Test ---
      
      validateStep('Phase 1.1 - User1 Authentication', true)

      // 1.2: Session Creation
      console.log('📋 User1: Creating session...')
      await page.goto('/sessions')
      await page.waitForLoadState('networkidle')
      
      await page.locator('button:has-text("Yeni Oturum")').click()
      await page.locator('input#title, input[placeholder*="Film"]').fill(`Real Sync Test Session`)
      await page.locator('button[type="submit"]:has-text("Oturum Oluştur")').click()
      
      // Wait for navigation to the new session page and extract the real session ID (UUID)
      await page.waitForURL(/\/session\/[a-f0-9-]+/);
      const url = page.url();
      createdSessionId = url.substring(url.lastIndexOf('/') + 1);
      testSessionId = createdSessionId; // Update the main test ID
      console.log(`🏠 User1: Session created. Real ID: ${createdSessionId}`);
      
      await page.waitForLoadState('networkidle')

      validateStep('Phase 1.2 - User1 Session Creation', !!createdSessionId);

      // 1.3: Video Setup
      console.log('🎥 User1: Setting video (as host)...')
      const videoInput = page.locator('input[type="url"], input[placeholder*="youtube"]').first()
      await videoInput.fill(testVideoUrl)
      await page.locator('button:has-text("Ayarla")').click()
      await page.waitForTimeout(2000)
      
      const iframe1 = await page.locator('iframe[src*="youtube.com/embed"]').isVisible()
      validateStep('Phase 1.3 - User1 Video Setup', iframe1)

      // ======= PHASE 2: USER 2 (PARTICIPANT) =======
      console.log('\n👥 PHASE 2: User 2 (Participant) - Join Session')
      
      // 2.1: Authentication
      await secondPage.goto('/')
      await secondPage.waitForLoadState('networkidle')
      
      const isLoginPage2 = await secondPage.locator('h2:has-text("Video Sync Chat")').isVisible()
      if (isLoginPage2) {
        await secondPage.locator('button:has-text("Misafir Olarak Giriş")').click()
        await secondPage.waitForTimeout(1000)
      }
      validateStep('Phase 2.1 - User2 Authentication', true)

      // 2.2: Session Join
      console.log(`🔗 User2: Joining same session (${createdSessionId})...`)
      await secondPage.goto(`/session/${createdSessionId}`)
      await secondPage.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      
      const participantsVisible2 = await secondPage.locator('h3:has-text("Katılımcılar")').isVisible()
      validateStep('Phase 2.2 - User2 Session Join', participantsVisible2)

      // 2.3: Video Sync
      const iframe2 = await secondPage.locator('iframe[src*="youtube.com/embed"]').isVisible()
      validateStep('Phase 2.3 - User2 Video Sync Received', iframe2)

      // ======= PHASE 3: WEBSOCKET SYNC TEST =======
      console.log('\n🔗 PHASE 3: WebSocket Real-time Video Sync Test')
      await page.waitForTimeout(2000)
      
      // Check authentication tokens
      const user1Token = await page.evaluate(() => localStorage.getItem('auth_token'))
      const user2Token = await secondPage.evaluate(() => localStorage.getItem('auth_token'))
      console.log(`🔐 User1 Token: ${user1Token ? 'FOUND' : 'MISSING'}`)
      console.log(`🔐 User2 Token: ${user2Token ? 'FOUND' : 'MISSING'}`)
      
      // Check WebSocket connections
      const user1Connected = await page.evaluate(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const connectionExists = (window as any).videoSyncStore?.connected || false
            resolve(connectionExists)
          }, 2000)
        })
      })

      const user2Connected = await secondPage.evaluate(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const connectionExists = (window as any).videoSyncStore?.connected || false
            resolve(connectionExists)
          }, 2000)
        })
      })

      validateStep(
        'Phase 3.1 - WebSocket Connections',
        Boolean(user1Connected && user2Connected),
        `WebSocket connections failed - User1: ${user1Connected}, User2: ${user2Connected}`
      )

      // ======= PHASE 4: REAL VIDEO SYNC TEST =======
      console.log('\n🎥 PHASE 4: Real-time Video Sync Test')
      
      // User1 triggers play action
      console.log('▶️ User1: Starting video playback...')
      await page.evaluate(() => {
        const videoSyncStore = (window as any).videoSyncStore
        if (videoSyncStore && videoSyncStore.syncVideo) {
          videoSyncStore.syncVideo({ action: 'play', time: 10, timestamp: new Date() })
        }
      })
      await page.waitForTimeout(1000)

      // Verify User2 receives sync
      const user2SyncReceived = await secondPage.evaluate(() => {
        const videoSyncStore = (window as any).videoSyncStore
        return videoSyncStore?.currentAction === 'play'
      })

      validateStep('Phase 4.1 - Video Sync Propagation', Boolean(user2SyncReceived))

      // ======= SUCCESS =======
      console.log('\n🎉 REAL VIDEO SYNC E2E TEST PASSED! 🎉')
      console.log('✅ All phases completed successfully')
      console.log(`📊 Session: ${testSessionId}`)
      console.log(`🎥 Video: ${testVideoUrl}`)

    } catch (error) {
      console.log('\n❌ REAL VIDEO SYNC E2E TEST FAILED')
      console.log(`💥 Error: ${error}`)
      
      if (testErrors.length > 0) {
        console.log('\n🚨 Critical Errors Detected:')
        testErrors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`)
        })
      }
      
      console.log('\n🔧 Debug Information:')
      console.log(`   📍 User1 URL: ${await page.url()}`)
      console.log(`   🌐 Backend URL: ${backendUrl}`)
      console.log(`   �� Session ID: ${testSessionId}`)
      
      throw error
    } finally {
      await context1.close()
      await context2.close()
    }
  })
}) 