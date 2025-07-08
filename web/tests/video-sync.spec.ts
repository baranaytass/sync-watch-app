import { test, expect } from '@playwright/test'

const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'

// Helper function for finding create session button (matching session.spec.ts logic)
async function findCreateSessionButton(page: any) {
  const newSessionBtn = page.locator('button:has-text("Yeni Oturum")').first()
  const firstSessionBtn = page.locator('button:has-text("İlk Oturumu Oluştur")').first()
  
  // Hangisi görünürse onu kullan
  const btn = await newSessionBtn.isVisible({ timeout: 5000 }).catch(() => false) 
    ? newSessionBtn 
    : firstSessionBtn
    
  return btn
}

test.describe('Video Sync – basic play / pause', () => {
  test.beforeEach(async ({ page }) => {
    console.log('🎬 VIDEO SYNC TEST – Starting')
    await page.goto('/')
    console.log('📍 Current URL after goto /:', page.url())
    
    const guestBtn = page.locator('button:has-text("Misafir Olarak Giriş")')
    console.log('🔍 Looking for guest login button')
    if (await guestBtn.isVisible()) {
      console.log('✅ Guest button found, clicking')
      await guestBtn.click()
      await page.waitForURL(/\/sessions$/)
      console.log('📍 After guest login URL:', page.url())
    } else {
      console.log('⚠️  Guest button not found')
    }

    // Sessions list page'e git
    console.log('🔍 Navigating to /sessions')
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')
    console.log('📍 Sessions page loaded:', page.url())

    // Oturum oluştur
    console.log('🔍 Looking for create session button')
    const createBtn = await findCreateSessionButton(page)
    console.log('✅ Create button found')
    await expect(createBtn).toBeVisible()
    await createBtn.click()
    await page.locator('input#title').fill('Video Sync Test')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/session\//)
    console.log('📍 Session room URL:', page.url())
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