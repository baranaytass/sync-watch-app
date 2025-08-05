import { chromium } from 'playwright';

async function runProductionTest() {
  console.log('🚀 Starting production test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Listen for console logs
    page.on('console', msg => {
      if (msg.text().includes('🍪') || msg.text().includes('401') || msg.text().includes('error') || msg.text().includes('Sessions Store')) {
        console.log('🔍 Browser Console:', msg.text());
      }
    });

    // Listen for network errors
    page.on('response', response => {
      if (response.status() >= 400) {  
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('📄 Navigating to production frontend');
    await page.goto('https://sync-watch-frontend.onrender.com/', { waitUntil: 'networkidle' });
    
    // Navigate to login via JavaScript routing
    console.log('🔗 Navigating to login page via router');
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Get Started")');
    await page.waitForTimeout(2000);
    
    // Check if page loaded correctly
    const title = await page.title();
    if (!title.includes('Sync') && !title.includes('Watch') && !title.includes('Video')) {
      throw new Error('Page title incorrect: ' + title);
    }
    console.log('✅ Page loaded with correct title:', title);
    
    // Guest name input
    console.log('🔍 Looking for guest name input');
    const guestNameInput = page.locator('[data-testid="guest-name-input"]');
    await guestNameInput.waitFor({ timeout: 15000 });
    
    // Guest login button
    const guestButton = page.locator('[data-testid="guest-login-button"]');
    await guestButton.waitFor();
    
    console.log('📝 Entering guest name: Prod Test User');
    await guestNameInput.fill('Prod Test User');
    
    // Button should be enabled now
    await page.waitForTimeout(1000);
    
    console.log('🔑 Clicking guest login button...');
    await guestButton.click();
    
    // Wait for redirect to home (check URL change)
    console.log('⏳ Waiting for redirect to home page...');
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 30000 });
    console.log('✅ Successfully redirected to authenticated home page');
    
    // Verify username in navbar
    const userNameElement = page.locator('nav').locator('text=Prod Test User').first();
    await userNameElement.waitFor({ timeout: 15000 });
    console.log('✅ Username visible in navbar');
    
    // Check JWT cookie
    const cookies = await context.cookies();
    const hasToken = cookies.some(c => c.name === 'token');
    console.log('🍪 JWT cookie found:', hasToken);
    if (!hasToken) {
      throw new Error('JWT token cookie not found');
    }
    
    // Test session creation
    console.log('🎬 Testing session creation...');
    
    const createButton = page.locator('[data-testid="create-session-button"]');
    await createButton.waitFor({ timeout: 15000 });
    
    console.log('🔘 Clicking create session button...');
    await createButton.click();
    
    // Wait for session creation and redirect
    console.log('⏳ Waiting for session to be created and redirected...');
    
    try {
      await page.waitForURL(/.*\/session\/[a-f0-9-]+/, { timeout: 30000 });
      console.log('✅ SUCCESS: Session created and redirected to session page');
      
      const currentUrl = page.url();
      console.log('🎯 Session URL:', currentUrl);
      
      if (!currentUrl.match(/\/session\/[a-f0-9-]+/)) {
        throw new Error('URL does not match session pattern');
      }
      
      // Check for session page elements
      const sessionTitle = page.locator('[data-testid="session-title"]');
      await sessionTitle.waitFor({ timeout: 10000 });
      console.log('📋 Session page loaded with title element visible');
      
      console.log('🎉 ALL TESTS PASSED! Production session creation is working correctly.');
      
    } catch (error) {
      console.log('❌ FAILED: Session creation timeout or error');
      console.log('🔍 Current URL after create attempt:', page.url());
      
      // Check for error messages
      const errorElements = await page.locator('[class*="error"], [class*="alert"]').all();
      for (const element of errorElements) {
        const text = await element.textContent();
        if (text) {
          console.log('⚠️  Error message found:', text);
        }
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
runProductionTest().catch(error => {
  console.error('💥 Production test failed:', error.message);
  process.exit(1);
});