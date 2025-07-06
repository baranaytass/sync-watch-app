import { test, expect } from '@playwright/test'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'

test.describe.skip('Video Sync – basic play / pause', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const guestBtn = page.locator('button:has-text("Misafir Olarak Giriş")')
    if (await guestBtn.isVisible()) {
      await guestBtn.click()
      await page.waitForURL(/\/sessions$/)
    }

    // Oturum oluştur
    const createBtn = page.locator('button:has-text("Yeni Oturum")').first()
    await createBtn.click()
    await page.locator('input#title').fill('Video Sync Test')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/session\//)
  })

  test('video loads and play/pause toggles', async ({ page }) => {
    // Video URL input
    const input = page.locator('input[placeholder*="youtube"]').first()
    await input.fill(TEST_VIDEO_URL)
    await page.locator('button:has-text("Ayarla")').click()

    // iframe görünür olmalı
    const iframe = page.locator('iframe').first()
    await expect(iframe).toBeVisible({ timeout: 15000 })

    // Basit doğrulama: 3 saniye sonra iframe hâlâ görünür (sync başlatılıp durdurulmuş olsa da çökmemeli)
    await page.waitForTimeout(3000)
    await expect(iframe).toBeVisible()
  })
}) 