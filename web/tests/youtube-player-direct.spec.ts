import { test, expect } from '@playwright/test'

// Test video URL ve ID
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=cYgmnku6R3Y'
const TEST_VIDEO_ID = 'cYgmnku6R3Y'

test.describe('YouTube Player Direct Test', () => {
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
  })

  test('should load YouTube iframe directly without timeout', async ({ page }) => {
    console.log('🚀 Starting YouTube Player direct test...')
    console.log('📺 Test Video ID:', TEST_VIDEO_ID)

    // Basit bir HTML sayfası oluştur ve test et
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>YouTube Iframe Test</title>
        <style>
            body { margin: 0; padding: 20px; background: #000; }
            .container { width: 800px; height: 450px; position: relative; }
            .loading { color: white; text-align: center; position: absolute; 
                      top: 50%; left: 50%; transform: translate(-50%, -50%); }
            iframe { width: 100%; height: 100%; border: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div id="loading" class="loading">Video yükleniyor...</div>
            <iframe 
                id="youtube-iframe"
                src="https://www.youtube.com/embed/${TEST_VIDEO_ID}?enablejsapi=1&controls=1&autoplay=0&rel=0&modestbranding=1&playsinline=1&fs=1&origin=${encodeURIComponent('http://localhost:3000')}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                style="display: none;"
            ></iframe>
        </div>
        
        <script>
            console.log('🎬 YouTube iframe test başladı');
            const iframe = document.getElementById('youtube-iframe');
            const loading = document.getElementById('loading');
            
            let timeoutId = setTimeout(() => {
                console.error('⏰ YouTube iframe yükleme timeout');
                loading.textContent = 'Video yükleme zaman aşımı';
                loading.style.color = 'red';
            }, 15000);
            
            iframe.onload = function() {
                console.log('✅ YouTube iframe yüklendi');
                clearTimeout(timeoutId);
                loading.style.display = 'none';
                iframe.style.display = 'block';
                
                // Biraz bekleyip ready durumunu kontrol et
                setTimeout(() => {
                    console.log('🎉 YouTube Player hazır');
                }, 1000);
            };
            
            iframe.onerror = function() {
                console.error('❌ YouTube iframe yükleme hatası');
                clearTimeout(timeoutId);
                loading.textContent = 'Video yüklenirken hata oluştu';
                loading.style.color = 'red';
            };
        </script>
    </body>
    </html>
    `

    // HTML içeriğini data URL olarak yükle
    await page.goto(`data:text/html,${encodeURIComponent(testHtml)}`)
    
    console.log('⏳ Waiting for iframe to load...')
    
    // Loading elementinin kaybolmasını bekle (başarılı yükleme)
    try {
      await expect(page.locator('#loading')).toBeHidden({ timeout: 20000 })
      console.log('✅ Loading element hidden - iframe loaded successfully')
    } catch (error) {
      console.log('❌ Loading timeout - iframe failed to load')
      
      // Loading elementinin rengini kontrol et (hata durumu)
      const loadingColor = await page.locator('#loading').evaluate(el => 
        window.getComputedStyle(el).color
      )
      
      if (loadingColor === 'rgb(255, 0, 0)') { // red
        console.log('🔴 Error state detected')
      }
    }

    // iframe'ın görünür olduğunu kontrol et
    const isIframeVisible = await page.locator('#youtube-iframe').isVisible()
    console.log('👁️ Iframe visible:', isIframeVisible)

    // iframe src'ını kontrol et
    const iframeSrc = await page.locator('#youtube-iframe').getAttribute('src')
    console.log('🔗 Iframe src:', iframeSrc)
    expect(iframeSrc).toContain(TEST_VIDEO_ID)

    // Console loglarında başarı/hata durumunu kontrol et (encoding-safe)
    const hasSuccessLog = consoleLogs.some(log => 
      log.includes('YouTube iframe') && log.includes('klendi') ||
      log.includes('YouTube Player') && log.includes('haz') ||
      log.includes('iframe yüklendi') ||
      log.includes('Player hazır')
    )
    
    const hasErrorLog = consoleErrors.some(error => 
      error.includes('timeout') ||
      error.includes('yükleme hatası')
    )

    console.log('📊 Test Results:')
    console.log('✅ Success logs found:', hasSuccessLog)
    console.log('❌ Error logs found:', hasErrorLog)
    console.log('👁️ Iframe visible:', isIframeVisible)

    // Test assertion
    if (!hasSuccessLog || hasErrorLog || !isIframeVisible) {
      console.log('💥 YouTube Player test FAILED')
      console.log('📝 All logs:', consoleLogs)
      console.log('❌ All errors:', consoleErrors)
      
      throw new Error('YouTube Player failed to load properly')
    }

    console.log('🎉 YouTube Player test PASSED')
  })

  test.afterEach(async ({ page }) => {
    console.log('\n📊 Final Test Summary:')
    console.log(`✅ Console Logs: ${consoleLogs.length}`)
    console.log(`❌ Console Errors: ${consoleErrors.length}`)
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Final Errors:')
      consoleErrors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (consoleLogs.length > 0) {
      console.log('\n📝 Key Success Logs:')
      consoleLogs
        .filter(log => log.includes('YouTube') || log.includes('iframe'))
        .forEach(log => console.log(`  - ${log}`))
    }
  })
}) 