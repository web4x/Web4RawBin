// [test:uuid:t190-tree-append-only-spec-001a-2b3c-4d5e6f708190] T190 champagne — tree expand appends only
// Chain: Task T190 (08e46ce3) → UC treeRender.lazyAppend (71d57474) → Class RbTraceTree (5a057914)
//        → Method RbTraceTree.nodeEl (32ae650c) → Impl d8f406ce → TEST (this)
import { test, expect } from '@playwright/test';

test.describe('T190: tree expand appends only — no full re-render', () => {
  test('append-only + scroll preserved + DOM identity preserved on Task expand', async ({ page }) => {
    await page.goto('/trace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);

    // Tag every existing tree item with a unique pre-expand marker
    await page.evaluate(() => {
      document.querySelectorAll('rb-object-item').forEach((el, i) =>
        el.setAttribute('data-pre-t190', String(i)));
    });
    const preCount = await page.evaluate(() =>
      document.querySelectorAll('[data-pre-t190]').length);

    // Pre-expand scroll snapshot (window + tree container)
    const sBeforeWin = await page.evaluate(() => window.scrollY);
    const sBeforeTree = await page.evaluate(() =>
      document.querySelector('rb-trace-tree')?.scrollTop ?? 0);

    // Click an expander on a Task with children (deeper in tree)
    const expanded = await page.evaluate(() => {
      const items = document.querySelectorAll(
        'rb-object-item[type=task][has-children]:not([children-open])');
      if (!items.length) return null;
      const target = items[items.length - 1];
      const exp = target.querySelector('.oi-expand') as HTMLElement | null;
      if (!exp) return null;
      exp.click();
      return target.getAttribute('title')?.substring(0, 40) || 'unknown';
    });
    expect(expanded).not.toBeNull();
    await page.waitForTimeout(1500);

    // Post-expand state
    const postCount = await page.evaluate(() =>
      document.querySelectorAll('rb-object-item').length);
    const survivedPre = await page.evaluate(() =>
      document.querySelectorAll('[data-pre-t190]').length);
    const sAfterWin = await page.evaluate(() => window.scrollY);
    const sAfterTree = await page.evaluate(() =>
      document.querySelector('rb-trace-tree')?.scrollTop ?? 0);

    // T190-1 APPEND-ONLY: total items grew, every pre-existing item still tagged
    expect(postCount).toBeGreaterThan(preCount);
    expect(survivedPre).toBe(preCount);

    // T190-2 SCROLL PRESERVED: window scroll within 50px tolerance
    expect(Math.abs(sAfterWin - sBeforeWin)).toBeLessThan(50);
    // tree container scroll also within 50px tolerance
    expect(Math.abs(sAfterTree - sBeforeTree)).toBeLessThan(50);

    // T190-3 NO REBUILD: pre-tags survive expand = DOM identity preserved
    expect(survivedPre).toBe(preCount);
  });
});
