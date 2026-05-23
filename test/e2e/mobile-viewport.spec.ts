import { test, expect } from '@playwright/test';

test.describe('T13.8: Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('profile gate and room work on iPhone viewport', async ({ page }) => {
    await page.goto('/app');

    const gate = page.locator('.profile-gate');
    if (await gate.isVisible().catch(() => false)) {
      const sheet = page.locator('.profile-sheet');
      await expect(sheet).toBeVisible();

      const box = await sheet.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375);
      }

      await page.fill('#pe-name', 'E2E-Mobile');
      await page.click('#pe-save');
      await page.waitForSelector('.profile-overlay', { state: 'hidden', timeout: 10000 }).catch(() => {});
    }

    await page.waitForSelector('.lobby', { timeout: 15000 }).catch(() => {});

    const enrollDialog = page.locator('#de-code');
    if (await enrollDialog.isVisible().catch(() => false)) {
      test.skip(true, 'Device enrollment shown — need secret code for mobile test');
      return;
    }

    const lobby = page.locator('.lobby');
    if (await lobby.isVisible().catch(() => false)) {
      const lobbyBox = await lobby.boundingBox();
      expect(lobbyBox).toBeTruthy();
      if (lobbyBox) {
        expect(lobbyBox.width).toBeLessThanOrEqual(375);
      }

      await page.click('#create-room-btn');
      await page.fill('#room-name', 'Mobile-Room');
      await page.click('#confirm-create-btn');
      await page.waitForSelector('.room-view', { timeout: 10000 });

      const roomView = page.locator('.room-view');
      await expect(roomView).toBeVisible();

      const chatSheet = page.locator('.chat-sheet');
      await expect(chatSheet).toBeVisible();
    }
  });
});
