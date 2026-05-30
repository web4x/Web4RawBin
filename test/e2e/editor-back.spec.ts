/**
 * T84 (v0.4.10): Monaco editor toolbar Back button goes to the file's PARENT directory, not /app.
 * [test:uuid:2f5c543a-280d-48f9-bff5-e99870115d7b] T84 editor back button
 * rb-editor-toolbar derives the parent from this._path (set from /edit/<path>). Light-DOM anchors.
 */
import { test, expect, Page } from '@playwright/test';

function backLink(page: Page) {
  return page.locator('rb-editor-toolbar a').filter({ hasText: 'Back' }).first();
}
function browseLink(page: Page) {
  return page.locator('rb-editor-toolbar a').filter({ hasText: '📂' }).first();
}

test.describe('T84: editor back button → parent directory', () => {
  test('TS1/AC1/AC5: deep file → Back href is parent /md/.../ and navigates there', async ({ page }) => {
    await page.goto('/edit/scrum.pmo/sprints/sprint-9-room-identity/planning.md');
    const back = backLink(page);
    await expect(back).toBeVisible({ timeout: 10000 });
    expect(await back.getAttribute('href')).toBe('/md/scrum.pmo/sprints/sprint-9-room-identity/');

    await back.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/md/scrum.pmo/sprints/sprint-9-room-identity/');
  });

  test('TS3/AC2: Back button label is "← Back" (not "← App")', async ({ page }) => {
    await page.goto('/edit/scrum.pmo/sprints/sprint-9-room-identity/planning.md');
    const back = backLink(page);
    await expect(back).toBeVisible({ timeout: 10000 });
    expect((await back.textContent())?.trim()).toBe('← Back');
    // no stale "App" back-link anywhere in the toolbar
    expect(await page.locator('rb-editor-toolbar a', { hasText: 'App' }).count()).toBe(0);
  });

  test('TS2/AC6: root-level file → Back href is /md/ (guarded, no //)', async ({ page }) => {
    await page.goto('/edit/README.md');
    const back = backLink(page);
    await expect(back).toBeVisible({ timeout: 10000 });
    const href = await back.getAttribute('href');
    expect(href).toBe('/md/');
    expect(href).not.toMatch(/\/md\/\//); // PO guard: no double slash
  });

  test('TS4/AC4: 📂 browse button still goes to /md/', async ({ page }) => {
    await page.goto('/edit/README.md');
    const browse = browseLink(page);
    await expect(browse).toBeVisible({ timeout: 10000 });
    expect(await browse.getAttribute('href')).toBe('/md/');
  });
});
