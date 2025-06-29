import { test, expect } from '@playwright/test'

// Test video URL ve ID - Baran'ın verdiği örnek
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'
const TEST_VIDEO_ID = 'cYgmnku6R3Y'

// JWT Token - Baran'dan alınan
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYWZiNWUwYi00ZDdlLTQxMGQtYjU0NS0zMjJmYWYxMjdmNDYiLCJlbWFpbCI6ImJhcmFubmF5dGFzQGdtYWlsLmNvbSIsImlhdCI6MTc1MDc4OTU2OSwiZXhwIjoxNzUxMzk0MzY5fQ.yzK8ewGnBb3dCNnzbbqWFN1U_FcoMgnLd8Cb6VrF0TU'

test.describe('YouTube Player Vue App Integration Test', () => {
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

    page.on('pageerror', error => {
      console.log('💥 Page Error:', error.message)
      consoleErrors.push(error.message)
    })

    // JWT token'ı cookie olarak set et
    await page.context().addCookies([{
      name: 'token',
      value: JWT_TOKEN,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }])
  })

  test('should load YouTube video in Vue app without timeout error', async ({ page }) => {
    console.log('🚀 Starting YouTube Player Vue app test...')
    console.log('📺 Test Video URL:', TEST_VIDEO_URL)
    console.log('🔑 Using JWT authentication')
    
    try {
      // Homepage'e git
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Authenticated olduğumuzu kontrol et
      const isLoginPage = await page.locator('text=Google ile Giriş Yap').isVisible().catch(() => false)
      
      if (isLoginPage) {
        console.log('❌ Still on login page - JWT token may be invalid or expired')
        throw new Error('Authentication failed - JWT token not working')
      }

      // Sessions sayfasına git
      console.log('📋 Navigating to sessions page...')
      await page.goto('/sessions')
      await page.waitForLoadState('networkidle')

      // Session oluştur
      console.log('🏗️ Creating test session...')
      const createButton = page.locator('button').filter({ hasText: 'Oturum Oluştur' }).first()
      await expect(createButton).toBeVisible({ timeout: 10000 })
      await createButton.click()
      
      // Modal'da session bilgilerini doldur
      const titleInput = page.locator('input').first()
      await titleInput.fill('YouTube Player Test Session - Automated')
      await page.locator('button').filter({ hasText: 'Oluştur' }).click()
      
      console.log('✅ Session created successfully')

      // Session room sayfasını bekle
      await page.waitForURL(/\/session\/.*/, { timeout: 15000 })
      console.log('🏠 Entered session room')

      // Video URL input'unu bul ve video set et
      console.log('🎬 Setting video URL...')
      const videoInput = page.locator('input[placeholder*="youtube.com"]')
      await expect(videoInput).toBeVisible({ timeout: 10000 })
      
      await videoInput.fill(TEST_VIDEO_URL)
      await page.locator('button').filter({ hasText: 'Ayarla' }).click()

      console.log('⏳ Waiting for video to load...')
      
      // Video player container'ının görünmesini bekle
      const videoPlayerContainer = page.locator('.bg-black').first()
      await expect(videoPlayerContainer).toBeVisible({ timeout: 10000 })
      console.log('📺 Video player container visible')

      // iframe'ın yüklenmesini bekle
      const videoIframe = page.locator('iframe').first()
      await expect(videoIframe).toBeVisible({ timeout: 15000 })
      console.log('🎞️ Video iframe visible')

      // iframe src'ının doğru olduğunu kontrol et
      const iframeSrc = await videoIframe.getAttribute('src')
      console.log('🔗 Iframe src:', iframeSrc)
      expect(iframeSrc).toContain(TEST_VIDEO_ID)

      // Loading state'inin kaybolmasını bekle (UZUN SÜRE BEKLE - TIMEOUT BU AŞAMADA OLACAK)
      console.log('⏳ Waiting for loading state to disappear...')
      console.log('🎯 BU AŞAMADA TIMEOUT HATASI ALINIRSA SORUN DEVAM EDIYOR')
      
      let loadingTimeoutOccurred = false
      try {
        const loadingElement = page.locator('text=Video yükleniyor...')
        await expect(loadingElement).toBeHidden({ timeout: 25000 }) // 25 saniye bekle
        console.log('✅ Loading state cleared successfully - NO TIMEOUT!')
      } catch (error) {
        console.log('⏰ Loading state timeout occurred - checking for error state...')
        loadingTimeoutOccurred = true
      }

      // Error state kontrolü - BU ÖNEMLİ!
      console.log('🔍 Checking for error states...')
      const errorStates = [
        'Video yüklenemedi',
        'Video yükleme zaman aşımı', 
        'Tekrar Dene'
      ]
      
      let hasErrorState = false
      let foundErrorText = ''
      for (const errorText of errorStates) {
        const errorElement = page.locator(`text=${errorText}`)
        const isErrorVisible = await errorElement.isVisible().catch(() => false)
        if (isErrorVisible) {
          console.log(`❌ ERROR STATE FOUND: "${errorText}"`)
          hasErrorState = true
          foundErrorText = errorText
          break
        }
      }

      // Console loglarında hata kontrol et
      const hasTimeoutError = consoleErrors.some(error => 
        error.includes('Video yükleme zaman aşımı') ||
        error.includes('timeout') ||
        error.includes('Video yüklenemedi')
      )

      const hasVideoReadyLog = consoleLogs.some(log => 
        log.includes('YouTube iframe yüklendi') ||
        log.includes('video-ready') ||
        log.includes('Video yüklendi')
      )

      // Test sonuçlarını raporla
      console.log('\n📊 CRITICAL TEST RESULTS:')
      console.log('⏰ Loading timeout occurred:', loadingTimeoutOccurred)
      console.log('❌ Error state visible:', hasErrorState)
      if (hasErrorState) console.log('🔥 Found error text:', foundErrorText)
      console.log('❌ Timeout error in console:', hasTimeoutError)
      console.log('✅ Video ready log found:', hasVideoReadyLog)
      console.log('👁️ iframe visible:', await videoIframe.isVisible())

      // Tüm console loglarını ve hatalarını göster
      console.log('\n📝 All Console Logs:')
      consoleLogs.forEach((log, i) => console.log(`  ${i+1}. ${log}`))
      
      console.log('\n❌ All Console Errors:')
      consoleErrors.forEach((error, i) => console.log(`  ${i+1}. ${error}`))

      // Ana test assertion - SORUN DEVAM EDIYORSA BURDA FAIL EDECEK
      if (hasErrorState || hasTimeoutError) {
        console.log('\n💥💥💥 YOUTUBE PLAYER TIMEOUT ERROR STILL EXISTS! 💥💥💥')
        console.log('🔍 Failure reasons:')
        if (hasErrorState) console.log(`  - Error state visible in UI: "${foundErrorText}"`)
        if (hasTimeoutError) console.log('  - Timeout error found in console logs')
        
        throw new Error(`YouTube Player timeout error still occurring in Vue app: ${foundErrorText}`)
      }

      console.log('\n🎉🎉🎉 YOUTUBE PLAYER TIMEOUT ERROR FIXED! 🎉🎉🎉')
      
    } catch (error) {
      console.log('\n💥 Test failed with error:', error)
      console.log('📝 Final Console Logs:', consoleLogs)
      console.log('❌ Final Console Errors:', consoleErrors)
      throw error
    }
  })

  test.afterEach(async ({ page }) => {
    console.log('\n📊 Vue App Test Summary:')
    console.log(`✅ Console Logs: ${consoleLogs.length}`)
    console.log(`❌ Console Errors: ${consoleErrors.length}`)
    
    // Session temizliği - eğer session room'daysa leave et
    const currentUrl = page.url()
    if (currentUrl.includes('/session/')) {
      console.log('🧹 Cleaning up session...')
      await page.goto('/sessions').catch(() => {})
    }
  })
}) 