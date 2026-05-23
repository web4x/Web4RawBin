import { Page } from '@playwright/test';

export async function ensureLobby(page: Page, name: string): Promise<void> {
  await page.goto('/app');
  await page.evaluate((n) => {
    localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
    localStorage.setItem('rawbin-name', n);
  }, name);
  await page.goto('/app');

  for (let attempt = 0; attempt < 3; attempt++) {
    const nameField = page.locator('#pe-name');
    if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.fill('#pe-name', name);
      await page.waitForTimeout(300);
      await page.click('#pe-save');
      await page.waitForTimeout(5000);
    }

    const enrollCode = page.locator('#de-code');
    if (await enrollCode.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.evaluate(() => {
        const overlay = document.querySelector('.profile-overlay');
        if (overlay) overlay.remove();
      });
      await page.waitForTimeout(500);
    }

    const lobby = page.locator('.lobby');
    if (await lobby.isVisible({ timeout: 3000 }).catch(() => false)) {
      const memberNameInput = page.locator('#member-name');
      if (await memberNameInput.isVisible().catch(() => false)) {
        await memberNameInput.fill(name);
        await memberNameInput.evaluate(el => el.dispatchEvent(new Event('change')));
      }
      return;
    }

    await page.goto('/app');
    await page.waitForTimeout(1000);
  }

  await page.waitForSelector('.lobby', { timeout: 10000 });
}
