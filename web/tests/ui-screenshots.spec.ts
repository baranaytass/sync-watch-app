import { test, expect } from '@playwright/test'

// UI Screenshot Test - Guest kullanıcı olarak tüm sayfaları gezip ekran görüntüsü alma

test.describe('UI Screenshots - Guest User Journey', () => {
  test('capture screenshots of all pages as guest user', async ({ page }) => {
    console.log('📸 UI Screenshots test başlatılıyor...')
    
    // 1. Login Page - Giriş sayfası
    console.log('🏠 Login sayfasına gidiliyor')
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: 'web/screenshots/01-login-page.png', 
      fullPage: true 
    })
    console.log('✅ Login page screenshot alındı')

    // 2. Guest Login - Misafir girişi
    console.log('🔑 Misafir girişi yapılıyor')
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await expect(guestButton).toBeVisible()
    await guestButton.click()
    await page.waitForURL(/\/sessions$/)
    
    // 3. Sessions Page - Oturumlar sayfası
    console.log('📋 Sessions sayfası screenshot alınıyor')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: 'web/screenshots/02-sessions-page.png', 
      fullPage: true 
    })
    console.log('✅ Sessions page screenshot alındı')

    // 4. Create Session Modal - Oturum oluşturma modalı
    console.log('➕ Create Session modal açılıyor')
    const createButton = page.locator('[data-testid="create-session-button"]').first()
    await createButton.click()
    await page.waitForSelector('[data-testid="create-session-modal"]')
    await page.screenshot({ 
      path: 'web/screenshots/03-create-session-modal.png', 
      fullPage: true 
    })
    console.log('✅ Create Session modal screenshot alındı')

    // Modal'ı kapat
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // 5. Home Page - Ana sayfa (varsa)
    console.log('🏠 Ana sayfaya gidiliyor')
    try {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ 
        path: 'web/screenshots/04-home-page.png', 
        fullPage: true 
      })
      console.log('✅ Home page screenshot alındı')
    } catch (error) {
      console.log('⚠️ Home page bulunamadı veya erişilemedi')
    }

    // 6. Mobile responsive - Mobil görünüm testi
    console.log('📱 Mobil görünüm test ediliyor')
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: 'web/screenshots/05-home-mobile.png', 
      fullPage: true 
    })
    console.log('✅ Mobile sessions screenshot alındı')

    // Tablet görünüm
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad size
    await page.screenshot({ 
      path: 'web/screenshots/06-sessions-tablet.png', 
      fullPage: true 
    })
    console.log('✅ Tablet sessions screenshot alındı')

    // Desktop'a geri dön
    await page.setViewportSize({ width: 1280, height: 720 })

    // 7. Dark/Light theme test (varsa)
    console.log('🌓 Theme toggle test ediliyor')
    try {
      const themeToggle = page.locator('[data-testid="theme-toggle"]')
      if (await themeToggle.isVisible()) {
        await themeToggle.click()
        await page.waitForTimeout(500)
        await page.screenshot({ 
          path: 'web/screenshots/07-dark-theme.png', 
          fullPage: true 
        })
        console.log('✅ Dark theme screenshot alındı')
      }
    } catch (error) {
      console.log('⚠️ Theme toggle bulunamadı')
    }

    console.log('🎉 Tüm screenshotlar başarıyla alındı!')
  })

  test('capture detailed component screenshots', async ({ page }) => {
    console.log('🔍 Detaylı component screenshotları alınıyor...')
    
    // Login olup session room'a gir
    await page.goto('/login')
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await guestButton.click()
    await page.waitForURL(/\/sessions$/)

    // Test session oluştur
    const createButton = page.locator('[data-testid="create-session-button"]').first()
    await createButton.click()
    
    const modal = page.locator('[data-testid="create-session-modal"]')
    await modal.waitFor()
    
    // Session bilgilerini doldur
    await page.fill('[data-testid="session-name-input"]', 'UI Test Session')
    await page.fill('[data-testid="session-description-input"]', 'Screenshot test için oluşturulan session')
    
    const submitButton = page.locator('[data-testid="create-session-submit"]')
    await submitButton.click()
    
    // Session room'a yönlendir
    await page.waitForURL(/\/session\//)
    await page.waitForLoadState('networkidle')
    
    // 8. Session Room - Oturum odası
    console.log('🎬 Session room screenshot alınıyor')
    await page.screenshot({ 
      path: 'web/screenshots/08-session-room.png', 
      fullPage: true 
    })
    console.log('✅ Session room screenshot alındı')

    // 9. Video player area - Video oynatıcı alanı
    console.log('🎥 Video player area screenshot alınıyor')
    const videoArea = page.locator('[data-testid="video-player-container"]').first()
    if (await videoArea.isVisible()) {
      await videoArea.screenshot({ 
        path: 'web/screenshots/09-video-player-area.png'
      })
      console.log('✅ Video player area screenshot alındı')
    }

    // 10. Chat area - Sohbet alanı
    console.log('💬 Chat area screenshot alınıyor')
    const chatArea = page.locator('[data-testid="chat-container"]').first()
    if (await chatArea.isVisible()) {
      await chatArea.screenshot({ 
        path: 'web/screenshots/10-chat-area.png'
      })
      console.log('✅ Chat area screenshot alındı')
    }

    // 11. Participants list - Katılımcılar listesi
    console.log('👥 Participants list screenshot alınıyor')
    const participantsList = page.locator('[data-testid="participants-list"]').first()
    if (await participantsList.isVisible()) {
      await participantsList.screenshot({ 
        path: 'web/screenshots/11-participants-list.png'
      })
      console.log('✅ Participants list screenshot alındı')
    }

    console.log('🎊 Tüm detaylı screenshotlar tamamlandı!')
  })
})