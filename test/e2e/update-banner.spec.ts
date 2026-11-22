/**
 * T94 (v0.5.4): PWA version update banner fires again.
 * [test:uuid:916b8bb0-08ef-4287-98f0-031ddf004723] T94 PWA update banner
 * [verifies:uuid:67bde18f-76f9-43cd-abea-77c2ad7134f9] R-V1 version update
 * Root cause was a frozen startup version; fix = per-request getVersion() so /api/config always
 * reports the on-disk version. This spec drives a version mismatch in the browser and asserts
 * rb-update-banner (shadow DOM) shows "Update Now" (AC1/AC6), that clicking it stores the new
 * version + dismisses (AC2), and that the banner element is present on bundle pages /app + /edit (AC7).
 * (AC3 version, AC4 sw.js no-cache, AC7 server-rendered /profile + /bug-report verified via curl.)
 */
import { test, expect, Page } from '@playwright/test';

async function bannerHasUpdateNow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const b = document.querySelector('rb-update-banner') as any;
    const btn = b?.shadowRoot?.getElementById('update-now');
    return !!btn && (btn.textContent || '').includes('Update');
  });
}

test.describe('T94: PWA update banner', () => {
  test('AC7: rb-update-banner element present on bundle pages /app and /edit', async ({ page }) => {
    for (const url of ['/app', '/edit/README.md']) {
      await page.goto(url);
      await page.waitForTimeout(1200);
      const count = await page.locator('rb-update-banner').count();
      expect(count, `rb-update-banner on ${url}`).toBeGreaterThanOrEqual(1);
    }
  });

  // R30.14 / R31.12 #2: the banner compares the SERVER version (/api/config) with the running bundle's __BUILD_VERSION__
  // and fires only when the server is genuinely NEWER; the old localStorage 'rawbin-version' baseline is gone. The spec
  // simulates a deploy by answering /api/config with a higher version.
  // page.route cannot see requests a service worker makes, so these tests run without the SW (checkForUpdate does not need it)
  async function serveNewerVersion(page: Page): Promise<void> {
    await page.route('**/api/config', async (route) => {
      const res = await route.fetch();
      const cfg = await res.json();
      const [maj] = String(cfg.version || '0.0.0').split('.').map((n: string) => parseInt(n, 10) || 0);
      await route.fulfill({ response: res, json: { ...cfg, version: `${maj + 1}.0.0` } });
    });
  }

  test.describe('server-version poll', () => {
  test.use({ serviceWorkers: 'block' });

  test('AC1/AC6: version mismatch → update banner fires with "Update Now" (desktop Chromium)', async ({ page }) => {
    await serveNewerVersion(page);
    await page.goto('/app');
    await page.waitForTimeout(1500);                           // checkForUpdate: /api/config (bumped) vs bundle version
    expect(await bannerHasUpdateNow(page)).toBe(true);
  });

  test('AC1b: same server and bundle version → NO banner (no spurious prompt)', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(1500);
    expect(await bannerHasUpdateNow(page)).toBe(false);
  });

  test('AC2: clicking "Update Now" reloads and the banner is gone once the versions match', async ({ page }) => {
    await serveNewerVersion(page);
    await page.goto('/app');
    await page.waitForTimeout(1500);
    expect(await bannerHasUpdateNow(page)).toBe(true);

    await page.unroute('**/api/config');                      // the "deploy" is now what the bundle runs
    await Promise.all([
      page.waitForEvent('load', { timeout: 10000 }),
      page.evaluate(() => {
        const b = document.querySelector('rb-update-banner') as any;
        b?.shadowRoot?.getElementById('update-now')?.click();
      }),
    ]);
    await page.waitForTimeout(1500);
    expect(await bannerHasUpdateNow(page)).toBe(false);
  });
  });
});
