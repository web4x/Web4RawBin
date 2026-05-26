/**
 * T78 (v0.4.8): Lobby room cards show full UUID, a "💾 Persistent" badge, and owner attribution.
 * Verifies the rendered DOM (RoomBrowser.ts:122-134) on a card the viewer owns.
 */
import { test, expect, Page } from '@playwright/test';
import { ensureLobby } from './helpers';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// T100: honor isolated DATA_DIR so disk assertions read the same dir the server wrote to
const DATA_DIR = process.env.E2E_DATA_DIR || path.resolve(__dirname, '../../data');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function diskRoomIds(token: string): string[] {
  const d = path.join(DATA_DIR, 'users', token, 'rooms');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(r => fs.existsSync(path.join(d, r, 'room.json')));
}

async function createRoomAndReturn(page: Page, name: string): Promise<void> {
  await page.click('#create-room-btn');
  await page.waitForTimeout(500);
  const nameInput = page.locator('#room-name');
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) await nameInput.fill(name);
  await page.click('#confirm-create-btn');
  await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
  await page.waitForTimeout(1500);
  const leave = page.locator('[data-action="leave"], .btn-leave, button:has-text("Leave")').first();
  if (await leave.isVisible({ timeout: 3000 }).catch(() => false)) await leave.click();
  await page.waitForSelector('.lobby', { timeout: 10000 });
  await page.waitForTimeout(1000);
}

test.describe('T78: lobby room card badges', () => {
  test('own room card: full UUID + 💾 Persistent badge + "you" owner attribution', async ({ page }) => {
    await ensureLobby(page, 'BadgeOwner');
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
    await createRoomAndReturn(page, `T78-${Date.now().toString(36)}`);

    const ids = diskRoomIds(token!);
    expect(ids.length).toBeGreaterThanOrEqual(1);
    const roomId = ids[ids.length - 1];

    const card = page.locator(`.room-card[data-room-id="${roomId}"]`).first();
    await expect(card).toBeVisible();

    // (c) persistence badge
    const persist = card.locator('.room-persist');
    await expect(persist).toBeVisible();
    expect((await persist.textContent())?.toLowerCase()).toContain('persistent');

    // (b) full UUID (36 chars, not sliced)
    const idText = (await card.locator('.room-id').textContent())?.trim() || '';
    expect(idText).toBe(roomId);
    expect(idText).toMatch(UUID_RE);
    expect(idText.length).toBe(36);

    // owner attribution — viewer owns this room → "you" badge
    await expect(card.locator('.owner-badge')).toBeVisible();
    expect((await card.locator('.owner-badge').textContent())?.toLowerCase()).toContain('you');
  });
});
