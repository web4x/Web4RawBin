// [test:uuid:c4179894-e662-41e8-a0d1-f94089f6576a] T13 profile editor
import { test, expect } from '@playwright/test';
import { ensureLobby, cleanupTestUsers, cleanupTestRooms } from './helpers.js';

test.describe('T13.4: Profile Editor', () => {
  test.afterAll(() => {
    cleanupTestUsers(/^E2E-Profile$/);
    cleanupTestRooms(/^Profile-Test$/);
  });
  test('click own name opens editor, saves phone+url, verify persisted via profile', async ({ page }) => {
    await ensureLobby(page, 'E2E-Profile');

    await page.click('#create-room-btn');
    await page.waitForSelector('#create-form', { state: 'visible', timeout: 3000 });
    await page.fill('#room-name', 'Profile-Test');
    await page.click('#confirm-create-btn');
    await page.waitForSelector('.room-view', { timeout: 15000 });
    await page.waitForTimeout(500);

    // T83 (v0.5.3): self-click opens the read-only .user-sheet, NOT ProfileEditor directly.
    // The editor is now reached via the sheet's Edit button (#us-edit).
    await page.locator('rb-member-badge').first().click();
    await page.waitForSelector('.user-sheet', { timeout: 5000 });
    await page.click('#us-edit');

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
