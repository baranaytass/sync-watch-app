import { test, expect } from '@playwright/test'

const createSession = async (page: any, title: string): Promise<string> => {
  // Sessions list page
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
  const btn = await newSessionBtn.isVisible({ timeout: 5000 }).catch(() => false) 
    ? newSessionBtn 
    : firstSessionBtn
  
  await expect(btn).toBeVisible({ timeout: 8000 })
  await btn.click()

  // Modal içindeki başlık inputu doldur
  await page.locator('input#title').fill(title)
  await page.locator('button[type="submit"]').click()

  // Yönlendirme
  await page.waitForURL(/\/session\//)
  return page.url()
}

test.describe('Session – create & join', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    const guestBtn = page.locator('[data-testid="guest-login-button"]')
    
    if (await guestNameInput.isVisible() && await guestBtn.isVisible()) {
      await guestNameInput.fill('Session Test User')
      await expect(guestBtn).toBeEnabled()
      await guestBtn.click()
      await page.waitForURL(/\/sessions$/)
    }
    console.log('🎬 SESSION TEST – Misafir login')
  })

  test('user can create and join a session', async ({ page }) => {
    console.log('🏗️  Oturum oluşturma başlıyor')
    const url = await createSession(page, 'Playwright Test Session')
    console.log('✅ Oturum oluşturuldu:', url)

    // Session room yüklendi mi
    await expect(page).toHaveURL(url)
    console.log('👥 Katılımcı kontrol ediliyor')
    await expect(page.locator('[data-testid="participant-item"]')).toHaveCount(1, { timeout: 10000 })

    // katılımcı listesinde kendimiz var mı
    console.log('🔎 Katılımcı listesinde kendimizi görüyoruz')
    await expect(page.locator('text=Session Test User')).toBeVisible()
  })
}) 