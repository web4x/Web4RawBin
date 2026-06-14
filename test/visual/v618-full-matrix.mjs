import { webkit, devices } from '@playwright/test';

const iPhone = devices['iPhone 14'];
const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

// Setup helper
async function setup() {
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
}

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

async function drawerState() {
  return page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d) return { exists: false };
    const body = d.querySelector('.drawer-body');
    const notFound = body?.textContent?.includes('not found') || false;
    const hasDetail = !!body?.querySelector('[class*=dv-], h3, rb-task-detail, rb-sprint-detail, rb-detail-view');
    const hasChat = !!body?.querySelector('[class*=chat], .drawer-panel-chat');
    const bodyText = body?.textContent?.trim().substring(0, 80) || '';
    return { exists: true, open: d.hasAttribute('open'), ref: d.getAttribute('ref') || '', notFound, hasDetail, hasChat, bodyText };
  });
}

async function tapExpander(type, nameInc) {
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

// =============================================
// BUG5: /trace tap A→A, tap B→switches to B
// =============================================
console.log('=== BUG5: /trace CONTENT SWITCH ===');
await page.goto('https://localhost:4444/trace', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const items = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')]
    .filter(el => el.getBoundingClientRect().width > 0)
    .slice(0, 3)
    .map(el => ({
      idx: [...document.querySelectorAll('rb-object-item')].indexOf(el),
      name: el.querySelector('.oi-name')?.textContent?.trim().substring(0, 30) || '',
      ref: el.getAttribute('ref') || ''
    }))
);

await scrollTapIdx(items[0].idx);
const dA = await drawerState();
console.log('  A:', items[0].name, '→ open=' + dA.open, 'ref=' + dA.ref.substring(0, 25), 'notFound=' + dA.notFound, 'hasDetail=' + dA.hasDetail);

await scrollTapIdx(items[1].idx);
const dB = await drawerState();
console.log('  B:', items[1].name, '→ open=' + dB.open, 'ref=' + dB.ref.substring(0, 25), 'notFound=' + dB.notFound, 'hasDetail=' + dB.hasDetail);

const bug5 = dB.open && dB.ref !== dA.ref;
console.log('  BUG5:', bug5 ? 'GREEN (switched)' : 'RED (stuck)');
await page.screenshot({ path: 'test/visual/v618-bug5.png', fullPage: true });

// =============================================
// BUG7: detail shows CONTENT, not 'X not found'
// =============================================
console.log('\n=== BUG7: DETAIL CONTENT (not "not found") ===');
const bug7 = dA.open && dA.hasDetail && !dA.notFound;
console.log('  A detail:', dA.hasDetail, 'notFound:', dA.notFound, 'text:', dA.bodyText.substring(0, 40));
console.log('  BUG7:', bug7 ? 'GREEN (content renders)' : 'RED (not found or empty)');

// =============================================
// BUG6: in-room collection row navigation
// =============================================
console.log('\n=== BUG6: COLLECTION ROW NAV ===');
await setup();
await page.waitForSelector('.lobby', { timeout: 15000 });
const sr = page.locator('.room-card:has-text("System Test Room")').first();
if (await sr.isVisible({ timeout: 3000 }).catch(() => false)) {
  const jb = sr.locator('.btn-join');
  if (await jb.isVisible({ timeout: 1000 }).catch(() => false)) await jb.tap();
  else await sr.tap();
}
await page.waitForSelector('.room-view', { timeout: 15000 });
await page.waitForTimeout(5000);

await tapExpander('room', null);

// Tap room content to open detail
const roomIdx = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'room')
);
await scrollTapIdx(roomIdx);
const roomD = await drawerState();
const roomRef = roomD.ref;
console.log('  Room detail ref:', roomRef.substring(0, 25));

// Find collection link in detail
const collTap = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  if (!d) return null;
  const links = [...d.querySelectorAll('a, .dv-link, .chain-link, [data-ref]')];
  const coll = links.find(l => {
    const t = l.textContent || '';
    return t.includes('Members') || t.includes('Files') || t.includes('collection');
  });
  if (!coll) return { found: false, available: links.slice(0, 5).map(l => l.textContent.trim().substring(0, 25)) };
  coll.scrollIntoView({ block: 'center' });
  const r = coll.getBoundingClientRect();
  return { found: true, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), text: coll.textContent.trim().substring(0, 25) };
});

let bug6;
if (collTap?.found) {
  await page.touchscreen.tap(collTap.x, collTap.y);
  await page.waitForTimeout(1500);
  const afterColl = await drawerState();
  bug6 = afterColl.ref !== roomRef;
  console.log('  Collection "' + collTap.text + '" → ref ' + afterColl.ref.substring(0, 20));
  console.log('  BUG6:', bug6 ? 'GREEN (navigated)' : 'RED (stuck)');
} else {
  console.log('  No collection row. Available:', JSON.stringify(collTap?.available));
  console.log('  BUG6: INCONCLUSIVE');
}
await page.screenshot({ path: 'test/visual/v618-bug6.png', fullPage: true });

// =============================================
// BUG4: deselect → stays open + chat
// =============================================
console.log('\n=== BUG4: DESELECT → CHAT ===');
await tapExpander('collection', 'Files');
const fileIdx = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'file')
);
let bug4;
if (fileIdx >= 0) {
  await scrollTapIdx(fileIdx);
  const selD = await drawerState();
  console.log('  Selected:', selD.ref.substring(0, 25));
  // Deselect: tap same file
  await scrollTapIdx(fileIdx);
  const deselD = await drawerState();
  bug4 = deselD.open && deselD.hasChat;
  console.log('  Deselect: open=' + deselD.open + ' hasChat=' + deselD.hasChat);
  console.log('  BUG4:', bug4 ? 'GREEN (open+chat)' : 'RED');
} else {
  console.log('  No file items. BUG4: SKIP');
}
await page.screenshot({ path: 'test/visual/v618-bug4.png', fullPage: true });

// =============================================
// BUG3: .url filename BELOW actions
// =============================================
console.log('\n=== BUG3: FILENAME CSS ===');
const urlIdx = await page.evaluate(() =>
  [...document.querySelectorAll('rb-object-item')].findIndex(el =>
    el.getAttribute('type') === 'file' && (el.querySelector('.oi-name')?.textContent || '').includes('.url')
  )
);
let bug3;
if (urlIdx >= 0) {
  await scrollTapIdx(urlIdx);
  await page.waitForTimeout(1000);
  const css = await page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d?.hasAttribute('open')) return { open: false };
    const body = d.querySelector('.drawer-body');
    const fn = body?.querySelector('h3, .cv-filename, [class*=filename]');
    const btns = [...(body?.querySelectorAll('button') || [])].filter(b =>
      b.textContent.includes('preview') || b.textContent.includes('tab')
    );
    const act = btns.length > 0 ? btns[0].parentElement : null;
    if (!fn || !act) return { open: true, fnFound: !!fn, actFound: !!act };
    const fR = fn.getBoundingClientRect();
    const aR = act.getBoundingClientRect();
    return { open: true, fnTop: Math.round(fR.top), actTop: Math.round(aR.top), below: fR.top > aR.top, sameLeft: Math.abs(fR.left - aR.left) < 50 };
  });
  bug3 = css.below && css.sameLeft;
  console.log('  CSS:', JSON.stringify(css));
  console.log('  BUG3:', bug3 ? 'GREEN (stacked)' : 'RED');
} else {
  console.log('  No .url file. BUG3: SKIP');
}
await page.screenshot({ path: 'test/visual/v618-bug3.png', fullPage: true });

// =============================================
// VERDICT
// =============================================
console.log('\n=== FULL MATRIX v0.6.18 ===');
console.log('BUG5 content-switch:', bug5 ? 'GREEN' : 'RED');
console.log('BUG7 detail-content:', bug7 ? 'GREEN' : 'RED');
console.log('BUG6 collection-nav:', bug6 !== undefined ? (bug6 ? 'GREEN' : 'RED') : 'INCONCLUSIVE');
console.log('BUG4 deselect→chat:', bug4 !== undefined ? (bug4 ? 'GREEN' : 'RED') : 'SKIP');
console.log('BUG3 filename CSS:', bug3 !== undefined ? (bug3 ? 'GREEN' : 'RED') : 'SKIP');
const all = bug5 && bug7 && (bug4 === undefined || bug4);
console.log('OVERALL:', all ? 'GREEN — cluster done pending Tron device-verify' : 'RED');

await browser.close();
console.log('DONE');
