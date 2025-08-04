#!/usr/bin/env node

/**
 * Production Deployment Verification Test
 * 
 * This script tests the basic functionality of the deployed application
 * to ensure all core features are working in production.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const PROD_CONFIG = {
  FRONTEND_URL: 'https://sync-watch-frontend.onrender.com',
  BACKEND_URL: 'https://sync-watch-backend.onrender.com',
  TIMEOUT: 30000, // 30 seconds
};

class ProductionTester {
  constructor() {
    this.testResults = [];
    this.guestCookie = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFn) {
    this.log(`Running test: ${testName}`);
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.push({ name: testName, status: 'PASS', duration });
      this.log(`Test "${testName}" passed in ${duration}ms`, 'success');
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      this.log(`Test "${testName}" failed: ${error.message}`, 'error');
    }
  }

  async testBackendHealth() {
    const response = await fetch(`${PROD_CONFIG.BACKEND_URL}/health`, {
      timeout: PROD_CONFIG.TIMEOUT
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`Health check returned invalid status: ${data.status}`);
    }
  }

  async testFrontendAccess() {
    const response = await fetch(PROD_CONFIG.FRONTEND_URL, {
      timeout: PROD_CONFIG.TIMEOUT
    });
    
    if (!response.ok) {
      throw new Error(`Frontend access failed with status ${response.status}`);
    }
    
    const html = await response.text();
    if (!html.includes('<!DOCTYPE html>')) {
      throw new Error('Frontend did not return valid HTML');
    }
  }

  async testGuestAuthentication() {
    const response = await fetch(`${PROD_CONFIG.BACKEND_URL}/api/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Prod Test User' }),
      timeout: PROD_CONFIG.TIMEOUT
    });
    
    if (!response.ok) {
      throw new Error(`Guest auth failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success || !data.data || !data.data.id) {
      throw new Error('Guest auth returned invalid response structure');
    }
    
    // Store cookie for subsequent tests
    this.guestCookie = response.headers.get('set-cookie');
    if (!this.guestCookie) {
      throw new Error('No authentication cookie received');
    }
  }

  async testSessionCreation() {
    if (!this.guestCookie) {
      throw new Error('No guest cookie available for session creation test');
    }
    
    const response = await fetch(`${PROD_CONFIG.BACKEND_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.guestCookie,
      },
      body: JSON.stringify({ title: 'Production Test Session' }),
      timeout: PROD_CONFIG.TIMEOUT
    });
    
    if (response.status !== 201) {
      throw new Error(`Session creation failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success || !data.data || !data.data.id) {
      throw new Error('Session creation returned invalid response structure');
    }
    
    return data.data.id;
  }

  async testSessionsList() {
    if (!this.guestCookie) {
      throw new Error('No guest cookie available for sessions list test');
    }
    
    const response = await fetch(`${PROD_CONFIG.BACKEND_URL}/api/sessions`, {
      headers: {
        'Cookie': this.guestCookie,
      },
      timeout: PROD_CONFIG.TIMEOUT
    });
    
    if (!response.ok) {
      throw new Error(`Sessions list failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error('Sessions list returned invalid response structure');
    }
  }

  async testCorsConfiguration() {
    const response = await fetch(`${PROD_CONFIG.BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Origin': PROD_CONFIG.FRONTEND_URL,
      },
      timeout: PROD_CONFIG.TIMEOUT
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader !== PROD_CONFIG.FRONTEND_URL) {
      throw new Error(`CORS not configured correctly. Expected: ${PROD_CONFIG.FRONTEND_URL}, Got: ${corsHeader}`);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('PRODUCTION TEST SUMMARY');
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
      console.log('❌ Some tests failed. Production deployment may have issues.');
      process.exit(1);
    } else {
      console.log('✅ All tests passed. Production deployment is healthy.');
      process.exit(0);
    }
  }

  async run() {
    this.log('Starting Production Deployment Verification Tests');
    this.log(`Frontend URL: ${PROD_CONFIG.FRONTEND_URL}`);
    this.log(`Backend URL: ${PROD_CONFIG.BACKEND_URL}`);
    this.log('');

    // Core infrastructure tests
    await this.runTest('Backend Health Check', () => this.testBackendHealth());
    await this.runTest('Frontend Access', () => this.testFrontendAccess());
    await this.runTest('CORS Configuration', () => this.testCorsConfiguration());
    
    // Authentication tests
    await this.runTest('Guest Authentication', () => this.testGuestAuthentication());
    
    // Core functionality tests
    await this.runTest('Session Creation', () => this.testSessionCreation());
    await this.runTest('Sessions List', () => this.testSessionsList());
    
    this.printSummary();
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new ProductionTester();
  tester.run().catch(error => {
    console.error('❌ Production test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = ProductionTester;