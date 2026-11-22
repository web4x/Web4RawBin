// Returning user on a fresh browser: drop a vCard of an existing user → masked secret field with
// show/hide toggle → correct code lands in the lobby as that user; wrong code keeps an error on the sheet.
import { test, expect, Page } from '@playwright/test';
import { identity, TESTER_2 } from './identities.js';

const vcard = (name: string, phone: string) => `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEND:VCARD\n`;

async function openGate(page: Page): Promise<void> {
  await page.goto('/app');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500); // the app may reload once on first load (service worker activation)
  await page.waitForSelector('#pe-name', { timeout: 15000 });
}

async function dropVCard(page: Page, text: string): Promise<void> {
  await page.evaluate((txt) => {
    const dt = new DataTransfer();
    dt.items.add(new File([txt], 'me.vcf', { type: 'text/vcard' }));
    document.querySelector('.profile-overlay')!.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, text);
}

test.describe('Returning user unlock via vCard drop', () => {
  test('secret is masked with a toggle, wrong code errors, correct code lands in the lobby', async ({ browser }) => {
    test.setTimeout(60000);
    // R42.3: the "existing user" is the fixed SystemTester2 (signed up once by globalSetup), never a fresh random user
    const { name, phone } = TESTER_2;
    const existing = identity(2);
    expect(existing.code).toMatch(/^\d{4}$/);

    const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await openGate(page);
    await dropVCard(page, vcard(name, phone));
    await expect(page.locator('#pe-unlock-banner')).toBeVisible({ timeout: 10000 });

    // Bug 1: masked by default, toggle reveals and hides, no pre-filled foreign code
    const code = page.locator('#pe-code');
    await expect(code).toHaveAttribute('type', 'password');
    await expect(code).toHaveValue('');
    await page.click('#pe-code-toggle');
    await expect(code).toHaveAttribute('type', 'text');
    await expect(page.locator('#pe-code-toggle')).toHaveAttribute('aria-pressed', 'true');
    await page.click('#pe-code-toggle');
    await expect(code).toHaveAttribute('type', 'password');

    // Wrong code → error stays on the sheet
    const wrong = existing.code === '0000' ? '1111' : '0000';
    await page.fill('#pe-code', wrong);
    await page.click('#pe-save');
    await expect(page.locator('#pe-unlock-err')).toContainText(/wrong/i, { timeout: 10000 });
    await expect(page.locator('#pe-unlock-banner')).toBeVisible();

    // Bug 2: correct code → reload → lobby as the existing user (not an empty page)
    await page.fill('#pe-code', existing.code);
    await page.click('#pe-save');
    await page.waitForSelector('.lobby', { timeout: 20000 });
    await expect(page.locator('.profile-overlay')).toHaveCount(0);
    await expect(page.locator('#de-code')).toHaveCount(0);
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
    expect(token).toBe(existing.token);
    expect(await page.evaluate(() => !!localStorage.getItem('rawbin-device-privateKey'))).toBe(true);
    await ctx.close();
  });

});
