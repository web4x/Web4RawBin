import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'https://localhost:4444',
    ignoreHTTPSErrors: true,
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'https://localhost:4444',
    ignoreHTTPSErrors: true,
    timeout: 15000,
    reuseExistingServer: true,
  },
});
