// [test:uuid:76a00001-0001-4a01-a001-000176010001] T176+T180 module exec + SW registration proof
import { test, expect } from './fixtures';

test.describe('T176+T180: ES module + SW registration over self-signed SSL', () => {
  test('scenario page ES module executes (CDP secure context)', async ({ page }) => {
    await page.goto('/scenario');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const moduleScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="module"]');
      return scripts.length;
    });
    const bodyLen = await page.evaluate(() => document.body.innerText.length);

    console.log(`Module scripts: ${moduleScripts}, body length: ${bodyLen}`);
    expect(moduleScripts).toBeGreaterThan(0);
    expect(bodyLen).toBeGreaterThan(50);
  });

  test('/trace page ES module loads tree component', async ({ page }) => {
    await page.goto('/trace');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const hasTree = await page.evaluate(() => !!document.querySelector('rb-trace-tree'));
    expect(hasTree).toBe(true);
  });

  test('T180: service worker registers in CDP secure context', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'no-sw-support';
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) return `registered:${reg.active?.state || reg.installing?.state || reg.waiting?.state || 'unknown'}`;
        return 'no-registration';
      } catch (e) {
        return `error:${(e as Error).message}`;
      }
    });

    console.log(`SW state: ${swState}`);
    expect(swState).toMatch(/^registered:/);
  });

  test('T179 AC11: SW caches STATIC_SHELL entries', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const cacheInfo = await page.evaluate(async () => {
      const keys = await caches.keys();
      if (keys.length === 0) return { caches: 0, entries: 0 };
      const cache = await caches.open(keys[0]);
      const entries = await cache.keys();
      return { caches: keys.length, entries: entries.length, name: keys[0] };
    });

    console.log(`Caches: ${cacheInfo.caches}, entries: ${cacheInfo.entries}, name: ${(cacheInfo as any).name || '?'}`);
    expect(cacheInfo.entries).toBeGreaterThan(5);
  });
});
