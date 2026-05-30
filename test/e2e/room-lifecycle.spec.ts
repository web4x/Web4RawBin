// [test:uuid:73ba7577-becc-4c43-be64-26a255872090] T13 room lifecycle
import { test, expect } from '@playwright/test';
import { ensureLobby, cleanupTestRooms, cleanupTestUsers } from './helpers.js';

test.describe('T13.3: Room Lifecycle', () => {

  test.afterAll(() => {
    cleanupTestUsers(/^E2E-Room-Test$/);
    cleanupTestRooms(/^E2E-Room/);
  });

  test('create room, chat, leave, rejoin, delete', async ({ page }) => {
    await ensureLobby(page, 'E2E-Room-Test');

    await page.click('#create-room-btn');
    await page.waitForSelector('#create-form', { state: 'visible', timeout: 3000 });
    await page.fill('#room-name', 'E2E-Room');
    await page.click('#confirm-create-btn');
    await page.waitForSelector('.room-view', { timeout: 15000 });

    await expect(page.locator('rb-header')).toBeVisible();
    const title = await page.locator('rb-header .rb-header-title').textContent();
    expect(title).toContain('E2E-Room');

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
      if (input) { input.value = 'hello e2e'; input.dispatchEvent(new Event('input')); }
      const btn = sheet?.shadowRoot?.getElementById('send-btn');
      if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    const chatText = await page.evaluate(() => {
      const sheet = document.querySelector('rb-chat-sheet') as any;
      return sheet?.shadowRoot?.getElementById('messages')?.textContent || '';
    });
    expect(chatText).toContain('hello e2e');

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
