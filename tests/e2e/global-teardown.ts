import { FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 * Runs once after all tests complete
 * 
 * Responsibilities:
 * - Clean up test data (optional - may keep for debugging)
 * - Close connections
 * - Generate reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');

  // Note: Test data cleanup is handled in individual test files
  // to allow for post-test debugging

  console.log('✅ Global teardown complete');
}

export default globalTeardown;
