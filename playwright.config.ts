import { defineConfig } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';

// T100: ISOLATED AC4 mode (E2E_ISOLATED=1) — Playwright spawns its OWN server on a
// SEPARATE port (4445/4001) with an isolated tmp DATA_DIR, so the live prod server on
// 4444 is fully untouched (cannot be reused — different port). Both port AND data dir
// isolated. Requires expert's process.env.HTTPS_PORT/PORT override (server.ts:64-65).
// Learned the hard way: reuseExistingServer:true + shared port 4444 leaked test data
// to prod when the live server was up. Port isolation removes the race entirely.
const ISOLATED = process.env.E2E_ISOLATED === '1';
const HTTPS_PORT = ISOLATED ? '4445' : '4444';
const BASE_URL = `https://localhost:${HTTPS_PORT}`;

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    timeout: 15000,
    // ISOLATED: never reuse a live server — spawn our own on 4445 with tmp data.
    reuseExistingServer: !ISOLATED,
    env: {
      ...process.env,
      DATA_DIR: process.env.E2E_DATA_DIR || path.join(os.tmpdir(), 'rawbin-e2e-data'),
      ...(ISOLATED ? { HTTPS_PORT: '4445', PORT: '4001' } : {}),
    },
  },
});
