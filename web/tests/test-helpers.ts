import { expect, Page } from '@playwright/test'

/**
 * Enhanced test logging system - only logs important steps
 */
export class TestLogger {
  private static instance: TestLogger
  private testName: string = ''
  
  static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger()
    }
    return TestLogger.instance
  }
  
  setTestName(name: string) {
    this.testName = name
  }
  
  step(message: string) {
    console.log(`🎯 [${this.testName}] ${message}`)
  }
  
  success(message: string) {
    console.log(`✅ [${this.testName}] ${message}`)
  }
  
  error(message: string) {
    console.error(`❌ [${this.testName}] ${message}`)
  }
  
  info(message: string) {
    console.log(`📋 [${this.testName}] ${message}`)
  }
}

/**
 * Enhanced console error tracking and test failure mechanism
 */
export class TestErrorTracker {
  private errors: string[] = []
  private page: Page
  private testName: string
  private logger: TestLogger
  
  constructor(page: Page, testName: string = 'Test') {
    this.page = page
    this.testName = testName
    this.logger = TestLogger.getInstance()
    this.setupErrorListeners()
  }
  
  private setupErrorListeners() {
    // JavaScript errors - IMMEDIATE test failure
    this.page.on('pageerror', (error) => {
      const errorMessage = `JavaScript Error: ${error.message}`
      this.errors.push(errorMessage)
      this.logger.error(`CRITICAL: ${errorMessage}`)
      throw new Error(`[${this.testName}] Test failed due to JavaScript error: ${error.message}`)
    })
    
    // Console errors - Enhanced filtering with immediate failure on critical errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const messageText = msg.text()
        
        // Enhanced ignorable patterns - more comprehensive filtering
        const ignorablePatterns = [
          // Auth related (expected in test environment)
          'Failed to load resource: the server responded with a status of 401',
          'Failed to load resource: the server responded with a status of 403',
          'Failed to load resource: the server responded with a status of 404',
          '/api/auth/me',
          
          // Network/Resource loading (expected in test environment)
          'Failed to load resource: net::ERR_FAILED',
          'Failed to load resource: net::ERR_ABORTED',
          'Failed to load resource: net::ERR_NETWORK_CHANGED',
          'Failed to load resource: net::ERR_CONNECTION_REFUSED',
          'favicon.ico',
          
          // YouTube related (expected in test environment)
          'YouTube Player: Error loading video',
          'YouTube video is not available',
          'The play() request was interrupted',
          'youtube.com/api/stats',
          'youtube.com/api/log',
          'youtube.com/ptracking',
          'youtube.com/pagead',
          'youtube.com/get_video_info',
          
          // Analytics/Tracking (expected in test environment)
          'googletagmanager.com',
          'google-analytics.com',
          'doubleclick.net',
          'googlesyndication.com',
          
          // CORS (expected in test environment)
          'CORS',
          'Cross-Origin Request Blocked',
          
          // Other expected errors
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'Permissions policy violation: compute-pressure is not allowed',
          'Permissions policy violation: browsing-topics is not allowed',
          'Permissions policy violation: interest-cohort is not allowed'
        ]
        
        const isIgnorable = ignorablePatterns.some(pattern => 
          messageText.toLowerCase().includes(pattern.toLowerCase())
        )
        
        if (!isIgnorable) {
          // Check for critical error patterns that should IMMEDIATELY fail tests
          const criticalPatterns = [
            'WebSocket connection failed',
            'Network Error',
            'Session not found',
            'Video sync failed',
            'Player initialization failed',
            'Sync çağrıldı ama player hazır değil',
            'YouTube Player API not loaded',
            'Cannot read properties of null',
            'Cannot read properties of undefined',
            'TypeError: Cannot read',
            'ReferenceError:',
            'SyntaxError:',
            'Uncaught',
            'Failed to initialize',
            'Connection lost',
            'Authentication failed permanently',
            'Uncaught TypeError',
            'Uncaught ReferenceError',
            'Uncaught SyntaxError'
          ]
          
          // Check if this is a critical error
          const isCritical = criticalPatterns.some(pattern => 
            messageText.toLowerCase().includes(pattern.toLowerCase())
          )
          
          if (isCritical) {
            const errorMessage = `CRITICAL Console Error: ${messageText}`
            this.errors.push(errorMessage)
            this.logger.error(errorMessage)
            throw new Error(`[${this.testName}] Test failed due to critical console error: ${messageText}`)
          } else {
            // Non-critical but still unexpected error - log but don't fail immediately
            this.logger.error(`Unexpected console error: ${messageText}`)
            this.errors.push(`Console Error: ${messageText}`)
          }
        }
      }
    })
    
    // Network failures - Enhanced filtering for critical API endpoints only
    this.page.on('requestfailed', (request) => {
      const url = request.url()
      const method = request.method()
      const failure = request.failure()
      
      // Enhanced filtering for expected failures
      const ignorableUrlPatterns = [
        // YouTube related
        'youtube.com/api/stats',
        'youtube.com/api/log',
        'youtube.com/ptracking',
        'youtube.com/pagead',
        'youtube.com/get_video_info',
        'youtubei.googleapis.com',
        
        // Analytics/Tracking
        'doubleclick.net',
        'google-analytics.com',
        'googletagmanager.com',
        'googlesyndication.com',
        
        // CDN/Assets
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'unpkg.com',
        'jsdelivr.net',
        'cdnjs.cloudflare.com',
        
        // Social media
        'facebook.com',
        'twitter.com',
        'instagram.com'
      ]
      
      // Check if this URL should be ignored
      const isIgnorableUrl = ignorableUrlPatterns.some(pattern => 
        url.toLowerCase().includes(pattern.toLowerCase())
      )
      
      if (isIgnorableUrl) {
        return // Ignore expected failures
      }
      
      // Only fail on critical API requests
      if (url.includes('/api/') || url.includes('/ws/')) {
        // Don't fail on expected auth failures
        if (url.includes('/api/auth/') && (
          failure?.errorText?.includes('401') ||
          failure?.errorText?.includes('ERR_ABORTED') ||
          failure?.errorText?.includes('403')
        )) {
          return
        }
        
        const errorMessage = `CRITICAL Network Failure: ${method} ${url} - ${failure?.errorText}`
        this.errors.push(errorMessage)
        this.logger.error(errorMessage)
        throw new Error(`[${this.testName}] Test failed due to network error: ${errorMessage}`)
      }
    })
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0
  }
  
  getErrors(): string[] {
    return [...this.errors]
  }
  
  clearErrors(): void {
    this.errors = []
  }
}

// Helper function to perform guest login
export async function guestLogin(page: Page): Promise<void> {
  const logger = TestLogger.getInstance()
  
  // Always start from login page
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  const guestBtn = page.locator('[data-testid="guest-login-button"]')
  
  // Check if guest button is visible
  if (await guestBtn.isVisible()) {
    logger.step('Performing guest login')
    
    // Click guest login button
    await guestBtn.click()
    
    // Wait for navigation to sessions page
    await page.waitForURL(/\/sessions$/, { timeout: 10000 })
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Verify we're actually on sessions page and authenticated
    const currentUrl = page.url()
    if (!currentUrl.includes('/sessions')) {
      throw new Error(`Expected to be on sessions page, but got: ${currentUrl}`)
    }
    
    // Wait for session list to load (check for loading spinner to disappear)
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('div, p')
      for (const el of loadingElements) {
        if (el.textContent && el.textContent.includes('Oturumlar yükleniyor...')) {
          return false
        }
      }
      return true
    }, { timeout: 10000 })
    
    logger.success('Guest login completed successfully')
  } else {
    throw new Error('Guest login button not found')
  }
}

// Helper function to find create session button
export async function findCreateSessionButton(page: Page): Promise<any> {
  const logger = TestLogger.getInstance()
  
  // Ensure we're on the sessions page (but don't navigate if we're already authenticated)
  const currentUrl = page.url()
  if (!currentUrl.includes('/sessions')) {
    logger.error(`Not on sessions page, current URL: ${currentUrl}`)
    throw new Error('Expected to be on sessions page after guest login')
  }

  // Wait for loading to complete
  await page.waitForLoadState('networkidle')
  
  // Wait for loading text to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('div, p')
    for (const el of loadingElements) {
      if (el.textContent && el.textContent.includes('Oturumlar yükleniyor...')) {
        return false
      }
    }
    return true
  }, { timeout: 10000 })

  // Debug: Check what's available on the page
  logger.info('Page title: ' + (await page.title()))
  logger.info('Page URL: ' + page.url())

  const createBtnSelectors = [
    page.getByRole('button', { name: /Yeni Oturum/i }).first(),
    page.getByRole('button', { name: /İlk Oturumu Oluştur/i }).first(),
    page.getByRole('button', { name: /Oturum Oluştur/i }).first(),
    page.getByRole('button', { name: /Create Session/i }).first(),
    page.locator('button').filter({ hasText: /Oturum/i }).first(),
    page.locator('[data-testid="create-session-button"]').first(),
    page.locator('[data-testid="create-first-session-button"]').first()
  ]
  
  let createBtn = createBtnSelectors[0]
  let foundButton = false
  
  // Try each selector
  for (let i = 0; i < createBtnSelectors.length; i++) {
    const selector = createBtnSelectors[i]
    try {
      await selector.waitFor({ timeout: 2000 })
      createBtn = selector
      foundButton = true
      logger.info(`Found create button with selector ${i + 1}`)
      break
    } catch (e) {
      // Continue to next selector
    }
  }
  
  if (!foundButton) {
    // Debug: Log all buttons on the page
    const allButtons = await page.locator('button').all()
    logger.info(`Found ${allButtons.length} buttons on page`)
    
    for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
      const buttonText = await allButtons[i].textContent()
      logger.info(`Button ${i + 1}: "${buttonText}"`)
    }
    
    throw new Error('Could not find create session button')
  }
  
  await expect(createBtn).toBeVisible({ timeout: 10000 })
  logger.step('Found create session button')
  
  return createBtn
}

// Helper function to wait for video to load
export async function waitForVideoToLoad(page: Page, timeout: number = 20000): Promise<{ iframe: any }> {
  const logger = TestLogger.getInstance()
  
  await page.waitForSelector('iframe', { state: 'visible', timeout })
  const iframe = page.locator('iframe').first()
  await expect(iframe).toBeVisible()
  
  logger.step('Video iframe loaded')
  
  return { iframe }
}

// Helper function to trigger video play/pause with enhanced error checking
export async function triggerVideoAction(page: Page, action: 'play' | 'pause', userLabel: string) {
  const logger = TestLogger.getInstance()
  
  try {
    logger.step(`${userLabel}: Triggering ${action}`)
    
    // Primary method: Use exposed Vue methods directly
    const success = await page.evaluate(async (actionType: string) => {
      const videoPlayer = document.querySelector('[data-testid="video-player"]')
      if (videoPlayer) {
        const vueInstance = (videoPlayer as any)?.__vue__ || (videoPlayer as any)?._vnode?.component
        if (vueInstance?.exposed?.[actionType]) {
          vueInstance.exposed[actionType]()
          return true
        }
      }
      return false
    }, action)
    
    if (success) {
      logger.success(`${userLabel}: ${action} triggered successfully`)
    } else {
      logger.info(`${userLabel}: Using fallback method (iframe click)`)
      
      // Fallback: Try clicking on iframe
      const iframe = page.locator('iframe').first()
      if (await iframe.isVisible()) {
        await iframe.click()
        logger.success(`${userLabel}: ${action} triggered via iframe click`)
      } else {
        throw new Error(`Video iframe not visible for ${action} trigger`)
      }
    }
    
    // Wait for action to be processed
    await page.waitForTimeout(2000)
    
  } catch (error) {
    logger.error(`${userLabel}: Failed to trigger ${action}: ${error}`)
    throw new Error(`Failed to trigger ${action} for ${userLabel}: ${error}`)
  }
} 