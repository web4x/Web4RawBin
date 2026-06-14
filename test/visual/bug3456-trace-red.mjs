import { webkit, devices } from '@playwright/test';

const iPhone = devices['iPhone 14'];
const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

// Helper: scrollIntoView + viewport tap
async function scrollTap(evalFn, label) {
  const scrolled = await page.evaluate(evalFn.scroll);
  if (!scrolled) { console.log('  ' + label + ': NOT FOUND'); return false; }
  await page.waitForTimeout(300);
  const pos = await page.evaluate(evalFn.pos);
  if (!pos) { console.log('  ' + label + ': LOST'); return false; }
  console.log('  ' + label + ': tap(' + pos.x + ',' + pos.y + ')');
  await page.touchscreen.tap(pos.x, pos.y);
  await page.waitForTimeout(1500);
  return true;
}

// Helper: measure drawer state
async function drawerState() {
  return page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d) return { exists: false };
    const open = d.hasAttribute('open');
    const ref = d.getAttribute('ref') || '';
    const mode = d.getAttribute('data-mode') || '';
    const body = d.querySelector('.drawer-body');
    const detailEl = body?.querySelector('[class*=detail], rb-task-detail, rb-sprint-detail, rb-requirement-detail, rb-class-detail, rb-detail-view, [class*=dv-head]');
    const chatEl = body?.querySelector('[class*=chat], .chat-messages, .drawer-panel-chat');
    const bodyText = body?.textContent?.trim().substring(0, 80) || '';
    const isEmpty = !body || body.children.length === 0 || bodyText.length < 5;
    return { exists: true, open, ref, mode, hasDetail: !!detailEl, detailTag: detailEl?.tagName || '', hasChat: !!chatEl, isEmpty, bodyText };
  });
}

// Navigate to /trace
await page.goto('https://localhost:4444/trace', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Get first two visible items (A and B)
const items = await page.evaluate(() => {
  return [...document.querySelectorAll('rb-object-item')]
    .filter(el => el.getBoundingClientRect().width > 0)
    .slice(0, 5)
    .map((el, i) => ({
      globalIdx: [...document.querySelectorAll('rb-object-item')].indexOf(el),
      type: el.getAttribute('type') || '',
      name: (el.querySelector('.oi-name') || {}).textContent?.trim().substring(0, 30) || '',
      ref: el.getAttribute('ref') || ''
    }));
});
console.log('Visible items:', JSON.stringify(items.slice(0, 3)));

const itemA = items[0];
const itemB = items.length > 1 ? items[1] : null;

// =============================================
// BUG5: tap A → detail A, tap B → detail B
// =============================================
console.log('\n=== BUG5: CONTENT SWITCH (A→B) ===');

// Tap item A
const tappedA = await scrollTap({
  scroll: `(function(){ var el=document.querySelectorAll('rb-object-item')[${itemA.globalIdx}]; if(el){el.scrollIntoView({block:'center'});return true} return false })()`,
  pos: `(function(){ var c=document.querySelectorAll('rb-object-item')[${itemA.globalIdx}]?.querySelector('.oi-content'); if(!c)return null; var r=c.getBoundingClientRect(); return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)} })()`
}, 'Item A (' + itemA.name + ')');

const afterA = await drawerState();
console.log('  After A:', JSON.stringify(afterA));
const a5_showsA = afterA.open && afterA.hasDetail && !afterA.isEmpty;
console.log('  A shows detail:', a5_showsA ? 'YES' : 'NO');
await page.screenshot({ path: 'test/visual/trace-bug5-A.png', fullPage: true });

// Tap item B
if (itemB) {
  const tappedB = await scrollTap({
    scroll: `(function(){ var el=document.querySelectorAll('rb-object-item')[${itemB.globalIdx}]; if(el){el.scrollIntoView({block:'center'});return true} return false })()`,
    pos: `(function(){ var c=document.querySelectorAll('rb-object-item')[${itemB.globalIdx}]?.querySelector('.oi-content'); if(!c)return null; var r=c.getBoundingClientRect(); return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)} })()`
  }, 'Item B (' + itemB.name + ')');

  const afterB = await drawerState();
  console.log('  After B:', JSON.stringify(afterB));
  const switched = afterB.open && afterB.ref !== afterA.ref && afterB.hasDetail;
  console.log('  Switched to B:', switched ? 'YES (ref changed)' : 'NO (stuck on A or closed)');
  console.log('  BUG5:', switched ? 'PASS' : 'RED (detail does not switch)');
  await page.screenshot({ path: 'test/visual/trace-bug5-B.png', fullPage: true });
}

// =============================================
// BUG6: tap child inside detail → navigates
// =============================================
console.log('\n=== BUG6: CHILD NAVIGATION ===');
// Check if detail has clickable child links
const childLink = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer');
  if (!d?.hasAttribute('open')) return null;
  const links = [...d.querySelectorAll('a.chain-link, .dv-link, [class*=chain-link], a[data-ref]')];
  if (links.length === 0) return null;
  const link = links[0];
  link.scrollIntoView({ block: 'center' });
  const r = link.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), text: link.textContent.trim().substring(0, 30), href: (link.getAttribute('href') || '').substring(0, 40) };
});

if (childLink) {
  console.log('  Child link found:', childLink.text);
  const refBefore = (await drawerState()).ref;
  await page.touchscreen.tap(childLink.x, childLink.y);
  await page.waitForTimeout(1500);
  const afterChild = await drawerState();
  const navigated = afterChild.open && afterChild.ref !== refBefore;
  console.log('  After child tap: ref=' + afterChild.ref + ' (was ' + refBefore + ')');
  console.log('  BUG6:', navigated ? 'PASS (navigated to child)' : 'RED (stuck, no navigation)');
} else {
  console.log('  No child links in current detail');
  console.log('  BUG6: RED (no clickable children)');
}
await page.screenshot({ path: 'test/visual/trace-bug6.png', fullPage: true });

// =============================================
// BUG4: deselect → drawer stays open + chat
// =============================================
console.log('\n=== BUG4: DESELECT → STAYS OPEN + CHAT ===');
// Tap empty area or clear selection
await page.evaluate(() => {
  // Try to deselect by tapping outside items
  const tree = document.querySelector('rb-trace-tree');
  if (tree) {
    tree.dispatchEvent(new CustomEvent('selection-cleared', { bubbles: true }));
  }
});
await page.waitForTimeout(1000);

// Alternatively: tap the same item again to deselect
const currentRef = (await drawerState()).ref;
if (currentRef) {
  const deselectIdx = await page.evaluate((ref) => {
    return [...document.querySelectorAll('rb-object-item')].findIndex(el => el.getAttribute('ref') === ref);
  }, currentRef);
  if (deselectIdx >= 0) {
    await scrollTap({
      scroll: `(function(){ var el=document.querySelectorAll('rb-object-item')[${deselectIdx}]; if(el){el.scrollIntoView({block:'center'});return true} return false })()`,
      pos: `(function(){ var c=document.querySelectorAll('rb-object-item')[${deselectIdx}]?.querySelector('.oi-content'); if(!c)return null; var r=c.getBoundingClientRect(); return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)} })()`
    }, 'Deselect (re-tap)');
  }
}

const afterDeselect = await drawerState();
console.log('  After deselect:', JSON.stringify(afterDeselect));
const bug4pass = afterDeselect.open && (afterDeselect.mode === 'chat' || afterDeselect.hasChat);
console.log('  BUG4:', bug4pass ? 'PASS (open + chat)' : 'RED (closed or not chat)');
await page.screenshot({ path: 'test/visual/trace-bug4.png', fullPage: true });

// =============================================
// BUG3: filename BELOW actions for URL file
// =============================================
console.log('\n=== BUG3: FILENAME LAYOUT ===');
// Navigate to a file detail if available
const fileItem = items.find(i => i.type === 'file');
if (fileItem) {
  await scrollTap({
    scroll: `(function(){ var el=document.querySelectorAll('rb-object-item')[${fileItem.globalIdx}]; if(el){el.scrollIntoView({block:'center'});return true} return false })()`,
    pos: `(function(){ var c=document.querySelectorAll('rb-object-item')[${fileItem.globalIdx}]?.querySelector('.oi-content'); if(!c)return null; var r=c.getBoundingClientRect(); return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)} })()`
  }, 'File item');

  const css = await page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d?.hasAttribute('open')) return { open: false };
    const body = d.querySelector('.drawer-body');
    const fn = body?.querySelector('h3, .cv-filename, [class*=filename]');
    const btns = [...(body?.querySelectorAll('button') || [])].filter(b =>
      b.textContent.includes('preview') || b.textContent.includes('tab') || b.textContent.includes('Preview')
    );
    const act = btns.length > 0 ? btns[0].parentElement : null;
    if (!fn || !act) return { open: true, fnFound: !!fn, actFound: !!act };
    const fnR = fn.getBoundingClientRect();
    const actR = act.getBoundingClientRect();
    return { open: true, fnTop: Math.round(fnR.top), actTop: Math.round(actR.top), fnLeft: Math.round(fnR.left), actLeft: Math.round(actR.left), below: fnR.top > actR.top, sameLeft: Math.abs(fnR.left - actR.left) < 50 };
  });
  console.log('  CSS layout:', JSON.stringify(css));
  const bug3pass = css.below && css.sameLeft;
  console.log('  BUG3:', bug3pass ? 'PASS (stacked)' : 'RED (not below/beside)');
} else {
  console.log('  No file items on /trace — BUG3: SKIP (no file on this surface)');
}
await page.screenshot({ path: 'test/visual/trace-bug3.png', fullPage: true });

// =============================================
// SUMMARY
// =============================================
console.log('\n=== RED-4 SUMMARY v0.6.10 (/trace surface) ===');
console.log('BUG5 (content-switch A→B): see above');
console.log('BUG6 (child navigation): see above');
console.log('BUG4 (deselect→chat): see above');
console.log('BUG3 (filename CSS): see above');

await browser.close();
console.log('DONE');
