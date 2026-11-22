// Returning user on a fresh browser: drop a vCard of an existing user → masked secret field with
// show/hide toggle → correct code lands in the lobby as that user; wrong code keeps an error on the sheet.
import { test, expect, Browser, Page } from '@playwright/test';

const vcard = (name: string, phone: string) => `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEND:VCARD\n`;

async function openGate(page: Page): Promise<void> {
  await page.goto('/app');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500); // the app may reload once on first load (service worker activation)
  await page.waitForSelector('#pe-name', { timeout: 15000 });
}

async function createExistingUser(browser: Browser, name: string, phone: string): Promise<{ token: string; code: string }> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await openGate(page);
  const code = await page.locator('#pe-code').inputValue();
  expect(code).toMatch(/^\d{4}$/);
  await page.fill('#pe-name', name);
  await page.fill('#pe-phone', phone);
  await page.click('#pe-save');
  await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 });
  const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id') || '');
  await ctx.close();
  return { token, code };
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
    const name = 'E2E-Unlock';
    const phone = `+49 170 ${Math.floor(1000000 + Math.random() * 8999999)}`;
    const existing = await createExistingUser(browser, name, phone);

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
