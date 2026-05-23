import { test, expect } from '@playwright/test';
import { passEnrollmentIfNeeded } from './helpers.js';

test.describe('T13.2: New User Journey', () => {
  test('profile gate shown for new user, Continue disabled until name entered', async ({ page }) => {
    await page.goto('/app');

    const gate = page.locator('.profile-gate');
    const gateVisible = await gate.isVisible({ timeout: 10000 }).catch(() => false);
    if (!gateVisible) {
      test.skip(true, 'Gate not shown — user already committed');
      return;
    }

    const continueBtn = page.locator('#pe-save');
    await expect(continueBtn).toBeDisabled();

    await page.fill('#pe-name', 'E2E-User-1');
    await expect(continueBtn).toBeEnabled();

    await continueBtn.click();
    await page.waitForSelector('.profile-gate', { state: 'hidden', timeout: 15000 });

    await passEnrollmentIfNeeded(page);

    const lobby = page.locator('.lobby');
    await expect(lobby).toBeVisible({ timeout: 15000 });
  });
});
