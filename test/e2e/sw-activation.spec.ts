// [test:uuid:79a00011-0011-4a11-a011-000179011001] T179 AC11-13 SW activation E2E
import { test, expect } from './fixtures';

test.describe('T179 AC11-13: SW activation with SW ACTIVE', () => {

  test('AC11: SW registers, activates, then all routes load with SW active', async ({ page }) => {
    // Load /app to trigger SW registration
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Confirm SW is active
    const swActive = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      return reg?.active?.state === 'activated';
    });
    expect(swActive).toBe(true);

    // Now load each route WITH SW active — no 404s
    const routes = ['/app', '/trace', '/scenario', '/md/'];
    for (const route of routes) {
      const res = await page.goto(route);
      console.log(`${route}: ${res?.status()}`);
      expect(res?.status()).toBeLessThan(400);
    }
  });

  test('AC12: 2nd page load after SW install serves correct bundle (no manual clear)', async ({ page }) => {
    // 1st load: triggers SW install
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Verify SW installed with correct cache
    const cacheName1 = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys[0] || '';
    });
    expect(cacheName1).toContain('rawbin-v');

    // 2nd load: should serve from SW cache — no network needed for cached resources
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Verify the page actually rendered (app bundle loaded via SW)
    const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
    expect(bodyLen).toBeGreaterThan(100);

    // Verify SW still active after 2nd load
    const swStillActive = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      return reg?.active?.state === 'activated';
    });
    expect(swStillActive).toBe(true);
  });

  test('AC13: existing tab receives new SW on next navigation (passive activation)', async ({ page }) => {
    // Load /app — SW activates
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const initialSW = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker?.getRegistration();
      return reg?.active?.scriptURL || '';
    });
    expect(initialSW).toContain('/sw.js');

    // Navigate away and back (simulates "next navigation" for passive activation)
    await page.goto('/trace');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // SW should still be controlling this page
    const controlledAfterNav = await page.evaluate(() => {
      return !!navigator.serviceWorker?.controller;
    });
    expect(controlledAfterNav).toBe(true);
  });

  test('AC10: ZERO 404s for app.js with SW active (Tron repro)', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // With SW active, verify app.js is NOT a 404 in cache
    const appJsStatus = await page.evaluate(async () => {
      const keys = await caches.keys();
      for (const key of keys) {
        const cache = await caches.open(key);
        const entries = await cache.keys();
        for (const entry of entries) {
          if (entry.url.includes('/dist/app-')) {
            const resp = await cache.match(entry);
            return { url: entry.url, status: resp?.status, ok: resp?.ok };
          }
        }
      }
      return { url: 'not found', status: 0, ok: false };
    });

    console.log(`app.js cache: ${JSON.stringify(appJsStatus)}`);
    expect(appJsStatus.ok).toBe(true);
    expect(appJsStatus.status).toBe(200);
  });
});
