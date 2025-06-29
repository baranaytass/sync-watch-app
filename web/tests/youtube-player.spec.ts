import { test, expect, Page } from '@playwright/test'

// Test video URL - Baran'ın verdiği örnek
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'
const TEST_VIDEO_ID = 'cYgmnku6R3Y'

test.describe('YouTube Player Video Loading', () => {
  let consoleLogs: string[] = []
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Console loglarını yakala
    consoleLogs = []
    consoleErrors = []
    
    page.on('console', msg => {
      const text = msg.text()
      if (msg.type() === 'error') {
        consoleErrors.push(text)
        console.log('❌ Console Error:', text)
      } else {
        consoleLogs.push(text)
        console.log('📝 Console Log:', text)
      }
    })

    // Network errors
    page.on('pageerror', error => {
      console.log('💥 Page Error:', error.message)
      consoleErrors.push(error.message)
    })
  })

  test('should load YouTube video without timeout', async ({ page }) => {
    // Başlangıç logları
    console.log('🚀 Starting YouTube Player test...')
    console.log('📺 Test Video URL:', TEST_VIDEO_URL)
    
    try {
      // Homepage'e git
      await page.goto('/')
      
      // Eğer login sayfasındaysak, Google OAuth bypass etmek için 
      // doğrudan session sayfasına gitmeyi deneyelim
      await page.waitForLoadState('networkidle')
      
      const isLoginPage = await page.locator('text=Google ile Giriş Yap').isVisible().catch(() => false)
      
      if (isLoginPage) {
        console.log('⚠️ Login page detected - Bu test için backend auth bypass gerekli')
        console.log('🔧 Manuel test: Önce login olup sonra test çalıştırın')
        
        // Test'i skip et ama bilgi ver
        test.skip(true, 'Authentication required - run test after manual login')
        return
      }

      // Sessions sayfasına git
      console.log('📋 Navigating to sessions page...')
      await page.goto('/sessions')
      await page.waitForLoadState('networkidle')

      // Session oluştur butonu
      const createButton = page.locator('text=Oturum Oluştur')
      if (await createButton.isVisible()) {
        await createButton.click()
        
        // Modal'da session bilgilerini doldur
        await page.fill('input[placeholder*="oturum"]', 'YouTube Player Test Session')
        await page.click('text=Oluştur')
        
        console.log('✅ Session created successfully')
      } else {
        console.log('⚠️ Create session button not found - checking if already in session...')
      }

      // Session room sayfasını bekle
      await page.waitForURL(/\/session\/.*/)
      console.log('🏠 Entered session room')

      // Video URL input'unu bul ve video set et
      const videoInput = page.locator('input[placeholder*="youtube.com"]')
      await expect(videoInput).toBeVisible({ timeout: 10000 })
      
      console.log('🎬 Setting video URL...')
      await videoInput.fill(TEST_VIDEO_URL)
      await page.click('text=Ayarla')

      console.log('⏳ Waiting for video to load...')
      
      // Video player'ın görünmesini bekle
      const videoPlayer = page.locator('.bg-black iframe')
      await expect(videoPlayer).toBeVisible({ timeout: 15000 })
      
      // Video iframe'inin src'inin doğru olduğunu kontrol et
      const videoIframe = await videoPlayer.getAttribute('src')
      expect(videoIframe).toContain(TEST_VIDEO_ID)
      console.log('✅ Video iframe source correct:', videoIframe)

      // Loading state'inin kaybolmasını bekle (maximum 20 saniye)
      const loadingElement = page.locator('text=Video yükleniyor...')
      await expect(loadingElement).toBeHidden({ timeout: 20000 })
      console.log('✅ Loading state cleared')

      // Error state'inin GÖRÜNMEMESINI kontrol et
      const errorElement = page.locator('text=Video yüklenemedi')
      await expect(errorElement).toBeHidden({ timeout: 5000 })
      console.log('✅ No error state displayed')

      // Console loglarında hata var mı kontrol et
      const hasVideoError = consoleErrors.some(error => 
        error.includes('Video yükleme zaman aşımı') || 
        error.includes('Video yüklenemedi')
      )
      
      if (hasVideoError) {
        console.log('❌ Video loading errors found in console:')
        consoleErrors.forEach(error => console.log('  -', error))
        throw new Error('YouTube Player timeout error detected in console logs')
      }

      // Success loglarını kontrol et
      const hasSuccessLog = consoleLogs.some(log => 
        log.includes('YouTube iframe yüklendi') ||
        log.includes('video-ready')
      )
      
      if (!hasSuccessLog) {
        console.log('⚠️ No success logs found. Available logs:')
        consoleLogs.forEach(log => console.log('  -', log))
      }

      console.log('🎉 YouTube Player test completed successfully!')
      
    } catch (error) {
      console.log('💥 Test failed:', error)
      console.log('📝 Console Logs:', consoleLogs)
      console.log('❌ Console Errors:', consoleErrors)
      throw error
    }
  })

  test.afterEach(async ({ page }) => {
    // Test sonunda tüm logları yazdır
    console.log('\n📊 Test Summary:')
    console.log(`✅ Console Logs: ${consoleLogs.length}`)
    console.log(`❌ Console Errors: ${consoleErrors.length}`)
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Errors:')
      consoleErrors.forEach(error => console.log(`  - ${error}`))
    }
  })
}) 