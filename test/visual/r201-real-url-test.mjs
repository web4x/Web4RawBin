import { webkit, devices } from '@playwright/test';

const iPhone = devices['iPhone 14'];
const browser = await webkit.launch({ headless: false });
const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
  await page.fill('#pe-name', 'RealUrl');
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

// Join md-safari room 440ccc82
await page.evaluate(() => {
  for (const c of document.querySelectorAll('.room-card')) {
    if ((c.getAttribute('data-room-id') || '').startsWith('440ccc82')) {
      const btn = c.querySelector('.btn-join, button');
      if (btn) btn.click();
      return;
    }
  }
});
await page.waitForSelector('.room-view', { timeout: 15000 });
await page.waitForTimeout(5000);

// List all .url files
const urlFiles = await page.evaluate(() => {
  return [...document.querySelectorAll('rb-object-item')]
    .map((el, i) => ({ type: el.getAttribute('type'), name: el.querySelector('.oi-name')?.textContent?.trim() || '', globalIdx: i }))
    .filter(x => x.type === 'file' && x.name.includes('.url'));
});
console.log('URL FILES:', JSON.stringify(urlFiles));

for (const uf of urlFiles) {
  console.log(`\n=== ${uf.name} (idx=${uf.globalIdx}) ===`);

  // Close drawer
  await page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.removeAttribute('open'); d.removeAttribute('ref'); } });
  await page.waitForTimeout(300);

  // Scroll + tap
  await page.evaluate(idx => document.querySelectorAll('rb-object-item')[idx]?.scrollIntoView({ block: 'center' }), uf.globalIdx);
  await page.waitForTimeout(300);
  const pos = await page.evaluate(idx => {
    const c = document.querySelectorAll('rb-object-item')[idx]?.querySelector('.oi-content');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, uf.globalIdx);
  if (!pos) { console.log('  SKIP: no content'); continue; }

  await page.touchscreen.tap(pos.x, pos.y);
  await page.waitForTimeout(1500);

  // Measure drawer
  const dr = await page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d) return { open: false };
    const btns = [...d.querySelectorAll('button')].map(b => b.textContent.trim());
    const links = [...d.querySelectorAll('a')].map(a => ({ text: a.textContent.trim().substring(0, 40), href: (a.getAttribute('href') || '').substring(0, 80) }));
    return { open: d.hasAttribute('open'), ref: d.getAttribute('ref') || '', btns, links, html: d.innerHTML.substring(0, 400) };
  });

  console.log('  A1 drawer open:', dr.open);
  console.log('  Buttons:', JSON.stringify(dr.btns));
  console.log('  Links:', JSON.stringify(dr.links));

  // Test "Open in preview"
  if (dr.open) {
    const previewPos = await page.evaluate(() => {
      const d = document.querySelector('rb-detail-drawer');
      const btn = [...d.querySelectorAll('button')].find(b => b.textContent.includes('preview'));
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
    if (previewPos) {
      await page.touchscreen.tap(previewPos.x, previewPos.y);
      await page.waitForTimeout(2000);
      const preview = await page.evaluate(() => {
        const iframe = document.querySelector('iframe');
        const preview = document.querySelector('.file-preview, [class*=preview]');
        return { hasIframe: !!iframe, src: iframe?.src?.substring(0, 80) || '', hasPreview: !!preview, url: location.href.substring(0, 80) };
      });
      console.log('  A2 preview:', JSON.stringify(preview));
    } else {
      console.log('  A2 preview: NO BUTTON');
    }

    // Test "Open in new tab"
    const ntPos = await page.evaluate(() => {
      const d = document.querySelector('rb-detail-drawer');
      const btn = [...d.querySelectorAll('button')].find(b => b.textContent.includes('new tab'));
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
    if (ntPos) {
      const newPageP = ctx.waitForEvent('page', { timeout: 3000 }).catch(() => null);
      await page.touchscreen.tap(ntPos.x, ntPos.y);
      const newPage = await newPageP;
      console.log('  A3 new-tab:', newPage ? 'OPENED url=' + newPage.url().substring(0, 80) : 'DID NOT OPEN');
      if (newPage) await newPage.close();
    } else {
      console.log('  A3 new-tab: NO BUTTON');
    }
  }

  await page.screenshot({ path: `test/visual/s20-real-${uf.name.replace(/[^a-z0-9]/gi, '_')}.png`, fullPage: true });
}

console.log('\n=== SUMMARY ===');
console.log('DONE');
await browser.close();
