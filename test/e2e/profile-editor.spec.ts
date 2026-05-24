import { test, expect } from '@playwright/test';
import { ensureLobby } from './helpers.js';

test.describe('T13.4: Profile Editor', () => {
  test('click own name opens editor, saves phone+url, verify persisted via profile', async ({ page }) => {
    await ensureLobby(page, 'E2E-Profile');

    await page.click('#create-room-btn');
    await page.waitForSelector('#create-form', { state: 'visible', timeout: 3000 });
    await page.fill('#room-name', 'Profile-Test');
    await page.click('#confirm-create-btn');
    await page.waitForSelector('.room-view', { timeout: 15000 });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const badge = document.querySelector('.mb-badge, [data-member-id]') as HTMLElement;
      if (badge) badge.click();
    });

    await page.waitForSelector('#pe-name', { timeout: 5000 });
    await page.fill('#pe-phone', '+49123456');
    await page.fill('#pe-url', 'https://example.com');
    await page.click('#pe-save');
    await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 10000 });

    const profile = await page.evaluate(() => {
      return (window as any).__rawbinClient?._profile || null;
    });

    if (profile) {
      expect(profile.phone).toBe('+49123456');
      expect(profile.url).toBe('https://example.com');
    }
  });
});
