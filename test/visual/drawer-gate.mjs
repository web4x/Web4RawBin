/**
 * Canonical drawer verification gate — uses SystemTester (ZERO new users).
 * Covers: BUG3-7 + /trace regression + room flows.
 */
import { webkit, devices } from '@playwright/test';
import { setupSystemTester, joinSystemRoom } from './system-tester-setup.mjs';

const iPhone = devices['iPhone 14'];
const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

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

// Seed localStorage on the ORIGIN without triggering WS connect:
// Navigate to a static asset (no JS/WS), set localStorage, then navigate to app.
await page.goto('https://localhost:4444/app.css', { waitUntil: 'load' });
await page.evaluate(() => {
  localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df');
  localStorage.setItem('rawbin-name', 'SystemTester');
  localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
  localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
  localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
});
await page.waitForTimeout(200);

// /trace (localStorage now has SystemTester token from the /app load above)
console.log('=== /TRACE ===');
await page.goto('https://localhost:4444/trace', { waitUntil: 'networkidle' });
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

// Room
console.log('=== ROOM ===');
await setupSystemTester(page);
await joinSystemRoom(page);
const chatD = await ds();
console.log('  chat-default:', chatD.open && chatD.hasChat ? 'GREEN' : 'RED');

await page.screenshot({ path: 'test/visual/drawer-gate.png', fullPage: true });
await browser.close();
console.log('DONE');
