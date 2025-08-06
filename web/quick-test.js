import { chromium } from 'playwright';

async function quickTest() {
  console.log('🔍 Quick Production Test - Current Status');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Go to production site
    await page.goto('https://sync-watch-frontend.onrender.com/', { waitUntil: 'networkidle' });
    
    // Navigate to login
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Get Started")');
    await page.waitForTimeout(2000);

    // Guest login
    const guestNameInput = page.locator('[data-testid="guest-name-input"]');
    await guestNameInput.waitFor({ timeout: 15000 });
    
    const guestButton = page.locator('[data-testid="guest-login-button"]');
    await guestButton.waitFor();
    
    await guestNameInput.fill('Quick Test User');
    await page.waitForTimeout(1000);
    await guestButton.click();
    
    // Wait for login completion
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 30000 });
    console.log('✅ Guest login completed');

    // Check cookies
    const cookies = await context.cookies();
    console.log('🍪 All cookies:', cookies.map(c => ({ name: c.name, domain: c.domain, httpOnly: c.httpOnly })));
    
    // Check document.cookie
    const documentCookies = await page.evaluate(() => document.cookie);
    console.log('🍪 document.cookie:', documentCookies);

    // Try session creation
    const createButton = page.locator('[data-testid="create-session-button"]');
    await createButton.waitFor({ timeout: 15000 });
    
    console.log('🎬 Attempting session creation...');
    await createButton.click();
    
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/session/')) {
      console.log('🎉 SUCCESS! Session created:', currentUrl);
    } else {
      console.log('❌ Session creation failed. Current URL:', currentUrl);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

quickTest().catch(console.error);