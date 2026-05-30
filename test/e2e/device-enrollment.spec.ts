// [test:uuid:bfd84a15-67ca-4b1b-a76a-716ed18b7c2e] T13 device enrollment
import { test, expect } from '@playwright/test';

test.describe('T13.5: Device Enrollment', () => {
  test('wrong code shows error, correct code stores keys, reload auto-auths', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const nameField = page.locator('#pe-name');
    const hasGate = await nameField.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasGate) {
      test.skip(true, 'Gate not shown — user already committed');
      return;
    }

    const secretCode = await page.locator('#pe-code').inputValue().catch(() => '');
    if (!secretCode || !/^\d{4}$/.test(secretCode)) {
      test.skip(true, 'No secret code available from gate');
      return;
    }

    await page.fill('#pe-name', 'E2E-Enroll');
    await page.click('#pe-save');
    await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 });

    const enrollCode = page.locator('#de-code');
    await expect(enrollCode).toBeVisible({ timeout: 5000 });

    await page.fill('#de-code', '0000');
    await page.waitForTimeout(200);
    await page.click('#de-submit');

    const error = page.locator('#de-error');
    await expect(error).toBeVisible({ timeout: 5000 });

    await page.fill('#de-code', secretCode);
    await page.waitForTimeout(200);
    await page.click('#de-submit');

    await page.waitForSelector('#de-code', { state: 'hidden', timeout: 15000 });

    const hasKeys = await page.evaluate(() => !!localStorage.getItem('rawbin-device-privateKey'));
    expect(hasKeys).toBe(true);

    const hasPubKey = await page.evaluate(() => !!localStorage.getItem('rawbin-device-publicKey'));
    expect(hasPubKey).toBe(true);

    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const noEnrollAfterReload = await page.locator('#de-code').isVisible({ timeout: 5000 }).catch(() => false);
    expect(noEnrollAfterReload).toBe(false);

    await page.waitForSelector('.lobby', { timeout: 15000 });
  });
});
