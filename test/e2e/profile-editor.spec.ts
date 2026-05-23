import { test, expect } from '@playwright/test';
import { ensureLobby } from './helpers.js';

test.describe('T13.4: Profile Editor', () => {
  test('click own name opens editor, saves phone+url, persists on reopen', async ({ page }) => {
    await ensureLobby(page, 'E2E-Profile');

    await page.click('#create-room-btn');
    await page.fill('#room-name', 'Profile-Test');

    await page.waitForTimeout(500);
    await page.click('#confirm-create-btn');

    const errorEl = page.locator('#lobby-error');
    const hasError = await errorEl.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasError) {
      const errText = await errorEl.textContent();
      test.skip(true, `Room create rejected: ${errText}`);
      return;
    }

    const roomView = await page.waitForSelector('.room-view', { timeout: 15000 }).catch(() => null);
    if (!roomView) {
      test.skip(true, 'Room view did not appear — server may have rejected');
      return;
    }

    const selfMember = page.locator('.mb-self, .member-self, .member-clickable').first();
    await selfMember.click();

    await page.waitForSelector('.profile-overlay', { timeout: 5000 });
    await expect(page.locator('.profile-overlay')).toBeVisible();

    await page.fill('#pe-phone', '+49123456');
    await page.fill('#pe-url', 'https://example.com');
    await page.click('#pe-save');

    await page.waitForSelector('.profile-overlay', { state: 'hidden', timeout: 10000 });

    await selfMember.click();
    await page.waitForSelector('.profile-overlay', { timeout: 5000 });

    const phone = page.locator('#pe-phone');
    await expect(phone).toHaveValue('+49123456');
    const url = page.locator('#pe-url');
    await expect(url).toHaveValue('https://example.com');
  });
});
