import { chromium } from 'playwright';

async function debugSessionCreation() {
  console.log('🔍 Debug Session Creation - Detailed Network Analysis');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor all session-related requests
  page.on('request', request => {
    if (request.url().includes('/api/sessions') && request.method() === 'POST') {
      console.log('\n📤 SESSION CREATION REQUEST:');
      console.log('URL:', request.url());
      console.log('Headers:', request.headers());
      console.log('Body:', request.postData());
      
      const authHeader = request.headers()['authorization'];
      if (authHeader) {
        console.log('✅ Authorization header present:', authHeader.substring(0, 50) + '...');
        
        // Parse JWT payload
        try {
          const token = authHeader.replace('Bearer ', '');
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log('🔍 Token payload:', payload);
          }
        } catch (e) {
          console.log('❌ Could not parse token');
        }
      } else {
        console.log('❌ No Authorization header!');
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/sessions')) {
      console.log('\n📥 SESSION API RESPONSE:');
      console.log('Status:', response.status());
      console.log('URL:', response.url());
    }
  });

  // Monitor console logs
  page.on('console', msg => {
    if (msg.text().includes('Sessions Store') || msg.text().includes('auth_token') || msg.text().includes('Authorization')) {
      console.log(`🖥️  ${msg.text()}`);
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
    
    await guestNameInput.fill('Debug Session User');
    await page.waitForTimeout(1000);
    
    console.log('🔑 Logging in...');
    await guestButton.click();
    
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 30000 });
    console.log('✅ Login completed');

    // Check token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    console.log('🔑 Token in localStorage:', token ? 'Present (' + token.length + ' chars)' : 'Missing');

    // Check authentication state before creating session
    const authState = await page.evaluate(() => {
      return {
        hasUserInLocalStorage: !!localStorage.getItem('user'),
        userString: localStorage.getItem('user'),
        hasToken: !!localStorage.getItem('auth_token'),
        cookies: document.cookie,
        pathname: window.location.pathname
      }
    });
    
    console.log('\n🔐 Auth State Check:');
    console.log('📱 User in localStorage:', authState.hasUserInLocalStorage);
    if (authState.userString) {
      try {
        const userData = JSON.parse(authState.userString);
        console.log('👤 User data:', { id: userData.id, name: userData.name, email: userData.email });
      } catch (e) {
        console.log('👤 User data (raw):', authState.userString);
      }
    }
    console.log('🔑 Token in localStorage:', authState.hasToken);
    console.log('🍪 Document cookies:', authState.cookies);
    console.log('🌐 Current path:', authState.pathname);
    
    // Try session creation
    const createButton = page.locator('[data-testid="create-session-button"]');
    await createButton.waitFor({ timeout: 15000 });
    
    console.log('\n🎬 Clicking create session - monitoring request...');
    await createButton.click();
    
    // Wait for request to complete
    await page.waitForTimeout(8000);
    
    const finalUrl = page.url();
    console.log('\n🏁 Final URL:', finalUrl);
    
    if (finalUrl.includes('/session/')) {
      console.log('🎉 SUCCESS! Session created successfully!');
    } else {
      console.log('❌ Session creation failed');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    console.log('\n📋 Debug session complete. Browser remains open...');
    await page.waitForTimeout(60000);
    await browser.close();
  }
}

debugSessionCreation().catch(console.error);