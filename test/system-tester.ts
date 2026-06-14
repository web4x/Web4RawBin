/**
 * Shared SystemTester identity — the ONE connection path for all verification.
 * Reuses the fixed SystemTester profile (never creates new users).
 *
 * Usage:
 *   import { ensureSystemTester, SYSTEM_TESTER } from './system-tester';
 *   const page = await ensureSystemTester(browser);
 */
import type { Browser, Page } from '@playwright/test';

export const SYSTEM_TESTER = {
  token: 'ce981242-74fe-4d44-b5b6-43c641e224df',
  name: 'SystemTester',
};

export const VERIFY_BASE_URL = process.env.E2E_LIVE === '1'
  ? 'https://localhost:4444'
  : 'https://localhost:4445';

/**
 * Connect as SystemTester — reuses the fixed identity, never creates a new user.
 * Sets localStorage with the known token before navigating.
 */
export async function ensureSystemTester(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(`${VERIFY_BASE_URL}/app`);
  await page.evaluate((token) => {
    localStorage.setItem('rawbin-player-id', token);
  }, SYSTEM_TESTER.token);
  await page.goto(`${VERIFY_BASE_URL}/app`);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const nameField = page.locator('#pe-name');
  if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.fill('#pe-name', SYSTEM_TESTER.name);
    await page.click('#pe-save');
    await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  await page.waitForSelector('.lobby', { timeout: 15000 });
  return page;
}
