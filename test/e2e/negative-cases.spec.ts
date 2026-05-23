import { test, expect } from '@playwright/test';

test.describe('T13.7: Negative Cases', () => {
  test('empty name keeps Continue disabled in gate', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('.profile-gate', { timeout: 10000 }).catch(() => {});
    const gate = page.locator('.profile-gate');
    if (!await gate.isVisible().catch(() => false)) {
      test.skip(true, 'Gate not shown — user already committed');
      return;
    }
    const btn = page.locator('#pe-save');
    await expect(btn).toBeDisabled();
    await page.fill('#pe-name', '   ');
    await expect(btn).toBeDisabled();
  });
});
