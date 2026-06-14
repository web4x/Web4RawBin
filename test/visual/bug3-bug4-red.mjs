import { webkit, devices } from '@playwright/test';

const iPhone = devices['iPhone 14'];
const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

// Setup
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

// Expand room + files
async function tapExpander(type, nameIncludes) {
  const pos = await page.evaluate(({ type, nameIncludes }) => {
    const items = [...document.querySelectorAll('rb-object-item')];
    const item = items.find(el => {
      if (el.getAttribute('type') !== type) return false;
      if (nameIncludes && !(el.querySelector('.oi-name')?.textContent || '').includes(nameIncludes)) return false;
      return true;
    });
    if (!item || item.hasAttribute('children-open')) return null;
    const exp = item.querySelector('.oi-expand');
    if (!exp) return null;
    exp.scrollIntoView({ block: 'center' });
    const r = exp.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, { type, nameIncludes });
  if (pos) { await page.touchscreen.tap(pos.x, pos.y); await page.waitForTimeout(1000); }
}

await tapExpander('room', null);
await tapExpander('collection', 'Files');

// Helper: tap file content
async function tapFile() {
  const idx = await page.evaluate(() =>
    [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('type') === 'file')
  );
  if (idx < 0) return false;
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

// === BUG3: filename stacked BELOW actions ===
console.log('=== BUG3: FILENAME LAYOUT ===');
await tapFile();

const layout = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  if (!d?.hasAttribute('open')) return { open: false };
  const body = d.querySelector('.drawer-body');
  if (!body) return { open: true, noBody: true };

  // Find filename element (h3, .cv-filename, or first heading in detail)
  const filename = body.querySelector('h3, .cv-filename, .dv-filename, [class*=filename]');
  // Find action buttons container
  const btns = [...body.querySelectorAll('button')].filter(b =>
    b.textContent.includes('preview') || b.textContent.includes('tab') || b.textContent.includes('Preview')
  );
  const actions = btns.length > 0 ? btns[0].parentElement : null;

  if (!filename || !actions) {
    return { open: true, fnFound: !!filename, actFound: !!actions, bodyHTML: body.innerHTML.substring(0, 400) };
  }

  const fnRect = filename.getBoundingClientRect();
  const actRect = actions.getBoundingClientRect();

  return {
    open: true,
    fnText: filename.textContent.trim().substring(0, 30),
    fnTop: Math.round(fnRect.top), fnLeft: Math.round(fnRect.left),
    actTop: Math.round(actRect.top), actLeft: Math.round(actRect.left),
    fnBelowAct: fnRect.top > actRect.top,
    sameLeft: Math.abs(fnRect.left - actRect.left) < 50
  };
});

console.log('  Layout:', JSON.stringify(layout));
const bug3Red = layout.open && layout.fnTop !== undefined && !layout.fnBelowAct;
// Assert: filename SHOULD be below actions (stacked). Currently beside = RED.
console.log('  filename.top:', layout.fnTop, 'actions.top:', layout.actTop);
console.log('  BUG3:', layout.fnBelowAct && layout.sameLeft ? 'PASS (stacked)' : 'RED (not stacked below)');
await page.screenshot({ path: 'test/visual/v610-bug3.png', fullPage: true });

// === BUG4: DESELECT flow ===
console.log('\n=== BUG4: DESELECT FLOW ===');

// Close drawer first
await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  if (d) { d.removeAttribute('open'); d.removeAttribute('ref'); }
});
await page.waitForTimeout(500);

// Step 1: Open drawer (should default to chat in room)
// Tap the grab bar / bottom area to open
const handlePos = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  const handle = d?.querySelector('.drawer-handle, .drawer-handle-bar, [class*=handle-bar]');
  if (handle) {
    const r = handle.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }
  return { x: 195, y: 830 };
});
await page.touchscreen.tap(handlePos.x, handlePos.y);
await page.waitForTimeout(1000);

const s1 = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  return { open: d?.hasAttribute('open'), mode: d?.getAttribute('data-mode') || 'unknown' };
});
console.log('  Step 1 (open chat):', JSON.stringify(s1));

// Step 2: Select file -> detail mode
await tapFile();
const s2 = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  return { open: d?.hasAttribute('open'), mode: d?.getAttribute('data-mode') || 'unknown' };
});
console.log('  Step 2 (select->detail):', JSON.stringify(s2));

// Step 3: Deselect (tap same file again)
const filePos = await page.evaluate(() => {
  const items = [...document.querySelectorAll('rb-object-item')];
  const file = items.find(el => el.getAttribute('type') === 'file');
  if (!file) return null;
  const c = file.querySelector('.oi-content');
  if (!c) return null;
  c.scrollIntoView({ block: 'center' });
  const r = c.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
if (filePos) {
  await page.touchscreen.tap(filePos.x, filePos.y);
  await page.waitForTimeout(1500);
}

const s3 = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  const hasChat = !!d?.querySelector('[class*=chat], [class*=message], .chat-messages');
  const hasInput = !!d?.querySelector('input[type=text], textarea, [class*=chat-input]');
  return { open: d?.hasAttribute('open'), mode: d?.getAttribute('data-mode') || 'unknown', hasChat, hasInput };
});
console.log('  Step 3 (deselect):', JSON.stringify(s3));

// BUG4: drawer should STAY OPEN + switch to chat mode
const bug4Pass = s3.open && (s3.mode === 'chat' || s3.hasChat);
console.log('  BUG4:', bug4Pass ? 'PASS (stays open in chat)' : 'RED (drawer closed or not chat mode)');
await page.screenshot({ path: 'test/visual/v610-bug4.png', fullPage: true });

// === SUMMARY ===
console.log('\n=== RED-FIRST SUMMARY v0.6.10 ===');
console.log('BUG3 (filename below actions):', layout.fnBelowAct && layout.sameLeft ? 'already fixed' : 'RED confirmed');
console.log('BUG4 (deselect stays chat):', bug4Pass ? 'already fixed' : 'RED confirmed');

await browser.close();
console.log('DONE');
