/**
 * Shared setup for all inline verification scripts.
 * Uses the ONE SystemTester identity (fixed token ce981242) — ZERO new prod users.
 */

const SYSTEM_TESTER_NAME = 'SystemTester';

/**
 * Call ONCE after creating context, BEFORE any page.goto.
 * Seeds the fixed SystemTester token via addInitScript so the FIRST
 * page load already identifies as SystemTester (no new user).
 */
export async function seedSystemTester(context) {
  await context.addInitScript(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df');
      localStorage.setItem('rawbin-name', 'SystemTester');
      localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
      localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
      localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
    }
  });
}

export async function setupSystemTester(page) {
  await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Handle profile editor if shown
  if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.fill('#pe-name', SYSTEM_TESTER_NAME);
    await page.waitForTimeout(200);
    await page.click('#pe-save');
    await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  // Handle device enrollment
  if (await page.locator('#de-code').isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.evaluate(() => { document.querySelector('.profile-overlay')?.remove(); });
    await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  }
}

export async function joinSystemRoom(page) {
  await page.waitForSelector('.lobby', { timeout: 15000 });
  const sr = page.locator('.room-card:has-text("System Test Room")').first();
  if (await sr.isVisible({ timeout: 3000 }).catch(() => false)) {
    const jb = sr.locator('.btn-join');
    if (await jb.isVisible({ timeout: 1000 }).catch(() => false)) await jb.tap();
    else await sr.tap();
  }
  await page.waitForSelector('.room-view', { timeout: 15000 });
  await page.waitForTimeout(5000);
}
