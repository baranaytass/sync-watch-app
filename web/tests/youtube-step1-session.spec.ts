import { test, expect } from '@playwright/test'

test.describe.skip('Step 1: Session Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Gerçek backend'i kullanarak misafir girişi yap
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const guestLoginButton = page.locator('button:has-text("Misafir Olarak Giriş")')

    if (await guestLoginButton.isVisible()) {
      await guestLoginButton.click()
      await page.waitForURL(/\/(|sessions)$/, { timeout: 10000 })
    }
  })

  test('should create session successfully', async ({ page }) => {
    console.log('🏗️ Step 1: Creating session...')
    
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')
    
    // Create session button (çeşitli varyasyonlar)
    const createBtnSelectors = [
      'button:has-text("Yeni Oturum")',
      'button:has-text("Oturum Oluştur")',
      'text=Yeni Oturum',
      'text=Oturum Oluştur'
    ]

    let clicked = false
    for (const sel of createBtnSelectors) {
      const btn = page.locator(sel).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        clicked = true
        break
      }
    }

    if (!clicked) throw new Error('Create session button not found')

    await page.fill('input', 'YouTube Test Session')
    await page.click('text=Oluştur')
    
    // Wait for session room
    await page.waitForURL(/\/session\/.*/)
    console.log('✅ Step 1: Session created, URL:', page.url())
    
    // Check we're in session room
    await expect(page.locator('text=YouTube Video URL')).toBeVisible()
    console.log('✅ Step 1: In session room successfully')
  })
}) 