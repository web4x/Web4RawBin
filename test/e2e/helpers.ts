import { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HELPERS_DIR = path.dirname(fileURLToPath(import.meta.url));
// T100: honor isolated DATA_DIR — cleanup must target the dir the server actually wrote to
const DATA_BASE = process.env.E2E_DATA_DIR || path.resolve(HELPERS_DIR, '../../data');
const DATA_USERS_DIR = path.join(DATA_BASE, 'users');

/**
 * Delete test-created rooms whose room.json `name` matches `pattern`.
 * Scans data/users/* /rooms/* /room.json and rmSync's matching room dirs.
 * Use in afterAll to avoid flooding prod data with test rooms.
 * Returns count of rooms removed.
 */
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
        const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        if (typeof meta.name === 'string' && pattern.test(meta.name)) {
          fs.rmSync(path.join(roomsDir, roomId), { recursive: true, force: true });
          removed++;
        }
      } catch { /* skip corrupt */ }
    }
  }
  return removed;
}

export async function ensureLobby(page: Page, name: string): Promise<void> {
  await page.goto('/app');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  let secretCode = '';

  const nameField = page.locator('#pe-name');
  if (await nameField.isVisible({ timeout: 5000 }).catch(() => false)) {
    secretCode = await page.locator('#pe-code').inputValue().catch(() => '');
    await page.fill('#pe-name', name);
    await page.waitForTimeout(200);
    await page.click('#pe-save');
    await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 });
  }

  const enrollCode = page.locator('#de-code');
  if (await enrollCode.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (!secretCode || !/^\d{4}$/.test(secretCode)) {
      await page.waitForTimeout(1000);
      secretCode = await page.evaluate(() =>
        (window as any).__rawbinClient?._profile?.secretCode || ''
      ).catch(() => '');
    }

    if (secretCode && /^\d{4}$/.test(secretCode)) {
      await page.fill('#de-code', secretCode);
      await page.waitForTimeout(300);
      const btnEnabled = !(await page.locator('#de-submit').isDisabled());
      if (btnEnabled) {
        await page.click('#de-submit');
        await page.waitForSelector('#de-code', { state: 'hidden', timeout: 15000 }).catch(() => {});
      }
    }

    if (await page.locator('#de-code').isVisible().catch(() => false)) {
      await page.evaluate(() => {
        localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
        localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
        localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
        const overlay = document.querySelector('.profile-overlay');
        if (overlay) overlay.remove();
      });
      await page.goto('/app');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    }
  }

  await page.waitForSelector('.lobby', { timeout: 15000 });

  const memberNameInput = page.locator('#member-name');
  if (await memberNameInput.isVisible().catch(() => false)) {
    await memberNameInput.fill(name);
    await memberNameInput.evaluate(el => el.dispatchEvent(new Event('change')));
  }
}
