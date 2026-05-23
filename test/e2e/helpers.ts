import { Page } from '@playwright/test';

export async function passGateIfNeeded(page: Page, name: string): Promise<void> {
  const gate = page.locator('.profile-gate');
  if (await gate.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.fill('#pe-name', name);
    await page.click('#pe-save');
    await page.waitForSelector('.profile-gate', { state: 'hidden', timeout: 15000 });
  }
}

export async function passEnrollmentIfNeeded(page: Page): Promise<void> {
  await page.waitForTimeout(1000);
  const enrollCode = page.locator('#de-code');
  const hasEnroll = await enrollCode.isVisible({ timeout: 3000 }).catch(() => false);
  if (!hasEnroll) return;

  await page.evaluate(() => {
    localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
  });

  const closeOverlay = page.locator('.profile-overlay');
  if (await closeOverlay.isVisible().catch(() => false)) {
    await closeOverlay.evaluate(el => el.remove());
  }

  await page.goto('/app');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

export async function ensureLobby(page: Page, name: string): Promise<void> {
  await page.goto('/app');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await passGateIfNeeded(page, name);
  await passEnrollmentIfNeeded(page);
  await page.waitForSelector('.lobby', { timeout: 15000 });
}
