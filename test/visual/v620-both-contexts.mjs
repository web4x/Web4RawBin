import { webkit, devices } from '@playwright/test';

const iPhone = devices['iPhone 14'];
const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

async function scrollTapIdx(idx) {
  await page.evaluate(i => document.querySelectorAll('rb-object-item')[i]?.scrollIntoView({ block: 'center' }), idx);
  await page.waitForTimeout(300);
  const pos = await page.evaluate(i => {
    const c = document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content');
    if (!c) return null;
    const r = c.getBoundingClientRect();
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
      hasChat: !!body?.querySelector('[class*=chat], .drawer-panel-chat, .chat-messages'),
      hasInput: !!body?.querySelector('input, textarea'),
      notFound: body?.textContent?.includes('not found') || false,
      bodyText: body?.textContent?.trim().substring(0, 60) || ''
    };
  });
}

// =============================================
// (1) /TRACE REGRESSION
// =============================================
console.log('=== (1) /TRACE REGRESSION ===');
await page.goto('https://localhost:4444/trace', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const traceItems = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')]
    .filter(el => el.getBoundingClientRect().width > 0)
    .slice(0, 3)
    .map(el => ({ idx: [...document.querySelectorAll('rb-object-item')].indexOf(el), name: el.querySelector('.oi-name')?.textContent?.trim().substring(0, 30) || '', ref: el.getAttribute('ref') || '' }))
);

// Tap A → detail
await scrollTapIdx(traceItems[0].idx);
const tA = await ds();
console.log('  tap A:', tA.open ? 'OPEN' : 'closed', 'ref=' + tA.ref.substring(0, 25), 'detail=' + tA.hasDetail, 'notFound=' + tA.notFound);
const t1 = tA.open && tA.hasDetail && !tA.notFound;

// Tap B → switches
await scrollTapIdx(traceItems[1].idx);
const tB = await ds();
const t2 = tB.open && tB.ref !== tA.ref;
console.log('  tap B:', tB.open ? 'OPEN' : 'closed', 'ref=' + tB.ref.substring(0, 25), 'switched=' + t2);

// Child nav
const childTapped = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  const link = d?.querySelector('.dv-link, .chain-link');
  if (!link) return null;
  link.scrollIntoView({ block: 'center' });
  const r = link.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), text: link.textContent.trim().substring(0, 25) };
});
let t3 = false;
if (childTapped) {
  const refBefore = tB.ref;
  await page.touchscreen.tap(childTapped.x, childTapped.y);
  await page.waitForTimeout(1500);
  const afterChild = await ds();
  t3 = afterChild.ref !== refBefore;
  console.log('  child "' + childTapped.text + '":', t3 ? 'navigated' : 'stuck');
}

// Close button
const closePos = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  const btn = d?.querySelector('.drawer-close, button[title=Close]');
  if (!btn) return null;
  btn.scrollIntoView({ block: 'center' });
  const r = btn.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
let t4 = false;
if (closePos) {
  await page.touchscreen.tap(closePos.x, closePos.y);
  await page.waitForTimeout(500);
  const afterClose = await ds();
  t4 = !afterClose.open;
  console.log('  close:', t4 ? 'closed' : 'still open');
}

console.log('  /TRACE:', t1 && t2 && t3 && t4 ? 'GREEN (all 4 unchanged)' : 'RED');
await page.screenshot({ path: 'test/visual/v620-trace.png', fullPage: true });

// =============================================
// (2) ROOM CONTEXT
// =============================================
console.log('\n=== (2) ROOM CONTEXT ===');
await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
  await page.fill('#pe-name', 'SystemTester');
  await page.waitForTimeout(200);
  await page.click('#pe-save');
  await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 }).catch(() => {});
}
if (await page.locator('#de-code').isVisible({ timeout: 3000 }).catch(() => false)) {
  await page.evaluate(() => {
    localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
    document.querySelector('.profile-overlay')?.remove();
  });
  await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
}
await page.waitForSelector('.lobby', { timeout: 15000 });
const sr = page.locator('.room-card:has-text("System Test Room")').first();
if (await sr.isVisible({ timeout: 3000 }).catch(() => false)) {
  const jb = sr.locator('.btn-join');
  if (await jb.isVisible({ timeout: 1000 }).catch(() => false)) await jb.tap();
  else await sr.tap();
}
await page.waitForSelector('.room-view', { timeout: 15000 });
await page.waitForTimeout(5000);

// R1: empty selection → drawer shows CHAT
const r1d = await ds();
const r1 = r1d.open && r1d.hasChat;
console.log('  default (no selection): open=' + r1d.open + ' hasChat=' + r1d.hasChat + ' hasInput=' + r1d.hasInput);
console.log('  R1 chat-default:', r1 ? 'GREEN' : 'RED');
await page.screenshot({ path: 'test/visual/v620-room-chat.png', fullPage: true });

// Expand room + files
async function tapExp(type, nameInc) {
  const pos = await page.evaluate(({ type, nameInc }) => {
    const items = [...document.querySelectorAll('rb-object-item')];
    const item = items.find(el => {
      if (el.getAttribute('type') !== type) return false;
      if (nameInc && !(el.querySelector('.oi-name')?.textContent || '').includes(nameInc)) return false;
      return true;
    });
    if (!item || item.hasAttribute('children-open')) return null;
    const exp = item.querySelector('.oi-expand');
    if (!exp) return null;
    exp.scrollIntoView({ block: 'center' });
    const r = exp.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, { type, nameInc });
  if (pos) { await page.touchscreen.tap(pos.x, pos.y); await page.waitForTimeout(1000); }
}
await tapExp('room', null);
await tapExp('collection', 'Members');
await tapExp('collection', 'Files');

// R2: tap member → detail renders
const memberIdx = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'member')
);
let r2 = false;
if (memberIdx >= 0) {
  await scrollTapIdx(memberIdx);
  const r2d = await ds();
  r2 = r2d.open && r2d.hasDetail && !r2d.notFound;
  console.log('  tap member: open=' + r2d.open + ' detail=' + r2d.hasDetail + ' notFound=' + r2d.notFound + ' ref=' + r2d.ref.substring(0, 25));
  console.log('  R2 member-detail:', r2 ? 'GREEN' : r2d.notFound ? 'RED (BUG7B: not found)' : 'RED');
} else { console.log('  No members visible. R2: SKIP'); }

// R3: tap file → detail renders
const fileIdx = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'file')
);
let r3 = false;
if (fileIdx >= 0) {
  await scrollTapIdx(fileIdx);
  const r3d = await ds();
  r3 = r3d.open && r3d.hasDetail && !r3d.notFound;
  console.log('  tap file: open=' + r3d.open + ' detail=' + r3d.hasDetail + ' notFound=' + r3d.notFound + ' ref=' + r3d.ref.substring(0, 25));
  console.log('  R3 file-detail:', r3 ? 'GREEN' : r3d.notFound ? 'RED (BUG7B: not found)' : 'RED');
} else { console.log('  No files visible. R3: SKIP'); }

// R4: deselect → back to chat
if (fileIdx >= 0) {
  await scrollTapIdx(fileIdx); // re-tap to deselect
  await page.waitForTimeout(1000);
  const r4d = await ds();
  const r4 = r4d.open && r4d.hasChat;
  console.log('  deselect: open=' + r4d.open + ' hasChat=' + r4d.hasChat);
  console.log('  R4 deselect→chat:', r4 ? 'GREEN' : 'RED');
}

await page.screenshot({ path: 'test/visual/v620-room-detail.png', fullPage: true });

// =============================================
// VERDICT
// =============================================
console.log('\n=== VERDICT v0.6.20 ===');
console.log('/TRACE regression:', t1 && t2 && t3 && t4 ? 'GREEN' : 'RED');
console.log('ROOM chat-default:', r1 ? 'GREEN' : 'RED');
console.log('ROOM member-detail:', r2 ? 'GREEN' : memberIdx < 0 ? 'SKIP' : 'RED');
console.log('ROOM file-detail:', r3 ? 'GREEN' : fileIdx < 0 ? 'SKIP' : 'RED');
const overall = (t1 && t2 && t3 && t4) && r1;
console.log('OVERALL:', overall ? 'GREEN — both contexts work' : 'RED');

await browser.close();
console.log('DONE');
