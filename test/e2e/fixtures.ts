/**
 * T180 — Shared Playwright fixtures with CDP Security.setIgnoreCertificateErrors.
 * Enables SW registration over self-signed HTTPS (secure context).
 *
 * Usage in specs:
 *   import { test, expect } from './fixtures';  // instead of '@playwright/test'
 *
 * [impl:uuid:b4f180c5-d6e7-4f8a-9b01-2c3d4e5f6a80] T180 Track 2
 */
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    try {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Security.setIgnoreCertificateErrors', { ignore: true });
    } catch {
      // CDP not available (non-Chromium) — ignoreHTTPSErrors still active
    }
    await use(page);
  },
});

export { expect };
