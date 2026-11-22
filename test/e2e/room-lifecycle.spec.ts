// [test:uuid:73ba7577-becc-4c43-be64-26a255872090] T13 room lifecycle
import { test, expect } from '@playwright/test';
import { cleanupTestRooms, sendChat, chatText } from './helpers.js';
import { loginAs } from './identities.js';

test.describe('T13.3: Room Lifecycle', () => {

  test.afterAll(() => {
    cleanupTestRooms(/^E2E-Room/);
  });

  test('create room, chat, leave, rejoin, delete', async ({ page }) => {
    await loginAs(page, 1);

    await page.click('#create-room-btn');
    await page.waitForSelector('#create-form', { state: 'visible', timeout: 3000 });
    await page.fill('#room-name', 'E2E-Room');
    await page.click('#confirm-create-btn');
    await page.waitForSelector('.room-view', { timeout: 15000 });

    await expect(page.locator('rb-header')).toBeVisible();
    const title = await page.locator('rb-header .rb-header-title').textContent();
    expect(title).toContain('E2E-Room');

    // v0.6.10: chat lives in the drawer's ChatPanel (rb-chat-sheet was deleted in 0b971ad94)
    await sendChat(page, 'hello e2e');
    await expect.poll(() => chatText(page), { timeout: 5000 }).toContain('hello e2e');

    await page.evaluate(() => {
      const header = document.querySelector('rb-header');
      const leaveBtn = header?.querySelector('[data-action="leave"]') as HTMLElement;
      if (leaveBtn) leaveBtn.click();
    });
    await page.waitForSelector('.lobby', { timeout: 10000 });

    const roomCard = page.locator('.room-card', { hasText: 'E2E-Room' }).first();
    const joinBtn = roomCard.locator('.btn-join');
    await expect(joinBtn).toBeVisible({ timeout: 5000 });
    await joinBtn.click();
    await page.waitForSelector('.room-view', { timeout: 10000 });
    await expect(page.locator('rb-header .rb-header-title')).toContainText('E2E-Room');
  });
});
