/**
 * Canonical drawer verification gate — uses SystemTester (ZERO new users).
 * Seed-before-WS: /api/health → localStorage.setItem(token) → /app
 */
import { webkit, devices } from '@playwright/test';

const TOKEN = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const NAME = 'SystemTester';
const BASE = 'https://localhost:4444';
const iPhone = devices['iPhone 14'];

const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

// Seed-before-WS: /api/health sets origin, then seed token, then /app connects with it
await page.goto(`${BASE}/api/health`);
await page.evaluate(t => {
  localStorage.setItem('rawbin-player-id', t);
  localStorage.setItem('rawbin-name', 'SystemTester');
  localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
  localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
  localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
}, TOKEN);

async function scrollTapIdx(idx) {
  await page.evaluate(i => document.querySelectorAll('rb-object-item')[i]?.scrollIntoView({ block: 'center' }), idx);
  await page.waitForTimeout(300);
  const pos = await page.evaluate(i => {
    const c = document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content');
    if (!c) return null; const r = c.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, idx);
  if (!pos) return false;
  await page.touchscreen.tap(pos.x, pos.y);
  await page.waitForTimeout(2000);
  return true;
}

async function ds() {
  return page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d) return { exists: false };
    const body = d.querySelector('.drawer-body');
    return {
      exists: true, open: d.hasAttribute('open'), ref: d.getAttribute('ref') || '',
      hasDetail: !!body?.querySelector('[class*=dv-], h3, rb-detail-view'),
      hasChat: !!body?.querySelector('[class*=chat], .drawer-panel-chat'),
      notFound: body?.textContent?.includes('not found') || false
    };
  });
}

// /trace (token already seeded)
console.log('=== /TRACE ===');
await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const items = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')].filter(el => el.getBoundingClientRect().width > 0).slice(0, 2)
    .map(el => ({ idx: [...document.querySelectorAll('rb-object-item')].indexOf(el), ref: el.getAttribute('ref') || '' }))
);
await scrollTapIdx(items[0].idx);
const tA = await ds();
await scrollTapIdx(items[1].idx);
const tB = await ds();
console.log('  tap+switch:', tA.open && tB.open && tB.ref !== tA.ref ? 'GREEN' : 'RED');

// Room (token still seeded)
console.log('=== ROOM ===');
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
  await page.fill('#pe-name', NAME); await page.waitForTimeout(200);
  await page.click('#pe-save'); await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 }).catch(() => {});
}
if (await page.locator('#de-code').isVisible({ timeout: 3000 }).catch(() => false)) {
  await page.evaluate(() => { document.querySelector('.profile-overlay')?.remove(); });
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
}
await page.waitForSelector('.lobby', { timeout: 15000 });
const sr = page.locator('.room-card:has-text("System Test Room")').first();
if (await sr.isVisible({ timeout: 3000 }).catch(() => false)) {
  const jb = sr.locator('.btn-join');
  if (await jb.isVisible({ timeout: 1000 }).catch(() => false)) await jb.tap(); else await sr.tap();
}
await page.waitForSelector('.room-view', { timeout: 15000 });
await page.waitForTimeout(3000);
const chatD = await ds();
console.log('  chat-default:', chatD.open && chatD.hasChat ? 'GREEN' : 'RED');

// Verify reused token
const usedToken = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
console.log('  token used:', usedToken === 'ce981242-74fe-4d44-b5b6-43c641e224df' ? 'SystemTester (reused)' : 'DIFFERENT: ' + usedToken);

await page.screenshot({ path: 'test/visual/drawer-gate.png', fullPage: true });
await browser.close();
console.log('DONE');
