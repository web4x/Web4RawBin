import { test, expect } from '@playwright/test';
import { ensureLobby } from './helpers.js';

test.describe('T13.8: Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('profile gate and room work on iPhone viewport', async ({ page }) => {
    await ensureLobby(page, 'E2E-Mobile');

    const lobby = page.locator('.lobby');
    await expect(lobby).toBeVisible();
    const lobbyBox = await lobby.boundingBox();
    expect(lobbyBox).toBeTruthy();
    if (lobbyBox) expect(lobbyBox.width).toBeLessThanOrEqual(375);

    await page.click('#create-room-btn');
    await page.waitForSelector('#create-form', { state: 'visible', timeout: 3000 });
    await page.fill('#room-name', 'Mobile-Room');
    await page.click('#confirm-create-btn');

    await page.waitForSelector('.room-view', { timeout: 15000 });
    const roomView = page.locator('.room-view');
    await expect(roomView).toBeVisible();

    const chatSheet = page.locator('.chat-sheet');
    await expect(chatSheet).toBeVisible();

    await page.locator('#chat-handle').click();
    await page.fill('#chat-input', 'mobile test');
    await page.click('#chat-send');
    await expect(page.locator('#chat-messages')).toContainText('mobile test', { timeout: 5000 });
  });
});
