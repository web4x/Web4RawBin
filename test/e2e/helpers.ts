import { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { E2E_DATA_DIR, loginAs } from './identities';

// T100/R42.3: the SAME dir playwright.config.ts gives the isolated server (was ./data → specs saw 0 rooms)
const DATA_BASE = E2E_DATA_DIR;
const DATA_USERS_DIR = path.join(DATA_BASE, 'users');

// ONE fixed systemTester identity + ONE persistent system test room — reused every E2E run
export const SYSTEM_TESTER_NAME = 'SystemTester';
export const SYSTEM_TEST_ROOM_NAME = 'System Test Room';

// Delete test-created rooms matching pattern. Scans room.json names, rmSync dirs.
export function cleanupTestRooms(pattern: RegExp): number {
  let removed = 0;
  if (!fs.existsSync(DATA_USERS_DIR)) return 0;
  for (const userDir of fs.readdirSync(DATA_USERS_DIR)) {
    const roomsDir = path.join(DATA_USERS_DIR, userDir, 'rooms');
    if (!fs.existsSync(roomsDir)) continue;
    for (const roomId of fs.readdirSync(roomsDir)) {
      const jsonPath = path.join(roomsDir, roomId, 'room.json');
      if (!fs.existsSync(jsonPath)) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const meta = raw.model || raw; // room.json is a scenario unit ({ ior, model })
        if (typeof meta.name === 'string' && pattern.test(meta.name)) {
          fs.rmSync(path.join(roomsDir, roomId), { recursive: true, force: true });
          removed++;
        }
      } catch { /* skip corrupt */ }
    }
  }
  return removed;
}

// R42.3: users are never created or deleted by specs — the two fixed testers come from identities.ts
// (globalSetup). ensureLobby (minted a new user per name, fell back to fake 'e2e-bypass' keys) is gone.

/**
 * Create a room and enter it — returns { roomId, playerToken }.
 * Caller is in the lobby (call loginAs first).
 */
export async function ensureRoom(page: Page, roomName: string): Promise<{ roomId: string; playerToken: string }> {
  await page.click('#create-room-btn');
  await page.waitForTimeout(400);
  const nameInput = page.locator('#room-name');
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill(roomName);
  }
  await page.click('#confirm-create-btn');
  await page.waitForSelector('.room-view', { timeout: 15000 });
  await page.waitForTimeout(1000);
  const playerToken = await page.evaluate(() => localStorage.getItem('rawbin-player-id') || '');
  const roomId = await page.evaluate(() => (window as any).__rawbinClient?._roomId || '');
  return { roomId, playerToken };
}

/**
 * Upload a real file to a room via the server's /api/room/<id>/upload endpoint.
 * Uses the page's fetch (same origin, same cookies) with the playerToken from localStorage.
 * Triggers a real FILE_ADDED WS broadcast — the exact production path.
 */
export async function uploadTestFile(page: Page, roomId: string, fileName: string, content: string, mimeType = 'text/plain'): Promise<string> {
  const fileUuid = await page.evaluate(async ({ roomId, fileName, content, mimeType }) => {
    const token = localStorage.getItem('rawbin-player-id') || '';
    const blob = new Blob([content], { type: mimeType });
    const form = new FormData();
    form.append('file', blob, fileName);
    form.append('playerToken', token);
    const resp = await fetch(`/api/room/${roomId}/upload`, { method: 'POST', body: form });
    if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
    const data = await resp.json();
    return data.fileUuid || '';
  }, { roomId, fileName, content, mimeType });
  await page.waitForTimeout(500);
  return fileUuid;
}

/**
 * ONE systemTester + ONE system test room — the durable anti-pollution harness.
 * Logs in as SYSTEM_TESTER_NAME, joins the system test room (creates it on first run).
 * Returns { roomId, playerToken }. NEVER creates per-test rooms/users.
 */
export async function ensureSystemSession(page: Page): Promise<{ roomId: string; playerToken: string }> {
  await loginAs(page, 1);
  const existingRoom = page.locator(`.room-card:has-text("${SYSTEM_TEST_ROOM_NAME}")`).first();
  if (await existingRoom.isVisible({ timeout: 3000 }).catch(() => false)) {
    const joinBtn = existingRoom.locator('.btn-join');
    if (await joinBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await joinBtn.click();
    } else {
      await existingRoom.click();
    }
    await page.waitForSelector('.room-view', { timeout: 15000 });
  } else {
    await page.click('#create-room-btn');
    await page.waitForTimeout(400);
    const nameInput = page.locator('#room-name');
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill(SYSTEM_TEST_ROOM_NAME);
    }
    await page.click('#confirm-create-btn');
    await page.waitForSelector('.room-view', { timeout: 15000 });
  }
  await page.waitForTimeout(1000);
  const playerToken = await page.evaluate(() => localStorage.getItem('rawbin-player-id') || '');
  const roomId = await page.evaluate(() => (window as any).__rawbinClient?._roomId || '');
  return { roomId, playerToken };
}

/** v0.6.10: the room chat is the ChatPanel inside rb-detail-drawer (light DOM: #cp-input/#cp-send/#cp-messages);
 *  the old rb-chat-sheet was deleted (0b971ad94). Send works whether the drawer is expanded or minimized. */
export async function sendChat(page: Page, text: string): Promise<void> {
  await page.waitForSelector('rb-detail-drawer #cp-input', { state: 'attached', timeout: 10000 });
  await page.evaluate((t) => {
    const input = document.querySelector('rb-detail-drawer #cp-input') as HTMLInputElement;
    input.value = t;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    (document.querySelector('rb-detail-drawer #cp-send') as HTMLElement).click();
  }, text);
}

/** Text of the room chat messages (ChatPanel #cp-messages). */
export async function chatText(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector('rb-detail-drawer #cp-messages')?.textContent || '');
}
