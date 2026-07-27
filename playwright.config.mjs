import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const localBaseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: externalBaseURL || localBaseURL,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    colorScheme: 'dark',
    acceptDownloads: true,
  },
  webServer: externalBaseURL ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: localBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'fold6-closed',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 850 },
        screen: { width: 390, height: 850 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        userAgent: devices['Galaxy S9+'].userAgent,
      },
    },
    {
      name: 'fold6-unfolded',
      use: {
        browserName: 'chromium',
        viewport: { width: 720, height: 840 },
        screen: { width: 720, height: 840 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        userAgent: devices['Galaxy S9+'].userAgent,
      },
    },
  ],
});
