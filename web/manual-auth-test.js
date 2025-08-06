import { chromium } from 'playwright';

async function manualAuthTest() {
  console.log('🔧 Manual Auth Test - Injecting localStorage token');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to production site
    await page.goto('https://sync-watch-frontend.onrender.com/', { waitUntil: 'networkidle' });
    
    // Navigate to login and perform guest login
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Get Started")');
    await page.waitForTimeout(2000);

    const guestNameInput = page.locator('[data-testid="guest-name-input"]');
    await guestNameInput.waitFor({ timeout: 15000 });
    
    const guestButton = page.locator('[data-testid="guest-login-button"]');
    await guestButton.waitFor();
    
    await guestNameInput.fill('Manual Test User');
    await page.waitForTimeout(1000);
    await guestButton.click();
    
    // Wait for login completion
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 30000 });
    console.log('✅ Guest login completed');

    // Get user data from localStorage
    const userData = await page.evaluate(() => {
      return localStorage.getItem('user');
    });
    
    console.log('👤 User data:', userData);
    
    if (userData) {
      const user = JSON.parse(userData);
      
      // Create a temporary auth token manually
      const tempToken = await page.evaluate((user) => {
        const tokenData = { 
          userId: user.id, 
          email: user.email, 
          timestamp: Date.now() 
        };
        const token = btoa(JSON.stringify(tokenData));
        localStorage.setItem('auth_token', token);
        console.log('🔑 Manual: Temporary token created and stored');
        return token;
      }, user);
      
      console.log('🔑 Created temp token:', tempToken.substring(0, 50) + '...');
      
      // Now try session creation
      const createButton = page.locator('[data-testid="create-session-button"]');
      await createButton.waitFor({ timeout: 15000 });
      
      console.log('🎬 Attempting session creation with manual token...');
      await createButton.click();
      
      await page.waitForTimeout(8000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/session/')) {
        console.log('🎉 SUCCESS! Session created with manual token:', currentUrl);
      } else {
        console.log('❌ Session creation still failed. Current URL:', currentUrl);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('Keeping browser open for inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

manualAuthTest().catch(console.error);