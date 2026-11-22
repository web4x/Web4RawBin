// [test:uuid:e906138a-581d-4c07-8198-eedaf0e20af4] T79 room identity E2E
// [verifies:uuid:b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e] R-R1 room identity
import { test, expect } from '@playwright/test';
import { cleanupTestRooms} from './helpers';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loginAs, E2E_DATA_DIR, TESTER_1 } from './identities';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// T100: honor isolated DATA_DIR so disk assertions read the same dir the server wrote to
const DATA_DIR = E2E_DATA_DIR; // R42.3: same dir as the isolated server

function findUserRooms(token: string): string[] {
  const roomsDir = path.join(DATA_DIR, 'users', token, 'rooms');
  if (!fs.existsSync(roomsDir)) return [];
  return fs.readdirSync(roomsDir).filter(d =>
    fs.existsSync(path.join(roomsDir, d, 'room.json'))
  );
}

test.describe('T79: Room Identity E2E', () => {

  // Clean rooms this spec creates: custom names + "<User>'s Room" defaults
  test.afterAll(() => {
    cleanupTestRooms(/(RoomE2E|SshE2E|NameE2E|DeleteE2E|VisibleE2E|VisibleRoom|SyncOwner|SyncTestRoom|SyncViewer)/);
  });


  test('(1) Create room → dir exists on disk', async ({ page }) => {
    await loginAs(page, 1);
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
    expect(token).toBeTruthy();

    await page.click('#create-room-btn');
    await page.waitForTimeout(500);
    const createForm = page.locator('#create-form, .lobby-create-form');
    if (await createForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('#confirm-create-btn');
    }
    await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const rooms = findUserRooms(token!);
    expect(rooms.length).toBeGreaterThanOrEqual(1);

    const roomDir = path.join(DATA_DIR, 'users', token!, 'rooms', rooms[0]);
    expect(fs.existsSync(roomDir)).toBe(true);
  });

  test('(2) Room has .ssh/ with id_rsa', async ({ page }) => {
    await loginAs(page, 1);
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));

    await page.click('#create-room-btn');
    await page.waitForTimeout(500);
    const createForm = page.locator('#create-form, .lobby-create-form');
    if (await createForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('#confirm-create-btn');
    }
    await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const rooms = findUserRooms(token!);
    expect(rooms.length).toBeGreaterThanOrEqual(1);

    const sshDir = path.join(DATA_DIR, 'users', token!, 'rooms', rooms[0], '.ssh');
    expect(fs.existsSync(sshDir)).toBe(true);
    expect(fs.existsSync(path.join(sshDir, 'id_rsa'))).toBe(true);
    expect(fs.existsSync(path.join(sshDir, 'id_rsa.pub'))).toBe(true);

    const privKey = fs.readFileSync(path.join(sshDir, 'id_rsa'), 'utf-8');
    expect(privKey).toContain('-----BEGIN PRIVATE KEY-----');
  });

  test('(3) Default name includes profile name', async ({ page }) => {
    await loginAs(page, 1);
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
    const before = new Set(findUserRooms(token!));

    await page.click('#create-room-btn');
    await page.waitForTimeout(500);
    const createForm = page.locator('#create-form, .lobby-create-form');
    if (await createForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('#confirm-create-btn');
    }
    await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // R42.3: the tester owns many rooms — read the room this test just created, not rooms[0]
    const created = findUserRooms(token!).filter((id) => !before.has(id));
    expect(created.length).toBe(1);
    const roomId = created[0];
    const raw = JSON.parse(fs.readFileSync(
      path.join(DATA_DIR, 'users', token!, 'rooms', roomId, 'room.json'), 'utf-8'
    ));
    const meta = raw.model || raw; // room.json is a scenario unit ({ ior, model })
    expect(meta.name).toContain(TESTER_1.name);
    expect(meta.name).toContain('Room');
  });

  test('(5) Owner can delete room — dir removed', async ({ page }) => {
    await loginAs(page, 1);
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
    const before = new Set(findUserRooms(token!));

    await page.click('#create-room-btn');
    await page.waitForTimeout(500);
    const createForm = page.locator('#create-form, .lobby-create-form');
    if (await createForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.click('#confirm-create-btn');
    }
    await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const roomsBefore = findUserRooms(token!);
    expect(roomsBefore.length).toBeGreaterThanOrEqual(1);
    // R42.3: the tester owns many rooms — delete the one this test just created, not the last dir listed
    const created = roomsBefore.filter((id) => !before.has(id));
    expect(created.length).toBe(1);
    const roomId = created[0];

    // Delete via leave then delete, or find delete button
    const deleteBtn = page.locator('[data-action="delete"], .btn-delete, button:has-text("Delete")');
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.once('dialog', dialog => dialog.accept());
      await deleteBtn.click();
      await page.waitForTimeout(3000);
    } else {
      // Leave room first, then delete from lobby
      const leaveBtn = page.locator('[data-action="leave"], .btn-leave, button:has-text("Leave")');
      if (await leaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await leaveBtn.click();
        await page.waitForTimeout(2000);
      }
      // Find delete button in lobby room list
      const lobbyDelete = page.locator(`.btn-delete[data-room="${roomId}"]`); // R42.3: exactly this room, never the first card
      if (await lobbyDelete.isVisible({ timeout: 3000 }).catch(() => false)) {
        page.once('dialog', dialog => dialog.accept());
        await lobbyDelete.click();
        await page.waitForTimeout(3000);
      }
    }

    const roomDir = path.join(DATA_DIR, 'users', token!, 'rooms', roomId);
    expect(fs.existsSync(roomDir)).toBe(false);
  });

  test('(7) Room visible when owner connected', async ({ page }) => {
    await loginAs(page, 1);

    await page.click('#create-room-btn');
    await page.waitForTimeout(500);
    const createForm = page.locator('#create-form, .lobby-create-form');
    if (await createForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      const nameInput = page.locator('#room-name');
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameInput.fill('VisibleRoom');
      }
      await page.click('#confirm-create-btn');
    }
    await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Leave room to go back to lobby
    const leaveBtn = page.locator('[data-action="leave"], .btn-leave, button:has-text("Leave")');
    if (await leaveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await leaveBtn.click();
      await page.waitForTimeout(2000);
    }

    // Room should be in lobby list
    await page.waitForSelector('.lobby', { timeout: 10000 });
    const lobbyText = await page.locator('.lobby').textContent();
    expect(lobbyText).toContain('VisibleRoom');
  });

  test('(8) Room list syncs to second browser context', async ({ browser }) => {
    // First context — owner creates room
    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page1 = await ctx1.newPage();
    await loginAs(page1, 1);

    await page1.click('#create-room-btn');
    await page1.waitForTimeout(500);
    const cf = page1.locator('#create-form, .lobby-create-form');
    if (await cf.isVisible({ timeout: 2000 }).catch(() => false)) {
      const ni = page1.locator('#room-name');
      if (await ni.isVisible({ timeout: 1000 }).catch(() => false)) {
        await ni.fill('SyncTestRoom');
      }
      await page1.click('#confirm-create-btn');
    }
    await page1.waitForSelector('.room-view, rb-header', { timeout: 15000 });
    await page1.waitForTimeout(2000);

    // Second context — different user sees the room
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await ctx2.newPage();
    await loginAs(page2, 2);
    await page2.waitForTimeout(2000);

    const lobbyText = await page2.locator('.lobby').textContent();
    expect(lobbyText).toContain('SyncTestRoom');

    await ctx1.close();
    await ctx2.close();
  });
});
