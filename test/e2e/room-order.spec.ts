import { test, expect, Page } from '@playwright/test';
import { ensureLobby, cleanupTestRooms } from './helpers';

async function createRoom(page: Page, name: string): Promise<void> {
  await page.click('#create-room-btn');
  await page.waitForTimeout(400);
  const createForm = page.locator('#create-form, .lobby-create-form');
  if (await createForm.isVisible({ timeout: 2000 }).catch(() => false)) {
    const nameInput = page.locator('#room-name');
    if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nameInput.fill(name);
    }
    await page.click('#confirm-create-btn');
  }
  await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
  await page.waitForTimeout(800);

  // Leave back to lobby so we can create the next one and read the list
  const leaveBtn = page.locator('[data-action="leave"], .btn-leave, button:has-text("Leave")');
  if (await leaveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leaveBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.waitForSelector('.lobby', { timeout: 10000 });
}

test.describe('T95: Lobby newest-first ordering', () => {

  // Clean up the Alpha/Bravo/Charlie-T95-* rooms this spec creates (no prod flood)
  test.afterAll(() => {
    const n = cleanupTestRooms(/^(Alpha|Bravo|Charlie)-T95-/);
    console.log(`[room-order cleanup] removed ${n} test rooms`);
  });

  test('TS1: Alpha, Bravo, Charlie → list shows Charlie, Bravo, Alpha', async ({ page }) => {
    await ensureLobby(page, 'OrderUser');

    // Unique suffix so this run's rooms are identifiable amid existing rooms
    const tag = `T95-${Date.now().toString().slice(-6)}`;
    const alpha = `Alpha-${tag}`;
    const bravo = `Bravo-${tag}`;
    const charlie = `Charlie-${tag}`;

    await createRoom(page, alpha);
    await createRoom(page, bravo);
    await createRoom(page, charlie);

    await page.waitForTimeout(1000);

    // Read rendered room-card order, filtered to THIS run's rooms (by unique tag)
    const order = await page.evaluate((t) => {
      const list = document.querySelector('#room-list');
      if (!list) return [];
      const cards = Array.from(list.querySelectorAll('.room-card'));
      const names: string[] = [];
      for (const c of cards) {
        const nameEl = c.querySelector('.room-name');
        const text = nameEl?.textContent || '';
        if (!text.includes(t)) continue;
        const m = text.match(/(Alpha|Bravo|Charlie)/);
        if (m) names.push(m[1]);
      }
      return names;
    }, tag);

    expect(order).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });
});
