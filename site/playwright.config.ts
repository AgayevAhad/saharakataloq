import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const chromiumPath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync('/usr/bin/chromium')
    ? '/usr/bin/chromium'
    : existsSync('/usr/bin/google-chrome-stable')
      ? '/usr/bin/google-chrome-stable'
      : undefined);

export default defineConfig({
  testDir: './tests/browser',
  testIgnore: '**/productionRuntime.spec.ts',
  timeout: 45000,
  expect: {
    timeout: 8000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    },
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5188',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  webServer: {
    command: 'node scripts/playwright-test-server.mjs',
    url: 'http://127.0.0.1:5188',
    reuseExistingServer: false,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumPath
          ? {
              launchOptions: {
                executablePath: chromiumPath,
                args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-gpu',
                ],
              },
            }
          : {}),
      },
    },
  ],
});
