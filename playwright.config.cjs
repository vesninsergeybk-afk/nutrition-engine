const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  outputDir: './reports/playwright-artifacts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 1,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [
    ['line'],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }]
  ],
  use: {
    locale: 'ru-RU',
    timezoneId: 'Europe/Paris',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.PLAYWRIGHT_USE_SYSTEM_CHROMIUM === '1' ? 'off' : 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], ...(process.env.PLAYWRIGHT_USE_SYSTEM_CHROMIUM === '1' ? { launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } } : {}) } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
