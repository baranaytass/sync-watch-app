import { expect, Page } from '@playwright/test'

/**
 * Simplified test helpers - minimal logging, essential functions only
 */

// Simple guest login helper
export async function guestLogin(page: Page, guestName: string = 'Test User'): Promise<void> {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  const guestNameInput = page.locator('[data-testid="guest-name-input"]')
  const guestBtn = page.locator('[data-testid="guest-login-button"]')
  
  if (await guestNameInput.isVisible() && await guestBtn.isVisible()) {
    await guestNameInput.fill(guestName)
    await expect(guestBtn).toBeEnabled({ timeout: 5000 })
    await guestBtn.click()
    await page.waitForURL(/\/$/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
  } else {
    throw new Error('Guest login elements not found')
  }
}

// Simple session creation helper
export async function createSession(page: Page, title: string = 'Test Session'): Promise<string> {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const createBtn = page.locator('[data-testid="create-session-button"]')
  await expect(createBtn).toBeVisible({ timeout: 8000 })
  await createBtn.click()

  // Handle modal
  const modal = page.locator('.modal')
  await expect(modal).toBeVisible()
  
  const titleInput = page.locator('input[name="title"]')
  await titleInput.fill(title)

  const submitButton = modal.getByRole('button', { name: /(oluştur|create)/i })
  await submitButton.click()

  await page.waitForURL(/\/session\//)
  return page.url().split('/session/')[1]
}

// Simple error tracking
export class ErrorTracker {
  private errors: string[] = []
  
  constructor(private page: Page) {
    this.setupListeners()
  }
  
  private setupListeners() {
    this.page.on('pageerror', (error) => {
      this.errors.push(`Page Error: ${error.message}`)
    })
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Only track critical errors
        if (text.includes('WebSocket') || text.includes('Video sync') || text.includes('TypeError')) {
          this.errors.push(`Console Error: ${text}`)
        }
      }
    })
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0
  }
  
  getErrors(): string[] {
    return [...this.errors]
  }
}