import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Krypton School ERP E2E tests
 * 
 * Tests critical user journeys and security scenarios:
 * - School signup and subscription
 * - M-Pesa payment flows
 * - Attendance tracking (online and offline)
 * - Cross-tenant isolation (security)
 * - Authentication flows (login, MFA, password reset)
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Single worker to avoid conflicts
  
  // Reporter settings
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['list'], // Console output
  ],
  
  // Global settings
  use: {
    // Base URL for tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
    
    // Capture screenshots and traces on failure
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    
    // Navigation timeout
    navigationTimeout: 30000,
    actionTimeout: 15000,
    
    // API request options
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Test projects (browsers)
  projects: [
    {
      name: 'API Tests',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Web server configuration (auto-start API for tests)
  webServer: process.env.CI ? undefined : {
    command: 'cd apps/api && pnpm run start:dev',
    url: 'http://localhost:3001/api/v1/health',
    reuseExistingServer: true,
    timeout: 120000, // 2 minutes to start
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup and teardown
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
});
