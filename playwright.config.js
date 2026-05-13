const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // ========== CLOUD OPTIMIZATION ==========
  fullyParallel: true,
  workers: parseInt(process.env.PLAYWRIGHT_WORKERS || '5', 10),
  
  // Global timeout: 45 minutes for extended load testing
  timeout: 45 * 60 * 1000,
  
  // ========== REPORTING ==========
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  // ========== CLOUD-OPTIMIZED SETTINGS ==========
  use: {
    video: 'off',
    trace: 'off',
    screenshot: 'off',
    headless: true,
    
    // Crucial for running headless Chromium inside Docker/Fargate
    launchArgs: ['--disable-dev-shm-usage', '--no-sandbox'],
  },

  // Simplified project array - No auth setup required for Guest Attendees
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});