import { chromium } from 'playwright';

async function networkDebug() {
  console.log('🔍 Network Debug - Set-Cookie Headers Analysis');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor all responses
  page.on('response', async response => {
    if (response.url().includes('api/auth/guest')) {
      console.log('\n📥 AUTH RESPONSE ANALYSIS:');
      console.log('URL:', response.url());
      console.log('Status:', response.status());
      
      const headers = response.headers();
      console.log('Headers:', JSON.stringify(headers, null, 2));
      
      if (headers['set-cookie']) {
        console.log('🍪 Set-Cookie header found:', headers['set-cookie']);
      } else {
        console.log('❌ No Set-Cookie header!');
      }
      
      try {
        const body = await response.text();
        console.log('Response body:', body);
      } catch (e) {
        console.log('Could not read response body');
      }
    }
  });
  
  try {
    // Navigate to site
    await page.goto('https://sync-watch-frontend.onrender.com/', { waitUntil: 'networkidle' });
    
    // Navigate to login
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Get Started")');
    await page.waitForTimeout(2000);

    // Fill and submit guest form
    const guestNameInput = page.locator('[data-testid="guest-name-input"]');
    await guestNameInput.waitFor({ timeout: 15000 });
    
    const guestButton = page.locator('[data-testid="guest-login-button"]');
    await guestButton.waitFor();
    
    await guestNameInput.fill('Network Debug User');
    await page.waitForTimeout(1000);
    
    console.log('🔑 Clicking guest login - monitoring response...');
    await guestButton.click();
    
    // Wait for response processing
    await page.waitForTimeout(5000);
    
    // Check final cookie state
    const cookies = await context.cookies();
    console.log('\n🍪 FINAL COOKIE STATE:');
    cookies.forEach(cookie => {
      console.log(`  ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
      console.log(`    Domain: ${cookie.domain}`);
      console.log(`    HttpOnly: ${cookie.httpOnly}`);
      console.log(`    Secure: ${cookie.secure}`);
      console.log(`    SameSite: ${cookie.sameSite}`);
      console.log('    ---');
    });
    
    if (cookies.length === 0) {
      console.log('❌ NO COOKIES SET BY BROWSER');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    console.log('\nKeeping browser open for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

networkDebug().catch(console.error);