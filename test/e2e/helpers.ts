import { Page } from '@playwright/test';

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
    if (secretCode && /^\d{4}$/.test(secretCode)) {
      await page.fill('#de-code', secretCode);
      await page.waitForTimeout(200);
      await page.click('#de-submit');
      await page.waitForSelector('#de-code', { state: 'hidden', timeout: 15000 });
    } else {
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
