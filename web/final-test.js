import { chromium } from 'playwright';

async function finalProductionTest() {
  console.log('🎯 Final Production Test - Cookie Domain Fix Verification');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor requests for session creation
  page.on('request', request => {
    if (request.url().includes('/api/sessions') && request.method() === 'POST') {
      console.log('📤 SESSION CREATE REQUEST:');
      console.log('   Headers:', request.headers());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/sessions') && response.status() !== 200 && response.status() !== 201) {
      console.log(`❌ API Error: ${response.status()} ${response.url()}`);
    }
  });

  page.on('console', msg => {
    if (msg.text().includes('Sessions Store') || msg.text().includes('cookieToken')) {
      console.log(`🖥️  ${msg.text()}`);
    }
  });

  try {
    // Step 1: Navigate and login
    console.log('1️⃣ Navigating to production site...');
    await page.goto('https://sync-watch-frontend.onrender.com/', { waitUntil: 'networkidle' });
    
    // Navigate to login
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Get Started")');
    await page.waitForTimeout(2000);

    // Guest login
    console.log('2️⃣ Performing guest login...');
    const guestNameInput = page.locator('[data-testid="guest-name-input"]');
    await guestNameInput.waitFor({ timeout: 15000 });
    
    const guestButton = page.locator('[data-testid="guest-login-button"]');
    await guestButton.waitFor();
    
    await guestNameInput.fill('Final Test User');
    await page.waitForTimeout(1000);
    await guestButton.click();
    
    // Wait for login completion
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 30000 });
    console.log('✅ Guest login completed');

    // Step 2: Check cookie access
    console.log('3️⃣ Testing cookie access with new domain...');
    const cookieTest = await page.evaluate(() => {
      const cookies = document.cookie;
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      return {
        rawCookies: cookies,
        tokenFound: !!cookieToken,
        tokenPreview: cookieToken ? cookieToken.substring(0, 20) + '...' : 'None'
      };
    });
    
    console.log('🍪 Cookie Test Results:');
    console.log('   Raw cookies:', cookieTest.rawCookies);
    console.log('   Token found:', cookieTest.tokenFound);
    console.log('   Token preview:', cookieTest.tokenPreview);

    if (!cookieTest.tokenFound) {
      console.log('❌ Cookie still not accessible! Domain fix may not be deployed yet.');
      return;
    }

    // Step 3: Test session creation
    console.log('4️⃣ Testing session creation with cookie access...');
    const createButton = page.locator('[data-testid="create-session-button"]');
    await createButton.waitFor({ timeout: 15000 });
    
    await createButton.click();
    
    // Wait for either success or error
    try {
      await page.waitForFunction(() => {
        return window.location.pathname.includes('/session/');
      }, { timeout: 15000 });
      
      console.log('🎉 SUCCESS! Session creation worked!');
      console.log('✅ Current URL:', page.url());
      
    } catch (error) {
      console.log('❌ Session creation still failed. Checking logs...');
      await page.waitForTimeout(3000);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🏁 Test completed. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

finalProductionTest().catch(console.error);