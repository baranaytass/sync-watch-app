import { test, expect } from '@playwright/test'

const createSession = async (page: any, title: string): Promise<string> => {
  // Sessions list page
  await page.goto('/sessions')
  await page.waitForLoadState('networkidle')

  // Yeni oturum oluştur butonu
  const btn = page.locator('button:has-text("Yeni Oturum")').first()
  await expect(btn).toBeVisible()
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
    await page.goto('/')
    const guestBtn = page.locator('button:has-text("Misafir Olarak Giriş")')
    if (await guestBtn.isVisible()) {
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
    console.log('👥 Katılımcı başlığı kontrol ediliyor')
    await expect(page.getByRole('heading', { name: /Katılımcılar/ })).toBeVisible()

    // katılımcı listesinde kendimiz var mı
    console.log('🔎 Katılımcı listesinde kendimizi görüyoruz')
    await expect(page.locator('text=Misafir')).toBeVisible()
  })
}) 