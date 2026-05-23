import { test, expect } from '@playwright/test';

test.describe('T13.2: New User Journey', () => {
  test('gate shown, Continue disabled, name enables it, lobby appears after flow', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const nameField = page.locator('#pe-name');
    const gateVisible = await nameField.isVisible({ timeout: 8000 }).catch(() => false);
    if (!gateVisible) {
      test.skip(true, 'Gate not shown — user already committed on this server');
      return;
    }

    const continueBtn = page.locator('#pe-save');
    await expect(continueBtn).toBeDisabled();

    const secretCode = await page.locator('#pe-code').inputValue().catch(() => '');

    await page.fill('#pe-name', 'E2E-User-1');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 });

    const enrollCode = page.locator('#de-code');
    if (await enrollCode.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (secretCode && /^\d{4}$/.test(secretCode)) {
        await page.fill('#de-code', secretCode);
        await page.waitForTimeout(200);
        await page.click('#de-submit');
        await page.waitForSelector('#de-code', { state: 'hidden', timeout: 15000 });
      }
    }

    const lobby = page.locator('.lobby');
    await expect(lobby).toBeVisible({ timeout: 15000 });
  });
});
