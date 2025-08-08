import { test } from '@playwright/test'

test('capture homepage screenshot', async ({ page }) => {
  console.log('📸 Ana sayfa screenshot alınıyor...')
  
  // Ana sayfaya git (auth olmayan kullanıcı)
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  
  // Tam sayfa screenshot al
  await page.screenshot({ 
    path: 'web/screenshots/00-homepage-full.png', 
    fullPage: true 
  })
  console.log('✅ Homepage full screenshot alındı')
  
  // Hero section screenshot
  const heroSection = page.locator('div').filter({ hasText: 'Nesbat 🎬' }).first()
  if (await heroSection.isVisible()) {
    await heroSection.screenshot({ 
      path: 'web/screenshots/00-homepage-hero.png'
    })
    console.log('✅ Homepage hero screenshot alındı')
  }
})