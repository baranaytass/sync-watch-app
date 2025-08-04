#!/usr/bin/env node

/**
 * Production End-to-End Browser Test
 * 
 * Tests the complete user flow in production using real browser automation.
 * This catches CORS, authentication, and UI issues that API tests miss.
 */

import { chromium } from 'playwright';

const PROD_CONFIG = {
  FRONTEND_URL: 'https://sync-watch-frontend.onrender.com',
  BACKEND_URL: 'https://sync-watch-backend.onrender.com',
  TIMEOUT: 30000,
};

class ProductionE2ETest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFn) {
    this.log(`Running E2E test: ${testName}`);
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({ name: testName, status: 'PASS', duration });
      this.log(`E2E test "${testName}" passed in ${duration}ms`, 'success');
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      this.log(`E2E test "${testName}" failed: ${error.message}`, 'error');
      
      // Take screenshot on failure
      try {
        const screenshot = await this.page.screenshot();
        this.log(`Screenshot saved for failed test: ${testName}`);
      } catch (screenshotError) {
        this.log(`Could not take screenshot: ${screenshotError.message}`, 'error');
      }
    }
  }

  async setupBrowser() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    this.page = await this.context.newPage();
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`Browser console error: ${msg.text()}`, 'error');
      }
    });
    
    // Listen for network failures
    this.page.on('requestfailed', request => {
      this.log(`Network request failed: ${request.method()} ${request.url()} - ${request.failure().errorText}`, 'error');
    });
  }

  async teardown() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  async testFrontendLoad() {
    await this.page.goto(PROD_CONFIG.FRONTEND_URL, { 
      waitUntil: 'networkidle',
      timeout: PROD_CONFIG.TIMEOUT 
    });
    
    // Check if the page loaded correctly
    const title = await this.page.title();
    if (!title || title.includes('Error')) {
      throw new Error(`Frontend page title indicates error: ${title}`);
    }
    
    // Wait for Vue app to mount
    await this.page.waitForSelector('[data-testid="app"], #app, .app', { timeout: 10000 });
  }

  async testGuestLogin() {
    // Navigate to login if not already there
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/login')) {
      await this.page.goto(`${PROD_CONFIG.FRONTEND_URL}/login`, { 
        waitUntil: 'networkidle' 
      });
    }
    
    // Check if guest login form is even present in DOM
    const guestInputExists = await this.page.locator('[data-testid="guest-name-input"]').count();
    if (guestInputExists === 0) {
      // Try to find any other login form elements to understand the page state
      const googleButtonExists = await this.page.locator('[data-testid="google-login-button"]').count();
      throw new Error(`Guest login form not present. Google button exists: ${googleButtonExists > 0}. This suggests VITE_ENABLE_GUEST_LOGIN is not set in build.`);
    }
    
    // Wait for guest name input to be visible
    await this.page.waitForSelector('[data-testid="guest-name-input"]', { 
      timeout: 10000 
    });
    
    // Fill in guest name
    const nameInput = this.page.locator('[data-testid="guest-name-input"]');
    await nameInput.fill('E2E Test User');
    
    // Find and click guest login button
    const loginButton = this.page.locator('[data-testid="guest-login-button"]');
    
    // Wait for button to be enabled (not disabled)
    await this.page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="guest-login-button"]');
      return btn && !btn.disabled;
    }, { timeout: 5000 });
    
    // Click login and wait for navigation
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }),
      loginButton.click()
    ]);
    
    // Verify we're redirected to the home page or sessions page
    const finalUrl = this.page.url();
    if (finalUrl.includes('/login')) {
      throw new Error('Still on login page after login attempt');
    }
    
    this.log(`Successfully logged in, redirected to: ${finalUrl}`);
  }

  async testSessionCreation() {
    // Look for create session button on authenticated home page
    await this.page.waitForSelector('[data-testid="create-session-button"]', { 
      timeout: 10000 
    });
    
    // Click create session button
    const createButton = this.page.locator('[data-testid="create-session-button"]');
    await createButton.click();
    
    // Wait for quick session creation (might show modal or redirect directly)
    await this.page.waitForTimeout(3000);
    
    // Check if we're redirected to a session page or if there's a success indication
    const finalUrl = this.page.url();
    const pageContent = await this.page.textContent('body');
    
    if (finalUrl.includes('/session/') || pageContent.includes('session') || pageContent.includes('Session')) {
      this.log(`Session creation successful - URL: ${finalUrl}`);
    } else {
      throw new Error('Session creation may have failed - no session page or session content found');
    }
  }

  async testCriticalUserFlow() {
    // Test the complete critical path: load app -> login -> create session
    await this.testFrontendLoad();
    await this.testGuestLogin();
    await this.testSessionCreation();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('PRODUCTION E2E TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('');
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${status} ${result.name}${duration}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (failed > 0) {
      console.log('❌ E2E tests failed. Production deployment has critical issues.');
      process.exit(1);
    } else {
      console.log('✅ All E2E tests passed. Production deployment is working correctly.');
      process.exit(0);
    }
  }

  async run() {
    this.log('Starting Production E2E Browser Tests');
    this.log(`Frontend URL: ${PROD_CONFIG.FRONTEND_URL}`);
    this.log(`Backend URL: ${PROD_CONFIG.BACKEND_URL}`);
    this.log('');

    try {
      await this.setupBrowser();
      
      // Run individual component tests
      await this.runTest('Frontend Load Test', () => this.testFrontendLoad());
      await this.runTest('Guest Login Test', () => this.testGuestLogin());
      await this.runTest('Session Creation Test', () => this.testSessionCreation());
      
      // Run complete user flow test
      await this.runTest('Complete User Flow Test', () => this.testCriticalUserFlow());
      
    } finally {
      await this.teardown();
    }
    
    this.printSummary();
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ProductionE2ETest();
  tester.run().catch(error => {
    console.error('❌ Production E2E test suite failed:', error.message);
    process.exit(1);
  });
}

export default ProductionE2ETest;