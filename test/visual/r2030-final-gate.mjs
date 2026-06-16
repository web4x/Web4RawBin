import { webkit, devices } from '@playwright/test';
const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...devices['iPhone 14'], ignoreHTTPSErrors: true });
const page = await ctx.newPage();

await page.goto('https://localhost:4444/trace#class.show?uuid=0dd08b2f-30ba-433f-a9de-285065f3fb8e', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(10000);

for (let det = 1; det <= 3; det++) {
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d || !d.hasAttribute('open')) return { open: false };
    const hs = [...d.querySelectorAll('h3,h4')];
    const after = h => { const items = []; let n = h?.nextElementSibling; while (n && n.tagName !== 'H4' && n.tagName !== 'H3') { items.push({ text: n.textContent?.trim().substring(0, 80) || '', class: n.className?.substring(0, 30) || '' }); n = n.nextElementSibling; } return items; };
    const chainH = hs.find(h => h.textContent.includes('Traceability Chain'));
    const childH = hs.find(h => h.textContent.includes('All Children'));
    const chain = chainH ? after(chainH) : [];
    const children = childH ? after(childH) : [];
    const empty = chain.length <= 1 && (chain.length === 0 || chain[0].text === 'No chain' || chain[0].text.includes('Loading'));
    const types = chain.map(c => {
      if (c.text.includes('Method')) return 'Method';
      if (c.text.includes('Impl') || c.text.includes('implementation')) return 'Impl';
      if (c.text.includes('Test') || c.text.includes('test:')) return 'Test';
      return c.text.substring(0, 20);
    });
    return { open: true, depth: chain.length, empty, chain, types, childCount: children.length, children: children.slice(0, 5), differs: JSON.stringify(chain) !== JSON.stringify(children), title: hs[0]?.textContent?.trim().substring(0, 50) || '' };
  });

  if (det === 1) {
    console.log('=== RbDetailDrawer CLASS v0.6.59 DET-1 ===');
    console.log('Title:', m.title);
    console.log('Chain depth:', m.depth, 'empty:', m.empty);
    console.log('Chain types:', JSON.stringify(m.types));
    for (const c of m.chain) console.log('  CHAIN:', c.text);
    console.log('Children:', m.childCount);
    for (const ch of m.children) console.log('  CHILD:', ch.text);
    console.log('Differs:', m.differs);
    const hasM = m.types.includes('Method'), hasI = m.types.includes('Impl'), hasT = m.types.includes('Test');
    console.log('A1 Method->Impl->Test:', hasM && hasI && hasT ? 'PASS' : 'RED (M=' + hasM + ' I=' + hasI + ' T=' + hasT + ')');
    console.log('A2 differs:', m.differs ? 'PASS' : 'RED');
  } else {
    console.log('DET-' + det + ': depth=' + m.depth + ' empty=' + m.empty + ' types=' + JSON.stringify(m.types));
  }
}

await page.screenshot({ path: 'test/visual/r2030-v659-final.png', fullPage: true });

// Spot-check tests via API
console.log('\n=== SPOT-CHECK TEST WIRING (API) ===');
const api = await page.evaluate(async () => {
  const r = await fetch('/api/trace'); const data = await r.json();
  const tests = (data.objects || []).filter(o => o.type === 'test');
  const impls = (data.objects || []).filter(o => o.type === 'implementation');
  const samples = [];
  for (const t of tests.slice(0, 3)) {
    const linked = impls.find(impl => impl.tests?.includes('ior:instance:' + t.uuid));
    samples.push({ test: t.title?.substring(0, 50), impl: linked?.title?.substring(0, 50) || 'NOT LINKED' });
  }
  return { tests: tests.length, impls: impls.length, samples };
});
console.log(api.tests + ' tests, ' + api.impls + ' impls');
for (const s of api.samples) { console.log('  Test:', s.test); console.log('  Impl:', s.impl); console.log(''); }

// Final
const fm = await page.evaluate(() => {
  const d = document.querySelector('rb-detail-drawer'); if (!d) return {};
  const chainH = [...d.querySelectorAll('h4')].find(h => h.textContent.includes('Traceability Chain'));
  if (!chainH) return { empty: true };
  const items = []; let n = chainH.nextElementSibling;
  while (n && n.tagName !== 'H4' && n.tagName !== 'H3') { items.push(n.textContent?.trim() || ''); n = n.nextElementSibling; }
  const empty = items.length <= 1 && (!items[0] || items[0] === 'No chain' || items[0].includes('Loading'));
  return { depth: items.length, empty, method: items.some(t => t.includes('Method')), impl: items.some(t => t.includes('Impl') || t.includes('implementation')), test: items.some(t => t.includes('Test') || t.includes('test:')) };
});
console.log('\n=== FINAL VERDICT v0.6.59 ===');
console.log('depth=' + fm.depth + ' M=' + fm.method + ' I=' + fm.impl + ' T=' + fm.test);
const green = !fm.empty && fm.method && fm.impl && fm.test;
console.log('v0.6.57 RED baseline: depth=1 Loading...');
console.log('OVERALL:', green ? 'GREEN — chain descends Class->Method->Impl->Test' : 'RED');

await browser.close();
