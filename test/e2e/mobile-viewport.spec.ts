// [test:uuid:71396672-5795-47a9-8074-b314ecfe092d] T13 mobile viewport
import { test, expect } from '@playwright/test';
import { sendChat, chatText } from './helpers.js';
import { loginAs } from './identities.js';

test.describe('T13.8: Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('profile gate and room work on iPhone viewport', async ({ page }) => {
    await loginAs(page, 1);

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
    await expect(page.locator('.room-view')).toBeVisible();
    // v0.6.10: chat lives in the drawer's ChatPanel (rb-chat-sheet was deleted in 0b971ad94)
    await sendChat(page, 'mobile test');
    await expect.poll(() => chatText(page), { timeout: 5000 }).toContain('mobile test');
  });
});
