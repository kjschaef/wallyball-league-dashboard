import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: process.env.VERCEL_PROTECTION_BYPASS ? {
      'x-vercel-protection-bypass': process.env.VERCEL_PROTECTION_BYPASS,
      'x-vercel-set-bypass-cookie': 'samesite-none',
      'automation-bypass': 'true',
    } : undefined,
  },
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'OPENAI_API_KEY=dummy pnpm run dev',
    port: 5002,
    reuseExistingServer: !process.env.CI,
  },
});
