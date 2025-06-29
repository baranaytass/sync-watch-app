import { test, expect } from '@playwright/test'

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYWZiNWUwYi00ZDdlLTQxMGQtYjU0NS0zMjJmYWYxMjdmNDYiLCJlbWFpbCI6ImJhcmFubmF5dGFzQGdtYWlsLmNvbSIsImlhdCI6MTc1MDc4OTU2OSwiZXhwIjoxNzUxMzk0MzY5fQ.yzK8ewGnBb3dCNnzbbqWFN1U_FcoMgnLd8Cb6VrF0TU'

test.describe('Step 1: Session Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{
      name: 'token',
      value: JWT_TOKEN,
      domain: 'localhost',
      path: '/'
    }])
  })

  test('should create session successfully', async ({ page }) => {
    console.log('🏗️ Step 1: Creating session...')
    
    await page.goto('/sessions')
    await page.waitForLoadState('networkidle')
    
    // Create session button
    await page.click('text=Oturum Oluştur')
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