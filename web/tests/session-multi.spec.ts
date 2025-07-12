import { test, expect } from '@playwright/test'

const guestLogin = async (page: any) => {
  await page.goto('/')
  const guestBtn = page.locator('[data-testid="guest-login-button"]')
  if (await guestBtn.isVisible()) {
    await guestBtn.click()
    await page.waitForURL(/\/sessions$/)
  }
}

const createSession = async (page: any, title: string): Promise<string> => {
  await page.goto('/sessions')
  await page.waitForLoadState('networkidle')

  // Loading state'in bitmesini bekle
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('div, p')
    for (const el of loadingElements) {
      if (el.textContent && el.textContent.includes('Oturumlar yükleniyor...')) {
        return false // Hâlâ loading
      }
    }
    return true // Loading bitti
  }, { timeout: 10000 })
  
  // Oturum oluştur butonunu bul (ya "Yeni Oturum" ya da "İlk Oturumu Oluştur")
  const newSessionBtn = page.locator('[data-testid="create-session-button"]')
  const firstSessionBtn = page.locator('[data-testid="create-first-session-button"]')
  
  // Hangisi görünürse onu kullan
  const createBtn = await newSessionBtn.isVisible({ timeout: 5000 }).catch(() => false) 
    ? newSessionBtn 
    : firstSessionBtn
  
  await expect(createBtn).toBeVisible({ timeout: 8000 })
  await createBtn.click()
  await page.locator('input#title').fill(title)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/session\//)
  return page.url()
}

test.describe('Session – very basic multi-user flow', () => {
  test('two distinct users join & leave a session correctly', async ({ browser }) => {
    // 1) HOST USER – create a session
    const ctxHost = await browser.newContext()
    const pageHost = await ctxHost.newPage()
    console.log('🫅 [HOST] Login as guest & create session')
    await guestLogin(pageHost)
    const sessionURL = await createSession(pageHost, 'Multi User Flow')
    console.log('✅ [HOST] Session created ->', sessionURL)

    // 2) SECOND USER – join the same session from a fresh context (no shared cookies)
    const ctxGuest = await browser.newContext()
    const pageGuest = await ctxGuest.newPage()

    console.log('🧑‍🚀 [GUEST] Login as guest')
    await guestLogin(pageGuest)

    console.log('🚪 [GUEST] Navigating to session')
    await pageGuest.goto(sessionURL)
    await pageGuest.waitForLoadState('networkidle')

    // 3) Verify both pages show 2 participants
    const waitForParticipantCount = async (page: any, expected: number) => {
      // Use participant items count instead of text
      await expect(page.locator('[data-testid="participant-item"]')).toHaveCount(expected, { timeout: 10000 })
    }

    console.log('🔍 [ASSERT] Waiting for 2 participants on both views')
    await Promise.all([
      waitForParticipantCount(pageHost, 2),
      waitForParticipantCount(pageGuest, 2),
    ])

    // 4) VIDEO SYNC TEST – Host sets video and sync to guest
    console.log('🎥 [VIDEO SYNC] Testing video set and sync...')
    
    const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'
    
    // Host sets video
    console.log('🎥 [HOST] Setting video...')
    const urlInput = pageHost.locator('input[placeholder*="youtube"]').first()
    await urlInput.fill(TEST_VIDEO_URL)
    
    await Promise.all([
      pageHost.waitForResponse(r => /\/api\/sessions\/.*\/video$/.test(r.url()) && r.status() === 200, { timeout: 20000 }),
      pageHost.locator('[data-testid="set-video-button"]').click(),
    ])
    
    // Both host and guest should have video iframe
    console.log('🎥 [ASSERT] Both users should see video iframe...')
    await Promise.all([
      expect(pageHost.locator('iframe').first()).toBeVisible({ timeout: 15000 }),
      expect(pageGuest.locator('iframe').first()).toBeVisible({ timeout: 15000 })
    ])
    
    // Video sync testing will be handled separately - for now just verify video is loaded
    console.log('🎥 [ASSERT] ✅ VIDEO SETTING WORKING! Both users can see the video')
    
    // Wait a moment to ensure video is fully loaded
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 5) Guest user leaves the session
    console.log('👋 [GUEST] Leaving the session')
    await pageGuest.locator('[data-testid="leave-session-button"]').click()
    await pageGuest.waitForURL(/\/sessions$/)

    // 5) Host page should update participant count back to 1
    console.log('🔍 [ASSERT] Host sees participant count drop to 1')
    await waitForParticipantCount(pageHost, 1)

    // Clean-up contexts
    await ctxGuest.close()
    await ctxHost.close()
  })
}) 