import { test, expect } from '@playwright/test';
import { ensureLobby } from './helpers.js';

test.describe('T13.3: Room Lifecycle', () => {
  test('create room, chat, leave, rejoin, delete', async ({ page }) => {
    await ensureLobby(page, 'E2E-Room-Test');

    await page.click('#create-room-btn');
    await page.waitForSelector('#create-form', { state: 'visible', timeout: 3000 });
    await page.fill('#room-name', 'E2E-Room');
    await page.click('#confirm-create-btn');
    await page.waitForSelector('.room-view', { timeout: 15000 });

    await expect(page.locator('#room-title')).toContainText('E2E-Room');
    await expect(page.locator('#member-list')).toContainText('E2E-Room-Test', { timeout: 5000 });

    const chatHandle = page.locator('#chat-handle');
    await chatHandle.click();
    await page.fill('#chat-input', 'hello e2e');
    await page.click('#chat-send');
    await expect(page.locator('#chat-messages')).toContainText('hello e2e', { timeout: 5000 });

    await page.click('#leave-btn');
    await page.waitForSelector('.lobby', { timeout: 10000 });

    const roomCard = page.locator('.room-card', { hasText: 'E2E-Room' }).first();
    const joinBtn = roomCard.locator('.btn-join');
    await expect(joinBtn).toBeVisible({ timeout: 5000 });
    await joinBtn.click();
    await page.waitForSelector('.room-view', { timeout: 10000 });
    await expect(page.locator('#room-title')).toContainText('E2E-Room');

    const deleteBtn = page.locator('#delete-room-btn');
    if (await deleteBtn.isVisible().catch(() => false)) {
      page.once('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.click('#leave-btn').catch(() => {});
  });
});
