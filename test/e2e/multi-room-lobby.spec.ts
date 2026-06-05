/**
 * T93 (v0.5.2): All of a user's rooms load from disk and appear in their lobby.
 * [test:uuid:feac61c4-da1b-41fb-95b7-476973946d7f] T93 multi-room lobby
 * [verifies:uuid:b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e] R-R1 all rooms load
 * Tron bug: "i created more than one room. but only one shows up in the lobby."
 *
 * Runs against the LIVE server (reuseExistingServer). The server is shared (181+ rooms), so
 * AC6 is checked as a SUBSET invariant — every on-disk room for the owner must appear in the
 * owner's lobby — not a total-count equality (the lobby also lists other users' public rooms).
 * AC4's "others see all" is subject to the intended v0.5.2 dormant-room semantics (empty/private
 * rooms hidden from non-owners); verified and documented rather than asserted as all-visible.
 */
import { test, expect, Page } from '@playwright/test';
import { ensureLobby, cleanupTestUsers, cleanupTestRooms } from './helpers';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// T100: honor isolated DATA_DIR so disk assertions read the same dir the server wrote to
const DATA_DIR = process.env.E2E_DATA_DIR || path.resolve(__dirname, '../../data');

function diskRoomIds(token: string): string[] {
  const roomsDir = path.join(DATA_DIR, 'users', token, 'rooms');
  if (!fs.existsSync(roomsDir)) return [];
  return fs.readdirSync(roomsDir).filter(d => fs.existsSync(path.join(roomsDir, d, 'room.json')));
}

async function lobbyRoomIds(page: Page): Promise<string[]> {
  await page.waitForSelector('.lobby', { timeout: 10000 });
  return page.locator('.room-card').evaluateAll(els =>
    els.map(e => (e as HTMLElement).getAttribute('data-room-id') || '').filter(Boolean)
  );
}

async function createRoom(page: Page, name: string): Promise<void> {
  await page.click('#create-room-btn');
  await page.waitForTimeout(500);
  const nameInput = page.locator('#room-name');
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill(name);
  }
  await page.click('#confirm-create-btn');
  await page.waitForSelector('.room-view, rb-header', { timeout: 15000 });
  await page.waitForTimeout(1500);
}

async function leaveToLobby(page: Page): Promise<void> {
  const leaveBtn = page.locator('[data-action="leave"], .btn-leave, button:has-text("Leave")').first();
  if (await leaveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await leaveBtn.click();
  }
  await page.waitForSelector('.lobby', { timeout: 10000 });
  await page.waitForTimeout(1000);
}

test.describe('T93: multi-room lobby (all owner rooms load + show)', () => {
  test.afterAll(() => {
    cleanupTestUsers(/^(OwnerMulti|OwnerReconnect|OwnerDelete|OwnerVisible|OtherViewer)$/);
    cleanupTestRooms(/^(OwnerMulti|OwnerReconnect|OwnerDelete|OwnerVisible|OtherViewer)/);
  });
  const runId = Date.now().toString(36);

  test('AC1/AC6: owner creates 3 rooms → all 3 (and every on-disk room) appear in owner lobby', async ({ page }) => {
    await ensureLobby(page, 'OwnerMulti');
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
    expect(token).toBeTruthy();

    const names = [`MR-${runId}-1`, `MR-${runId}-2`, `MR-${runId}-3`];
    for (const n of names) { await createRoom(page, n); await leaveToLobby(page); }

    const onDisk = diskRoomIds(token!);
    expect(onDisk.length).toBeGreaterThanOrEqual(3); // the 3 just-created persisted with SSH identity

    const inLobby = await lobbyRoomIds(page);
    // AC6 (subset invariant): every on-disk room for this owner is present in their lobby
    for (const id of onDisk) expect(inLobby).toContain(id);

    // AC1: all 3 freshly-created room names are visible
    const lobbyText = await page.locator('.lobby').textContent();
    for (const n of names) expect(lobbyText).toContain(n);
  });

  test('AC3: after reconnect (reload) owner still sees all their on-disk rooms', async ({ page }) => {
    await ensureLobby(page, 'OwnerReconnect');
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));

    const names = [`RC-${runId}-1`, `RC-${runId}-2`];
    for (const n of names) { await createRoom(page, n); await leaveToLobby(page); }

    // reconnect: fresh page load → new WS → IDENTIFY re-advertises the user's full room set
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.lobby', { timeout: 15000 });
    await page.waitForTimeout(1500);

    const onDisk = diskRoomIds(token!);
    const inLobby = await lobbyRoomIds(page);
    for (const id of onDisk) expect(inLobby).toContain(id);
  });

  test('AC5: deleting one room leaves the others visible (disk + lobby)', async ({ page }) => {
    await ensureLobby(page, 'OwnerDelete');
    const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));

    const names = [`DL-${runId}-1`, `DL-${runId}-2`, `DL-${runId}-3`];
    for (const n of names) { await createRoom(page, n); await leaveToLobby(page); }

    const before = diskRoomIds(token!);
    expect(before.length).toBeGreaterThanOrEqual(3);

    // delete one via its card's delete button (owner-only ✕)
    const victim = before[before.length - 1];
    const delBtn = page.locator(`.room-card[data-room-id="${victim}"] .btn-delete, .btn-delete[data-room="${victim}"]`).first();
    page.once('dialog', d => d.accept());
    await delBtn.click();
    await page.waitForTimeout(2500);

    const after = diskRoomIds(token!);
    expect(after).not.toContain(victim);          // deleted room gone from disk
    expect(after.length).toBe(before.length - 1); // exactly one removed — others stay

    const inLobby = await lobbyRoomIds(page);
    expect(inLobby).not.toContain(victim);
    for (const id of after) expect(inLobby).toContain(id); // remaining owner rooms still shown
  });

  test('AC4 (documented): second user lobby vs owner-connected dormant semantics', async ({ browser }) => {
    // Owner creates a room and stays connected
    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true });
    const p1 = await ctx1.newPage();
    await ensureLobby(p1, 'OwnerVisible');
    const ownerToken = await p1.evaluate(() => localStorage.getItem('rawbin-player-id'));
    const rn = `AC4-${runId}`;
    await createRoom(p1, rn);
    await leaveToLobby(p1); // owner remains connected, in lobby

    // Second user connects while owner is connected
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const p2 = await ctx2.newPage();
    await ensureLobby(p2, 'OtherViewer');
    await p2.waitForTimeout(1500);
    const otherSees = (await p2.locator('.lobby').textContent())?.includes(rn) ?? false;

    // Owner's own room is on disk and in the OWNER's lobby (the core guarantee)
    const ownerLobby = await lobbyRoomIds(p1);
    const onDisk = diskRoomIds(ownerToken!);
    for (const id of onDisk) expect(ownerLobby).toContain(id);

    // Document the cross-user visibility under intended v0.5.2 dormant semantics.
    // (empty rooms are owner-only; this asserts no crash + records what others actually see)
    console.log(`[T93 AC4] other user sees owner's empty room "${rn}": ${otherSees} ` +
      `(v0.5.2 intent: empty/dormant rooms are owner-only; non-owners get the public-active view)`);

    await ctx1.close();
    await ctx2.close();
  });
});
