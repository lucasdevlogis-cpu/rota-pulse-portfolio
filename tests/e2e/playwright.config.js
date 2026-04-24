const path = require('path');
const { defineConfig, devices } = require('@playwright/test');
const { runtime } = require('./fixtures/env');

const authFile = path.resolve(__dirname, 'output/playwright/.auth/admin.json');
const browserChannel = process.env.ROTA_PULSE_E2E_BROWSER_CHANNEL || undefined;
const desktopDevice = browserChannel && browserChannel.startsWith('msedge')
  ? devices['Desktop Edge']
  : devices['Desktop Chrome'];

module.exports = defineConfig({
  testDir: './specs',
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './output/playwright/report' }],
  ],
  outputDir: './output/playwright/test-results',
  use: {
    baseURL: runtime.baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...(browserChannel ? { channel: browserChannel } : {}),
  },
  projects: [
    {
      name: 'setup',
      testDir: './fixtures',
      testMatch: /auth\.setup\.js/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...desktopDevice,
        ...(browserChannel ? { channel: browserChannel } : {}),
        storageState: authFile,
      },
    },
  ],
});
