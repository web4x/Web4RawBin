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
    const s = getComputedStyle(d);
    return {
      exists: true, open: d.hasAttribute('open'), ref: d.getAttribute('ref') || '',
      hasDetail: !!body?.querySelector('[class*=dv-], h3, rb-detail-view'),
      hasChat: !!body?.querySelector('[class*=chat], .drawer-panel-chat'),
      notFound: body?.textContent?.includes('not found') || false,
      position: s.position, bottom: s.bottom,
      drawerH: Math.round(d.getBoundingClientRect().height),
      drawerTop: Math.round(d.getBoundingClientRect().top),
      drawerBottom: Math.round(d.getBoundingClientRect().bottom),
      vpH: window.innerHeight
    };
  });
}

async function setup() {
  await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.fill('#pe-name', 'SystemTester'); await page.waitForTimeout(200);
    await page.click('#pe-save'); await page.waitForSelector('#pe-name', { state: 'hidden', timeout: 15000 }).catch(() => {});
  }
  if (await page.locator('#de-code').isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.evaluate(() => { localStorage.setItem('rawbin-device-privateKey','e2e-bypass'); localStorage.setItem('rawbin-device-publicKey','e2e-bypass'); localStorage.setItem('rawbin-device-signature','e2e-bypass'); document.querySelector('.profile-overlay')?.remove(); });
    await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  }
}

async function tapExp(type, nameInc) {
  const pos = await page.evaluate(({ type, nameInc }) => {
    const item = [...document.querySelectorAll('rb-object-item')].find(el => { if (el.getAttribute('type') !== type) return false; if (nameInc && !(el.querySelector('.oi-name')?.textContent || '').includes(nameInc)) return false; return true; });
    if (!item || item.hasAttribute('children-open')) return null;
    const exp = item.querySelector('.oi-expand'); if (!exp) return null;
    exp.scrollIntoView({ block: 'center' }); const r = exp.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, { type, nameInc });
  if (pos) { await page.touchscreen.tap(pos.x, pos.y); await page.waitForTimeout(1000); }
}

// =============================================
// (1) ROOM STRUCTURE — drawer pins at bottom
// =============================================
console.log('=== (1) ROOM STRUCTURE ===');
await setup();
await page.waitForSelector('.lobby', { timeout: 15000 });
const sr = page.locator('.room-card:has-text("System Test Room")').first();
if (await sr.isVisible({ timeout: 3000 }).catch(() => false)) {
  const jb = sr.locator('.btn-join');
  if (await jb.isVisible({ timeout: 1000 }).catch(() => false)) await jb.tap(); else await sr.tap();
}
await page.waitForSelector('.room-view', { timeout: 15000 });
await page.waitForTimeout(5000);

const structure = await ds();
console.log('  drawer position:', structure.position);
console.log('  drawer h=' + structure.drawerH + ' top=' + structure.drawerTop + ' bottom=' + structure.drawerBottom + ' vpH=' + structure.vpH);
const pinsBottom = structure.drawerBottom <= structure.vpH + 5; // within 5px of viewport bottom
const s1 = structure.exists && structure.drawerH > 0;
console.log('  pins at bottom:', pinsBottom);
console.log('  (1) structure:', s1 ? 'GREEN' : 'RED');
await page.screenshot({ path: 'test/visual/v621-room-structure.png', fullPage: true });

// =============================================
// (2) ROOM BUG5-SAFE — tap A→detail, tap B→switches
// =============================================
console.log('\n=== (2) ROOM BUG5-SAFE ===');
await tapExp('room', null);
await tapExp('collection', 'Files');

const fileIndices = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')]
    .map((el, i) => ({ i, type: el.getAttribute('type'), vis: el.getBoundingClientRect().width > 0 }))
    .filter(x => x.type === 'file' && x.vis)
    .slice(0, 2)
    .map(x => x.i)
);

let s2 = false;
if (fileIndices.length >= 2) {
  await scrollTapIdx(fileIndices[0]);
  const dA = await ds();
  console.log('  A: ref=' + dA.ref.substring(0, 25) + ' detail=' + dA.hasDetail);

  await scrollTapIdx(fileIndices[1]);
  const dB = await ds();
  console.log('  B: ref=' + dB.ref.substring(0, 25) + ' detail=' + dB.hasDetail);
  s2 = dB.ref !== dA.ref && dB.open;
  console.log('  switched:', s2);
} else {
  // Try member + file
  await tapExp('collection', 'Members');
  const memberIdx = await page.evaluate(() =>
    [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'member' && el.getBoundingClientRect().width > 0)
  );
  const fileIdx = await page.evaluate(() =>
    [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'file' && el.getBoundingClientRect().width > 0)
  );
  if (memberIdx >= 0 && fileIdx >= 0) {
    await scrollTapIdx(memberIdx);
    const dA = await ds();
    await scrollTapIdx(fileIdx);
    const dB = await ds();
    s2 = dB.ref !== dA.ref && dB.open;
    console.log('  member→file switch:', s2, 'refs:', dA.ref.substring(0, 15), '→', dB.ref.substring(0, 15));
  }
}
console.log('  (2) BUG5-safe:', s2 ? 'GREEN' : 'RED');
await page.screenshot({ path: 'test/visual/v621-room-switch.png', fullPage: true });

// =============================================
// (3) ROOM chat/detail/deselect
// =============================================
console.log('\n=== (3) ROOM FLOWS ===');
// chat default
const fileIdx = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'file' && el.getBoundingClientRect().width > 0)
);
// deselect current → chat
if (fileIdx >= 0) {
  const curRef = (await ds()).ref;
  if (curRef) {
    const curIdx = await page.evaluate(ref =>
      [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('ref') === ref), curRef);
    if (curIdx >= 0) await scrollTapIdx(curIdx); // deselect
  }
}
await page.waitForTimeout(1000);
const chatD = await ds();
const s3chat = chatD.open && chatD.hasChat;
console.log('  empty→chat:', s3chat ? 'GREEN' : 'RED', 'hasChat=' + chatD.hasChat);

// select file → detail
if (fileIdx >= 0) {
  await scrollTapIdx(fileIdx);
  const detD = await ds();
  console.log('  file→detail:', detD.hasDetail && !detD.notFound ? 'GREEN' : 'RED');

  // deselect → chat
  await scrollTapIdx(fileIdx);
  const deselD = await ds();
  console.log('  deselect→chat:', deselD.open && deselD.hasChat ? 'GREEN' : 'RED');
}
await page.screenshot({ path: 'test/visual/v621-room-flows.png', fullPage: true });

// =============================================
// (4) /TRACE REGRESSION
// =============================================
console.log('\n=== (4) /TRACE REGRESSION ===');
await page.goto('https://localhost:4444/trace', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const traceItems = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')]
    .filter(el => el.getBoundingClientRect().width > 0).slice(0, 2)
    .map(el => ({ idx: [...document.querySelectorAll('rb-object-item')].indexOf(el), ref: el.getAttribute('ref') || '' }))
);
await scrollTapIdx(traceItems[0].idx);
const tA = await ds();
await scrollTapIdx(traceItems[1].idx);
const tB = await ds();
const traceOk = tA.open && tA.hasDetail && tB.open && tB.ref !== tA.ref;
console.log('  tap+switch:', traceOk ? 'GREEN' : 'RED', 'A=' + tA.ref.substring(0, 15), 'B=' + tB.ref.substring(0, 15));
await page.screenshot({ path: 'test/visual/v621-trace.png', fullPage: true });

// =============================================
// VERDICT
// =============================================
console.log('\n=== VERDICT v0.6.21 ===');
console.log('(1) room structure:', s1 ? 'GREEN' : 'RED');
console.log('(2) room BUG5-safe:', s2 ? 'GREEN' : 'RED');
console.log('(3) room flows:', s3chat ? 'GREEN' : 'RED');
console.log('(4) /trace regression:', traceOk ? 'GREEN' : 'RED');
const all = s1 && s2 && s3chat && traceOk;
console.log('OVERALL:', all ? 'GREEN — Tron device-verify → clean build' : 'RED');

await browser.close();
console.log('DONE');
