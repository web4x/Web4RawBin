// [test:uuid:71396672-5795-47a9-8074-b314ecfe092d] T13 mobile viewport
import { test, expect } from '@playwright/test';
import { ensureLobby, cleanupTestUsers } from './helpers.js';

test.describe('T13.8: Mobile Viewport', () => {
  test.afterAll(() => { cleanupTestUsers(/^E2E-Mobile$/); });
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
    await expect(page.locator('.room-view')).toBeVisible();
    await expect(page.locator('rb-chat-sheet')).toBeVisible({ timeout: 3000 });

    await page.evaluate(() => {
      const sheet = document.querySelector('rb-chat-sheet') as any;
      const handle = sheet?.shadowRoot?.getElementById('handle');
      if (handle) handle.click();
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const sheet = document.querySelector('rb-chat-sheet') as any;
      const input = sheet?.shadowRoot?.getElementById('input') as HTMLInputElement;
      if (input) { input.value = 'mobile test'; input.dispatchEvent(new Event('input')); }
      sheet?.shadowRoot?.getElementById('send-btn')?.click();
    });
    await page.waitForTimeout(1000);
    const chatText = await page.evaluate(() => {
      const sheet = document.querySelector('rb-chat-sheet') as any;
      return sheet?.shadowRoot?.getElementById('messages')?.textContent || '';
    });
    expect(chatText).toContain('mobile test');
  });
});
