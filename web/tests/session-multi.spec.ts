import { test, expect } from '@playwright/test'

const guestLogin = async (page: any) => {
  await page.goto('/')
  const guestBtn = page.getByRole('button', { name: /Misafir Olarak Giriş/i })
  if (await guestBtn.isVisible()) {
    await guestBtn.click()
    await page.waitForURL(/\/sessions$/)
  }
}

const createSession = async (page: any, title: string): Promise<string> => {
  await page.goto('/sessions')
  await page.waitForLoadState('networkidle')
  
  // Oturum oluştur butonunu bul (ya "Yeni Oturum" ya da "İlk Oturumu Oluştur")
  const newSessionBtn = page.getByRole('button', { name: /Yeni Oturum/i }).first()
  const firstSessionBtn = page.getByRole('button', { name: /İlk Oturumu Oluştur/i }).first()
  
  // Hangisi görünürse onu kullan
  const createBtn = await newSessionBtn.isVisible({ timeout: 5000 }).catch(() => false) 
    ? newSessionBtn 
    : firstSessionBtn
  
  await expect(createBtn).toBeVisible()
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
      const header = page.locator('h3', { hasText: 'Katılımcılar' })
      await expect(header).toHaveText(new RegExp(`\\(${expected}\\)`), { timeout: 10000 })
    }

    console.log('🔍 [ASSERT] Waiting for 2 participants on both views')
    await Promise.all([
      waitForParticipantCount(pageHost, 2),
      waitForParticipantCount(pageGuest, 2),
    ])

    // 4) Guest user leaves the session
    console.log('👋 [GUEST] Leaving the session')
    await pageGuest.getByRole('button', { name: /^Ayrıl$/i }).click()
    await pageGuest.waitForURL(/\/sessions$/)

    // 5) Host page should update participant count back to 1
    console.log('🔍 [ASSERT] Host sees participant count drop to 1')
    await waitForParticipantCount(pageHost, 1)

    // Clean-up contexts
    await ctxGuest.close()
    await ctxHost.close()
  })
}) 