import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Integration Test Setup Starting...');
  
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  console.log(`📡 Backend: ${backendUrl}`);
  console.log(`🌐 Frontend: ${frontendUrl}`);
  
  // Wait for backend to be ready
  const maxRetries = 15;
  const retryDelay = 2000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${backendUrl}/health`);
      if (response.ok) {
        const health = await response.json();
        console.log('✅ Backend is healthy');
        break;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('❌ Backend failed to start');
        console.error('💡 Run: docker-compose up -d postgres && cd backend && npm run dev');
        throw new Error(`Backend not available at ${backendUrl}/health`);
      }
      
      if (i % 5 === 0) { // Log every 5th attempt
        console.log(`⏳ Waiting for backend (${i + 1}/${maxRetries})...`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // Quick frontend check
  try {
    const response = await fetch(frontendUrl);
    if (response.ok) {
      console.log('✅ Frontend is accessible');
    }
  } catch (error) {
    console.log('⚠️ Frontend check failed, continuing...');
    console.log('💡 Run: cd web && npm run dev');
  }
  
  console.log('🎯 Setup Complete - Ready for integration tests!');
}

export default globalSetup; 