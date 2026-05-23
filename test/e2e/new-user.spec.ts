import { test, expect } from '@playwright/test';

test.describe('T13.2: New User Journey', () => {
  test('profile gate shown for new user, Continue disabled until name entered', async ({ page }) => {
    await page.goto('/app');

    const nameField = page.locator('#pe-name');
    const nameVisible = await nameField.isVisible({ timeout: 10000 }).catch(() => false);
    if (!nameVisible) {
      test.skip(true, 'Gate not shown — user already committed');
      return;
    }

    const continueBtn = page.locator('#pe-save');
    await expect(continueBtn).toBeDisabled();

    await page.fill('#pe-name', 'E2E-User-1');
    await expect(continueBtn).toBeEnabled();

    await continueBtn.click();
    await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 });

    const lobbyOrEnroll = await Promise.race([
      page.waitForSelector('.lobby', { timeout: 10000 }).then(() => 'lobby'),
      page.waitForSelector('#de-code', { timeout: 10000 }).then(() => 'enroll'),
    ]).catch(() => 'timeout');

    expect(['lobby', 'enroll']).toContain(lobbyOrEnroll);
  });
});
