/**
 * Contacts UI — T81 (member-click→sheet), T82 (vCard visible + rb-avatar DRY), T83 (self→read-only
 * [test:uuid:5e58a822-dc43-429b-85e6-9d3091465508] T81+T82+T83 contacts UI
 * [verifies:uuid:99897fb4-6876-4047-9849-bbdaa840e110] R10.2 vCard download
 * [verifies:uuid:30c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b62] R10.3 self-click profile
 * [verifies:uuid:b252bd78-7ee5-4ccf-8c74-818d1c6e6b4a] R10.3 self-click profile
 * sheet, NOT ProfileEditor). Verified against CURRENT behavior (v0.5.3+): T83 INVERTS the old T81
 * TS3 (self-tap → ProfileEditor); self-tap now opens `.user-sheet` with an Edit button.
 */
import { test, expect, Page } from '@playwright/test';
import { ensureLobby, cleanupTestUsers, cleanupTestRooms } from './helpers';

const RID = Date.now().toString(36);

async function createRoom(page: Page, name: string): Promise<void> {
  await page.click('#create-room-btn');
  await page.waitForSelector('#create-form', { state: 'visible', timeout: 5000 }).catch(() => {});
  const ni = page.locator('#room-name');
  if (await ni.isVisible({ timeout: 2000 }).catch(() => false)) await ni.fill(name);
  await page.click('#confirm-create-btn');
  await page.waitForSelector('.room-view', { timeout: 15000 });
  await page.waitForTimeout(1000);
}

async function leaveToLobby(page: Page): Promise<void> {
  await page.evaluate(() => {
    (document.querySelector('rb-header [data-action="leave"]') as HTMLElement)?.click();
  });
  await page.waitForSelector('.lobby', { timeout: 10000 });
  await page.waitForTimeout(800);
}

// Capture the next vCard blob text by hooking URL.createObjectURL in the page.
async function hookVCard(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__vcard = null;
    const orig = URL.createObjectURL.bind(URL);
    (URL as any).createObjectURL = (obj: any) => {
      if (obj instanceof Blob && obj.type === 'text/vcard') obj.text().then((t: string) => ((window as any).__vcard = t));
      return orig(obj);
    };
  });
}

test.describe('Contacts UI: T81/T82/T83 (current v0.5.x behavior)', () => {
  test.afterAll(() => {
    cleanupTestUsers(/^(SelfUser|EditSelf|VcardSelf|OwnerA|GuestB|RegUser|EditAvatarUser)$/);
    cleanupTestRooms(/^(SelfUser|EditSelf|VcardSelf|OwnerA|GuestB|RegUser|EditAvatarUser)/);
  });

  // ---- T83 self-flow (single client) ----
  test('T83 TS1: self-tap opens read-only .user-sheet (NOT ProfileEditor) with #us-vcard + #us-edit, no #us-link', async ({ page }) => {
    await ensureLobby(page, 'SelfUser');
    await createRoom(page, `Self-${RID}`);

    const ownBadge = page.locator('rb-member-badge', { hasText: 'SelfUser' }).first();
    await expect(ownBadge).toBeVisible({ timeout: 10000 });
    await ownBadge.click();

    await expect(page.locator('.user-sheet')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#pe-name')).toHaveCount(0); // editor must NOT open directly
    expect((await page.locator('.user-sheet-name').textContent())).toContain('SelfUser');
    await expect(page.locator('.user-sheet rb-avatar')).toHaveCount(1);
    await expect(page.locator('#us-vcard')).toBeVisible();
    await expect(page.locator('#us-edit')).toBeVisible();
    await expect(page.locator('#us-link')).toHaveCount(0);
  });

  test('T83 TS2: self #us-edit opens ProfileEditor prefilled and closes the sheet', async ({ page }) => {
    await ensureLobby(page, 'EditSelf');
    await createRoom(page, `EdSelf-${RID}`);
    await page.locator('rb-member-badge', { hasText: 'EditSelf' }).first().click();
    await expect(page.locator('.user-sheet')).toBeVisible({ timeout: 5000 });

    await page.click('#us-edit');
    await expect(page.locator('#pe-name')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.user-sheet')).toHaveCount(0); // one overlay at a time
    expect(await page.locator('#pe-name').inputValue()).toContain('EditSelf');
  });

  test('T83 TS3: self #us-vcard builds a vCard blob with FN:<self>', async ({ page }) => {
    await ensureLobby(page, 'VcardSelf');
    await createRoom(page, `VcSelf-${RID}`);
    await page.locator('rb-member-badge', { hasText: 'VcardSelf' }).first().click();
    await expect(page.locator('.user-sheet')).toBeVisible({ timeout: 5000 });

    await hookVCard(page);
    await page.click('#us-vcard');
    await page.waitForTimeout(1500);
    const vcard = await page.evaluate(() => (window as any).__vcard);
    expect(vcard).toContain('BEGIN:VCARD');
    expect(vcard).toContain('FN:VcardSelf');
    expect(vcard).toContain('END:VCARD');
  });

  // ---- T81/T82 other-member flow (two clients) ----
  test('T81/T82: other-member sheet — vCard visible+well-formed, #us-link present, no #us-edit, avatar readonly, 1 GET_USER_INFO/tap', async ({ browser }) => {
    const ctx1 = await browser.newContext({ ignoreHTTPSErrors: true });
    const p1 = await ctx1.newPage();
    let guiSent = 0;
    p1.on('websocket', ws => ws.on('framesent', (f: any) => {
      if (typeof f.payload === 'string' && f.payload.includes('GET_USER_INFO')) guiSent++;
    }));

    await ensureLobby(p1, 'OwnerA');
    const roomName = `Contact-${RID}`;
    await createRoom(p1, roomName);

    // GuestB joins the same room from the lobby
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const p2 = await ctx2.newPage();
    await ensureLobby(p2, 'GuestB');
    const card = p2.locator('.room-card', { hasText: roomName }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.locator('.btn-join').click();
    await p2.waitForSelector('.room-view', { timeout: 10000 });

    // OwnerA sees GuestB in the member list
    const guestBadge = p1.locator('rb-member-badge', { hasText: 'GuestB' }).first();
    await expect(guestBadge).toBeVisible({ timeout: 10000 });

    // AC7/TS4 — no listener stacking: re-render twice (leave→rejoin), then exactly 1 GET_USER_INFO per tap
    for (let i = 0; i < 2; i++) {
      await leaveToLobby(p1);
      await p1.locator('.room-card', { hasText: roomName }).first().locator('.btn-join').click();
      await p1.waitForSelector('.room-view', { timeout: 10000 });
      await p1.waitForTimeout(800);
    }
    await expect(p1.locator('rb-member-badge', { hasText: 'GuestB' }).first()).toBeVisible({ timeout: 10000 });
    guiSent = 0;
    await p1.locator('rb-member-badge', { hasText: 'GuestB' }).first().click();
    await expect(p1.locator('.user-sheet')).toBeVisible({ timeout: 5000 });
    await p1.waitForTimeout(500);
    expect(guiSent).toBe(1);

    // sheet content (T81 AC4, T82 AC1/AC2)
    expect(await p1.locator('.user-sheet-name').textContent()).toContain('GuestB');
    const vcardBtn = p1.locator('#us-vcard');
    await expect(vcardBtn).toBeVisible();
    expect((await vcardBtn.boundingBox())!.height).toBeGreaterThan(0);
    await expect(p1.locator('#us-link')).toBeVisible();   // other → Link Account
    await expect(p1.locator('#us-edit')).toHaveCount(0);  // no Edit for others
    await expect(p1.locator('.user-sheet rb-avatar')).toHaveCount(1); // T82 AC4: rb-avatar, not bare img
    await expect(p1.locator('.user-sheet-avatar > img')).toHaveCount(0);

    // T82 AC1 — vCard button readable (not white-on-white): its color differs from the sheet bg
    const contrast = await p1.evaluate(() => {
      const b = document.getElementById('us-vcard')!;
      const sheet = document.querySelector('.profile-sheet')!;
      return getComputedStyle(b).color !== getComputedStyle(sheet).backgroundColor;
    });
    expect(contrast).toBe(true);

    // T82 AC6 — sheet avatar readonly: tapping it does NOT open the upload editor
    await p1.locator('.user-sheet rb-avatar').click();
    await p1.waitForTimeout(400);
    await expect(p1.locator('#ov-upload-btn')).toHaveCount(0);

    // T82 AC3/TS4 — vCard well-formed
    await hookVCard(p1);
    await p1.click('#us-vcard');
    await p1.waitForTimeout(1500);
    const vcard = await p1.evaluate(() => (window as any).__vcard);
    expect(vcard).toContain('BEGIN:VCARD');
    expect(vcard).toContain('VERSION:3.0');
    expect(vcard).toContain('FN:GuestB');
    expect(vcard.trim().endsWith('END:VCARD')).toBe(true);

    await ctx1.close();
    await ctx2.close();
  });

  // ---- regressions ----
  test('T82 TS3: lobby #refresh-rooms-btn (.btn-secondary on dark) stays light-on-dark (scope did not leak)', async ({ page }) => {
    await ensureLobby(page, 'RegUser');
    const btn = page.locator('#refresh-rooms-btn');
    await expect(btn).toBeVisible();
    // the .user-sheet-scoped override paints text #667eea (rgb(102,126,234)); the lobby btn must NOT
    const color = await btn.evaluate(el => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(102, 126, 234)');
  });

  test('T81 TS5: lobby avatar (editable, NOT readonly) opens the editor overlay', async ({ page }) => {
    await ensureLobby(page, 'EditAvatarUser');
    await page.locator('.lobby rb-avatar').first().click();
    await expect(page.locator('#ov-upload-btn')).toBeVisible({ timeout: 5000 });
  });
});
