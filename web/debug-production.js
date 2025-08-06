import { chromium } from 'playwright';

async function debugProductionAuth() {
  console.log('🔍 Starting detailed production authentication debug...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for observation
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    if (request.url().includes('api/')) {
      console.log(`📤 API Request Headers:`, request.headers());
      if (request.postData()) {
        console.log(`📤 API Request Body:`, request.postData());
      }
    }
  });

  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
    console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    if (response.url().includes('api/')) {
      console.log(`📥 API Response Headers:`, response.headers());
      console.log(`📥 API Response Status:`, response.status());
    }
  });

  // Capture all console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`🖥️  BROWSER ${type.toUpperCase()}: ${text}`);
  });

  try {
    // Step 1: Navigate to production site
    console.log('\n=== STEP 1: Navigate to Production Site ===');
    await page.goto('https://sync-watch-frontend.onrender.com/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const title = await page.title();
    console.log(`✅ Page loaded: ${title}`);

    // Step 2: Navigate to login page
    console.log('\n=== STEP 2: Navigate to Login ===');
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Get Started")');
    await page.waitForTimeout(2000);

    // Step 3: Fill guest form and login
    console.log('\n=== STEP 3: Guest Login ===');
    const guestNameInput = page.locator('[data-testid="guest-name-input"]');
    await guestNameInput.waitFor({ timeout: 15000 });
    
    const guestButton = page.locator('[data-testid="guest-login-button"]');
    await guestButton.waitFor();
    
    await guestNameInput.fill('Debug User');
    await page.waitForTimeout(1000);
    
    console.log('🔑 Clicking guest login button...');
    await guestButton.click();
    
    // Wait for login to complete
    await page.waitForFunction(() => window.location.pathname === '/', { timeout: 30000 });
    console.log('✅ Guest login completed');

    // Step 4: Check authentication state
    console.log('\n=== STEP 4: Check Authentication State ===');
    
    // Check cookies
    const cookies = await context.cookies();
    console.log('🍪 Current cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...', domain: c.domain, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite })));
    
    const tokenCookie = cookies.find(c => c.name === 'token');
    if (tokenCookie) {
      console.log('✅ JWT token cookie found');
      console.log('🍪 Token cookie details:', {
        domain: tokenCookie.domain,
        path: tokenCookie.path,
        httpOnly: tokenCookie.httpOnly,
        secure: tokenCookie.secure,
        sameSite: tokenCookie.sameSite
      });
    } else {
      console.log('❌ JWT token cookie NOT found');
    }

    // Check document.cookie via browser
    const documentCookies = await page.evaluate(() => document.cookie);
    console.log('🍪 document.cookie:', documentCookies);

    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        storage[key] = window.localStorage.getItem(key);
      }
      return storage;
    });
    console.log('💾 localStorage:', localStorage);

    // Step 5: Attempt session creation with detailed monitoring
    console.log('\n=== STEP 5: Attempt Session Creation ===');
    
    const createButton = page.locator('[data-testid="create-session-button"]');
    await createButton.waitFor({ timeout: 15000 });
    
    // Clear previous requests/responses for clean analysis
    requests.length = 0;
    responses.length = 0;
    
    console.log('🎬 Clicking create session button...');
    await createButton.click();
    
    // Wait for the API request to complete
    await page.waitForTimeout(5000);
    
    // Analyze the session creation request
    console.log('\n=== SESSION CREATION REQUEST ANALYSIS ===');
    const sessionRequests = requests.filter(r => r.url.includes('/api/sessions') && r.method === 'POST');
    const sessionResponses = responses.filter(r => r.url.includes('/api/sessions'));
    
    if (sessionRequests.length > 0) {
      const sessionRequest = sessionRequests[0];
      console.log('📤 Session Creation Request:');
      console.log('   URL:', sessionRequest.url);
      console.log('   Method:', sessionRequest.method);
      console.log('   Headers:', JSON.stringify(sessionRequest.headers, null, 2));
      console.log('   Body:', sessionRequest.postData);
      
      // Check for cookie header
      const hasCookieHeader = sessionRequest.headers['cookie'];
      const hasAuthHeader = sessionRequest.headers['authorization'];
      
      console.log('🔍 Authentication Analysis:');
      console.log('   Cookie header present:', !!hasCookieHeader);
      console.log('   Authorization header present:', !!hasAuthHeader);
      
      if (hasCookieHeader) {
        console.log('   Cookie header value:', hasCookieHeader);
      }
      if (hasAuthHeader) {
        console.log('   Authorization header value:', hasAuthHeader.substring(0, 30) + '...');
      }
    }
    
    if (sessionResponses.length > 0) {
      const sessionResponse = sessionResponses[0];
      console.log('📥 Session Creation Response:');
      console.log('   Status:', sessionResponse.status);
      console.log('   Headers:', JSON.stringify(sessionResponse.headers, null, 2));
      
      if (sessionResponse.status === 401) {
        console.log('❌ 401 UNAUTHORIZED - Authentication failed');
        console.log('🔍 This confirms the JWT token is not being sent properly');
      }
    }

    // Step 6: Manual cookie extraction test
    console.log('\n=== STEP 6: Manual Cookie Extraction Test ===');
    const manualCookieTest = await page.evaluate(() => {
      const cookies = document.cookie;
      console.log('🍪 Raw document.cookie:', cookies);
      
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      console.log('🔍 Extracted token:', cookieToken ? 'Found' : 'Not found');
      
      return {
        rawCookies: cookies,
        extractedToken: cookieToken,
        tokenFound: !!cookieToken
      };
    });
    
    console.log('Manual cookie extraction result:', manualCookieTest);

    // Step 7: Test environment detection
    console.log('\n=== STEP 7: Environment Detection Test ===');
    const envTest = await page.evaluate(() => {
      const hostname = window.location.hostname;
      const isOnRender = hostname.includes('onrender.com');
      const apiUrl = window.apiBaseUrl || 'Not set in window';
      
      return {
        hostname,
        isOnRender,
        apiUrl,
        protocol: window.location.protocol,
        origin: window.location.origin
      };
    });
    
    console.log('Environment detection:', envTest);

    // Keep browser open for manual inspection
    console.log('\n=== DEBUG SESSION COMPLETE ===');
    console.log('Browser will remain open for manual inspection...');
    console.log('Press Ctrl+C to close when done inspecting.');
    
    // Wait indefinitely until manually closed
    await page.waitForTimeout(300000); // 5 minutes max

  } catch (error) {
    console.error('❌ Debug session failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await browser.close();
  }
}

// Run the debug session
runDebugSession().catch(error => {
  console.error('💥 Debug session crashed:', error.message);
  process.exit(1);
});

async function runDebugSession() {
  await debugProductionAuth();
}