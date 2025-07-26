import { test, expect } from '@playwright/test'

const createSession = async (page: any, title: string): Promise<string> => {
  // Home page (authenticated user dashboard)
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Authenticated homepage'de "Yeni Oturum Oluştur" butonunu bul
  const createSessionBtn = page.locator('[data-testid="create-session-button"]')
  
  await expect(createSessionBtn).toBeVisible({ timeout: 8000 })
  
  // Butona tıkla - doğrudan quick session oluşturur ve yönlendirir
  await createSessionBtn.click()

  // Session sayfasına yönlendirme bekle
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
      await page.waitForURL(/\/$/)
    }
    console.log('🎬 SESSION TEST – Misafir login')
  })

  test('user can create and join a session', async ({ page }) => {
    console.log('🏗️  Oturum oluşturma başlıyor')
    const url = await createSession(page, 'Quick Session') // title artık kullanılmıyor ama compatibility için bırakıyoruz
    console.log('✅ Oturum oluşturuldu:', url)

    // Session room yüklendi mi
    await expect(page).toHaveURL(url)
    console.log('👥 Katılımcı kontrol ediliyor')
    await expect(page.locator('[data-testid="participant-item"]')).toHaveCount(1, { timeout: 10000 })

    // katılımcı listesinde kendimiz var mı
    console.log('🔎 Katılımcı listesinde kendimizi görüyoruz')
    await expect(page.locator('text=Session Test User')).toBeVisible()
  })

  test('sessions are listed correctly in dashboard', async ({ page }) => {
    console.log('📋 Session listing test başlıyor')
    
    // İlk oturum oluştur
    const url1 = await createSession(page, 'Test Session 1')
    console.log('✅ İlk oturum oluşturuldu:', url1)
    
    // Home'a dön
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Sessions panelini aç
    const browseSessions = page.locator('text=Browse Sessions')
    await expect(browseSessions).toBeVisible()
    await browseSessions.click()
    
    // Loading spinner'ı bekle ve geç
    await page.waitForTimeout(2000)
    
    // Oluşturduğumuz oturumun listede görünmesi lazım
    await expect(page.locator('text=Quick Session')).toBeVisible({ timeout: 10000 })
    console.log('✅ Oturum listede görünüyor')
    
    // İkinci oturum oluştur
    const createBtn = page.locator('[data-testid="create-session-button"]')
    await createBtn.click()
    await page.waitForURL(/\/session\//)
    
    // Home'a tekrar dön
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Sessions panelini tekrar aç
    await browseSessions.click()
    await page.waitForTimeout(2000)
    
    // İki oturum da görünmeli
    const sessionItems = page.locator('[data-for="session in sessionsStore.sessions"]')
    await expect(sessionItems).toHaveCount(2, { timeout: 10000 })
    console.log('✅ İki oturum da listede görünüyor')
  })
}) 