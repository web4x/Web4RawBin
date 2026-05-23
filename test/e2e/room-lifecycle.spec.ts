import { test, expect } from '@playwright/test';
import { ensureLobby } from './helpers.js';

test.describe('T13.3: Room Lifecycle', () => {
  test('create room, chat, leave, rejoin, delete', async ({ page }) => {
    await ensureLobby(page, 'E2E-Room-Test');

    await page.click('#create-room-btn');
    await page.fill('#room-name', 'E2E-Room');
    await page.click('#confirm-create-btn');
    await page.waitForSelector('.room-view', { timeout: 10000 });

    const title = page.locator('#room-title');
    await expect(title).toContainText('E2E-Room');

    const memberList = page.locator('#member-list');
    await expect(memberList).toContainText('E2E-Room-Test');

    const chatHandle = page.locator('#chat-handle');
    await chatHandle.click();
    await page.fill('#chat-input', 'hello e2e');
    await page.click('#chat-send');

    const chatMessages = page.locator('#chat-messages');
    await expect(chatMessages).toContainText('hello e2e', { timeout: 5000 });

    await page.click('#leave-btn');
    await page.waitForSelector('.lobby', { timeout: 10000 });

    const roomCard = page.locator('.room-card').first();
    await expect(roomCard).toBeVisible({ timeout: 5000 });

    const joinBtn = page.locator('.btn-join').first();
    await joinBtn.click();
    await page.waitForSelector('.room-view', { timeout: 10000 });

    await chatHandle.click();
    await expect(chatMessages).toContainText('hello e2e', { timeout: 5000 });

    const deleteBtn = page.locator('#delete-room-btn');
    if (await deleteBtn.isVisible()) {
      page.once('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await page.waitForSelector('.lobby', { timeout: 10000 });
    }
  });
});
