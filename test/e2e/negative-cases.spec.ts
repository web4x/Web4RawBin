import { test, expect } from '@playwright/test';

test.describe('T13.7: Negative Cases', () => {
  test('empty name keeps Continue disabled in gate', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const nameField = page.locator('#pe-name');
    const hasGate = await nameField.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasGate) {
      test.skip(true, 'Gate not shown — user already committed');
      return;
    }

    const btn = page.locator('#pe-save');
    await expect(btn).toBeDisabled();

    await page.fill('#pe-name', '   ');
    await page.locator('#pe-name').evaluate(el => el.dispatchEvent(new Event('input')));
    await expect(btn).toBeDisabled();

    await page.fill('#pe-name', 'Valid');
    await expect(btn).toBeEnabled();
  });
});
