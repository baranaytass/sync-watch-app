import { test, expect } from '@playwright/test'

// UI Screenshot Test - Take screenshots of all pages as guest user

test.describe('UI Screenshots - Guest User Journey', () => {
  test('capture screenshots of all pages as guest user', async ({ page }) => {
    console.log('📸 Starting UI Screenshots test...')
    
    // 1. Login Page
    console.log('🏠 Navigating to login page')
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: 'web/screenshots/01-login-page.png', 
      fullPage: true 
    })
    console.log('✅ Login page screenshot taken')

    // 2. Guest Login
    console.log('🔑 Performing guest login')
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await expect(guestButton).toBeVisible()
    await guestButton.click()
    await page.waitForURL(/\/sessions$/)
    
    // 3. Sessions Page
    console.log('📋 Taking sessions page screenshot')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: 'web/screenshots/02-sessions-page.png', 
      fullPage: true 
    })
    console.log('✅ Sessions page screenshot taken')

    // 4. Create Session Modal
    console.log('➕ Opening Create Session modal')
    const createButton = page.locator('[data-testid="create-session-button"]').first()
    await createButton.click()
    await page.waitForSelector('[data-testid="create-session-modal"]')
    await page.screenshot({ 
      path: 'web/screenshots/03-create-session-modal.png', 
      fullPage: true 
    })
    console.log('✅ Create Session modal screenshot taken')

    // Close modal
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
      console.log('✅ Home page screenshot taken')
    } catch (error) {
      console.log('⚠️ Home page not found or inaccessible')
    }

    // 6. Mobile responsive - Mobile view test
    console.log('📱 Testing mobile view')
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ 
      path: 'web/screenshots/05-home-mobile.png', 
      fullPage: true 
    })
    console.log('✅ Mobile sessions screenshot taken')

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad size
    await page.screenshot({ 
      path: 'web/screenshots/06-sessions-tablet.png', 
      fullPage: true 
    })
    console.log('✅ Tablet sessions screenshot taken')

    // Return to desktop
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

    console.log('🎉 All screenshots taken successfully!')
  })

  test('capture detailed component screenshots', async ({ page }) => {
    console.log('🔍 Taking detailed component screenshots...')
    
    // Login olup session room'a gir
    await page.goto('/login')
    const guestButton = page.locator('[data-testid="guest-login-button"]')
    await guestButton.click()
    await page.waitForURL(/\/sessions$/)

    // Create test session
    const createButton = page.locator('[data-testid="create-session-button"]').first()
    await createButton.click()
    
    const modal = page.locator('[data-testid="create-session-modal"]')
    await modal.waitFor()
    
    // Session bilgilerini doldur
    await page.fill('[data-testid="session-name-input"]', 'UI Test Session')
    await page.fill('[data-testid="session-description-input"]', 'Screenshot test için oluşturulan session')
    
    const submitButton = page.locator('[data-testid="create-session-submit"]')
    await submitButton.click()
    
    // Navigate to session room
    await page.waitForURL(/\/session\//)
    await page.waitForLoadState('networkidle')
    
    // 8. Session Room
    console.log('🎬 Taking session room screenshot')
    await page.screenshot({ 
      path: 'web/screenshots/08-session-room.png', 
      fullPage: true 
    })
    console.log('✅ Session room screenshot taken')

    // 9. Video player area
    console.log('🎥 Taking video player area screenshot')
    const videoArea = page.locator('[data-testid="video-player-container"]').first()
    if (await videoArea.isVisible()) {
      await videoArea.screenshot({ 
        path: 'web/screenshots/09-video-player-area.png'
      })
      console.log('✅ Video player area screenshot taken')
    }

    // 10. Chat area
    console.log('💬 Taking chat area screenshot')
    const chatArea = page.locator('[data-testid="chat-container"]').first()
    if (await chatArea.isVisible()) {
      await chatArea.screenshot({ 
        path: 'web/screenshots/10-chat-area.png'
      })
      console.log('✅ Chat area screenshot taken')
    }

    // 11. Participants list
    console.log('👥 Taking participants list screenshot')
    const participantsList = page.locator('[data-testid="participants-list"]').first()
    if (await participantsList.isVisible()) {
      await participantsList.screenshot({ 
        path: 'web/screenshots/11-participants-list.png'
      })
      console.log('✅ Participants list screenshot taken')
    }

    console.log('🎊 All detailed screenshots completed!')
  })
})