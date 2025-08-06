import { chromium } from 'playwright';

async function currentStatusTest() {
  console.log('🔍 Current Production Status Test');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor console for our new logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Auth Store') || text.includes('Fallback') || text.includes('auth_token')) {
      console.log(`🖥️  ${text}`);
    }
  });
  
  try {
    // Navigate and login
    await page.goto('https://sync-watch-frontend.onrender.com/', { waitUntil: 'networkidle' });
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Get Started")');
    await page.waitForTimeout(2000);

    const guestNameInput = page.locator('[data-testid="guest-name-input"]');
    await guestNameInput.waitFor({ timeout: 15000 });
    
    const guestButton = page.locator('[data-testid="guest-login-button"]');
    await guestButton.waitFor();
    
    await guestNameInput.fill('Current Status Test User');
    await page.waitForTimeout(1000);
    
    console.log('🔑 Performing guest login to check new token creation...');
    await guestButton.click();
    
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 30000 });
    console.log('✅ Guest login completed');

    // Check localStorage for new token format
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('auth_token');
    });
    
    console.log('🔑 Auth token from localStorage:', authToken ? authToken.substring(0, 50) + '...' : 'None');
    
    if (authToken) {
      // Try to decode the token to see its structure
      const tokenParts = authToken.split('.');
      console.log('🔍 Token structure:', tokenParts.length === 3 ? 'JWT-like (3 parts)' : `Other format (${tokenParts.length} parts)`);
      
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 Token payload:', payload);
        } catch (e) {
          console.log('❌ Could not decode token payload');
        }
      }
    }

    // Try session creation
    const createButton = page.locator('[data-testid="create-session-button"]');
    await createButton.waitFor({ timeout: 15000 });
    
    console.log('🎬 Attempting session creation with current token...');
    await createButton.click();
    
    await page.waitForTimeout(8000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/session/')) {
      console.log('🎉 SUCCESS! Session created:', currentUrl);
    } else {
      console.log('❌ Session creation failed. Current URL:', currentUrl);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('Browser will remain open for inspection...');
    await page.waitForTimeout(60000);
    await browser.close();
  }
}

currentStatusTest().catch(console.error);