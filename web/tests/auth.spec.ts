import { test, expect } from '@playwright/test'

// Basit misafir kimlik doğrulama testi

test.describe('Auth – Guest Login/Logout', () => {
  test('guest login and logout flow works', async ({ page }) => {
    console.log('🚀 AUTH TEST – Sayfaya gidiliyor')
    // Login sayfasına git
    await page.goto('/login')

    // Misafir isim input'u görünür
    const guestNameInput = page.locator('[data-testid="guest-name-input"]')
    await expect(guestNameInput).toBeVisible()

    // Misafir giriş butonu görünür ama disabled
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await expect(guestButton).toBeVisible()
    await expect(guestButton).toBeDisabled()

    console.log('📝 Misafir ismi yazılıyor')
    // Misafir ismi gir
    await guestNameInput.fill('Test Misafiri')
    
    // Buton artık enabled olmalı
    await expect(guestButton).toBeEnabled()

    console.log('🔑 Misafir butonuna tıklanıyor')
    // Tıkla ve yönlendirme bekle
    await guestButton.click()
    await page.waitForURL(/\/sessions$/)
    console.log('✅ Oturum açıldı, sessions sayfasındayız')

    // Kullanıcı adını navbar'da gör (text dil bağımsız kontrol)
    await expect(page.locator('nav').locator('text=Test Misafiri').first()).toBeVisible()

    // Cookie set edildi mi
    const cookies = await page.context().cookies()
    const hasToken = cookies.some(c => c.name === 'token' && c.domain.includes('localhost'))
    console.log('🍪 JWT cookie set edilmiş:', hasToken)
    expect(hasToken).toBeTruthy()

    // Logout
    console.log('🚪 Çıkış butonuna tıklanıyor')
    await page.locator('[data-testid="logout-button"]').click()
    await page.waitForURL('/login')

    // Cookie silindi mi
    const cookiesAfter = await page.context().cookies()
    const cleared = cookiesAfter.every(c => c.name !== 'token')
    console.log('🧹 Cookie temiz mi?:', cleared)
    expect(cleared).toBeTruthy()
  })
}) 