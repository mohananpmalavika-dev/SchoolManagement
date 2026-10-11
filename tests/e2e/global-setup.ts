import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Runs once before all tests
 * 
 * Responsibilities:
 * - Verify API is running
 * - Seed test database with fixture data
 * - Create test tenants and users
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');

  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3001';

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for API to be ready
    console.log('⏳ Waiting for API to be ready...');
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.request.get(`${baseURL}/health`);
        if (response.ok()) {
          console.log('✅ API is ready');
          break;
        }
      } catch (error) {
        // API not ready yet
      }
      
      retries--;
      if (retries === 0) {
        throw new Error('API failed to start within timeout');
      }
      
      await page.waitForTimeout(2000); // Wait 2 seconds between retries
    }

    // Check database connection
    console.log('📊 Checking database connection...');
    const healthResponse = await page.request.get(`${baseURL}/health`);
    const health = await healthResponse.json();
    
    if (!health.database || health.database !== 'ok') {
      throw new Error('Database is not connected');
    }
    
    console.log('✅ Database is connected');

    // Note: Test data seeding is handled in individual test files
    // using fixtures to ensure test isolation

    console.log('✅ Global setup complete');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
