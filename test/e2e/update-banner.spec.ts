/**
 * T94 (v0.5.4): PWA version update banner fires again.
 * [test:uuid:916b8bb0-08ef-4287-98f0-031ddf004723] T94 PWA update banner
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

  test('AC1/AC6: version mismatch → update banner fires with "Update Now" (desktop Chromium)', async ({ page }) => {
    await page.goto('/app');                                   // first visit caches live version (no banner)
    await page.waitForTimeout(1000);
    await page.evaluate(() => localStorage.setItem('rawbin-version', '0.0.1')); // simulate an older device
    await page.reload();
    await page.waitForTimeout(1500);                           // checkForUpdate: /api/config (0.5.4) vs 0.0.1

    expect(await bannerHasUpdateNow(page)).toBe(true);
  });

  test('AC2: clicking "Update Now" stores the new version and dismisses the banner', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(1000);
    await page.evaluate(() => localStorage.setItem('rawbin-version', '0.0.1'));
    await page.reload();
    await page.waitForTimeout(1500);
    expect(await bannerHasUpdateNow(page)).toBe(true);

    const liveVersion = await page.evaluate(async () => (await (await fetch('/api/config')).json()).version);
    await page.evaluate(() => {
      const b = document.querySelector('rb-update-banner') as any;
      b?.shadowRoot?.getElementById('update-now')?.click();
    });
    await page.waitForTimeout(1500); // handler stores the new version, then reloads (no waiting SW → location.reload)

    // after the reload, cached version == live version → no mismatch → banner gone
    const cached = await page.evaluate(() => localStorage.getItem('rawbin-version'));
    expect(cached).toBe(liveVersion);
    expect(await bannerHasUpdateNow(page)).toBe(false);
  });
});
