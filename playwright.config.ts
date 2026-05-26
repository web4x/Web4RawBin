import { defineConfig } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';

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
  // T100: isolate E2E data — when Playwright launches its OWN server (no running
  // server on 4444), DATA_DIR redirects ALL writes (profiles, devices, rooms,
  // users/.ssh, avatars) to an isolated tmp dir so prod data/ is never touched.
  // NOTE: reuseExistingServer:true means a live server on 4444 is reused as-is —
  // for GUARANTEED isolation, stop the live server first so Playwright spawns fresh
  // with DATA_DIR below (e.g. CI, or after the purge-restart).
  webServer: {
    command: 'npm run dev',
    url: 'https://localhost:4444',
    ignoreHTTPSErrors: true,
    timeout: 15000,
    reuseExistingServer: true,
    env: {
      ...process.env,
      DATA_DIR: process.env.E2E_DATA_DIR || path.join(os.tmpdir(), 'rawbin-e2e-data'),
    },
  },
});
