/**
 * R42.5 no-token-only-login (Tron 2026-11-23: "no users automatically log in with a token only" — "with a key only").
 * A browser that holds SystemTester's token but no device key must NOT land in SystemTester's lobby: it is asked for
 * the secret code, and only that code (which enrolls this device) logs it in.
 */
import { test, expect } from './fixtures';
import { identity } from './identities';

// [test:uuid:348cc607-d3b8-4d97-a81c-c1d9043dbc79] R42.5 LoginGate.identifyGate: a bare token is refused, the secret code enrolls and logs in
test.describe('LoginGate.identifyGate — a token alone does not log in (R42.5)', () => {
  test('token without a device key: secret-code prompt, no profile, then the code logs in', async ({ page }) => {
    const me = identity(1);
    const seen: string[] = [];
    page.on('websocket', (ws) => ws.on('framereceived', (f) => { try { seen.push(JSON.parse(String(f.payload)).type); } catch {} }));
    await page.addInitScript((token) => {
      if (sessionStorage.getItem('__e2e_seeded')) return;
      localStorage.clear();
      localStorage.setItem('rawbin-player-id', token);
      sessionStorage.setItem('__e2e_seeded', '1');
    }, me.token);
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500); // the app may reload once on first load (service worker activation)
    await page.waitForSelector('#de-code', { timeout: 15000 });
    expect(await page.locator('.lobby').count()).toBe(0);
    expect(seen).toContain('AUTH_REQUIRED');
    expect(seen).not.toContain('PROFILE'); // nothing about the account (name, secret code) before the key is proven

    await page.fill('#de-code', me.code);
    await page.click('#de-submit');
    await page.waitForSelector('.lobby', { timeout: 15000 });
    expect(seen).toContain('PROFILE');
    expect(await page.evaluate(() => !!localStorage.getItem('rawbin-device-privateKey'))).toBe(true);
  });
});
