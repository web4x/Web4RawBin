import { defineConfig } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';

// T100 / fail-closed isolation (the recurring-pollution root cause fix):
// E2E is ISOLATED BY DEFAULT. A plain `npx playwright test` spawns its OWN server on a
// SEPARATE port (4445/4001) with an isolated tmp DATA_DIR + reuseExistingServer:false, so
// it CANNOT reach the live prod server on 4444 and CANNOT write prod data/.
// To deliberately run against the live server, opt OUT with E2E_LIVE=1 (port 4444, reuse,
// prod DATA_DIR). Previously isolation was opt-IN (E2E_ISOLATED=1) and the DEFAULT run
// reused live 4444 + ignored DATA_DIR → that is how prod got polluted. Now the default is safe.
const LIVE = process.env.E2E_LIVE === '1';
const ISOLATED = !LIVE;
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
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--ignore-certificate-errors'],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    timeout: 15000,
    // ISOLATED (default): never reuse a live server — own one on 4445 with tmp data.
    // LIVE (E2E_LIVE=1): reuse the running prod server on 4444.
    reuseExistingServer: LIVE,
    env: {
      ...process.env,
      ...(ISOLATED
        ? {
            DATA_DIR: process.env.E2E_DATA_DIR || path.join(os.tmpdir(), 'rawbin-e2e-data'),
            HTTPS_PORT: '4445',
            PORT: '4001',
          }
        : {}),
    },
  },
});
