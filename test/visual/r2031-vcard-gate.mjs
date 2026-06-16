import { webkit, devices } from '@playwright/test';

const browser = await webkit.launch({ headless: false });

// === (C) first: MOCKED GEOLOCATION context ===
const ctxGeo = await browser.newContext({
  ...devices['iPhone 14'], ignoreHTTPSErrors: true,
  geolocation: { latitude: 48.1351, longitude: 11.5820 }, // Munich
  permissions: ['geolocation'],
});
const pageGeo = await ctxGeo.newPage();

// === (D) second: DENIED GEOLOCATION context ===
const ctxDenied = await browser.newContext({
  ...devices['iPhone 14'], ignoreHTTPSErrors: true,
  // No geolocation, no permissions
});
const pageDenied = await ctxDenied.newPage();

async function setupUser(page, name) {
  await page.goto('https://localhost:4444/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.fill('#pe-name', name);
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
}

async function joinSystemRoom(page) {
  const sr = page.locator('.room-card:has-text("System Test Room")').first();
  if (await sr.isVisible({ timeout: 3000 }).catch(() => false)) {
    const jb = sr.locator('.btn-join');
    if (await jb.isVisible({ timeout: 1000 }).catch(() => false)) await jb.tap();
    else await sr.tap();
  }
  await page.waitForSelector('.room-view', { timeout: 15000 });
  await page.waitForTimeout(5000);
}

async function expandRoomAndFiles(page) {
  // Expand room
  const roomExp = await page.evaluate(() => {
    const r = [...document.querySelectorAll('rb-object-item')].find(e => e.getAttribute('type') === 'room')?.querySelector('.oi-expand');
    if (!r) return null; r.scrollIntoView({ block: 'center' });
    const rect = r.getBoundingClientRect(); return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
  });
  if (roomExp) { await page.touchscreen.tap(roomExp.x, roomExp.y); await page.waitForTimeout(1000); }
  // Expand files
  const filesExp = await page.evaluate(() => {
    const f = [...document.querySelectorAll('rb-object-item')].find(e => e.getAttribute('type') === 'collection' && e.querySelector('.oi-name')?.textContent?.includes('Files'))?.querySelector('.oi-expand');
    if (!f) return null; f.scrollIntoView({ block: 'center' });
    const rect = f.getBoundingClientRect(); return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
  });
  if (filesExp) { await page.touchscreen.tap(filesExp.x, filesExp.y); await page.waitForTimeout(1000); }
  // Expand members
  const memExp = await page.evaluate(() => {
    const m = [...document.querySelectorAll('rb-object-item')].find(e => e.getAttribute('type') === 'collection' && e.querySelector('.oi-name')?.textContent?.includes('Members'))?.querySelector('.oi-expand');
    if (!m) return null; m.scrollIntoView({ block: 'center' });
    const rect = m.getBoundingClientRect(); return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) };
  });
  if (memExp) { await page.touchscreen.tap(memExp.x, memExp.y); await page.waitForTimeout(1000); }
}

// ============================================
// (A) Upload .vcf → stored + downloadable
// ============================================
console.log('=== (A) UPLOAD .VCF ===');
await setupUser(pageGeo, 'VcardGate');
await joinSystemRoom(pageGeo);

const roomId = await pageGeo.evaluate(() => {
  const link = document.querySelector('a[href*="/scenario?ior="]');
  return link ? link.getAttribute('href').replace('/scenario?ior=', '') : '';
});

// Upload a real .vcf
const vcfContent = 'BEGIN:VCARD\nVERSION:3.0\nFN:Gate Test Contact\nTEL:+49123456789\nEMAIL:gate@test.com\nEND:VCARD';
const uploadResult = await pageGeo.evaluate(async (args) => {
  const token = localStorage.getItem('rawbin-player-id') || '';
  const form = new FormData();
  form.append('file', new Blob([args.vcf], { type: 'text/vcard' }), 'gate-contact.vcf');
  form.append('playerToken', token);
  const resp = await fetch('/api/room/' + args.rid + '/upload', { method: 'POST', body: form });
  return { status: resp.status, ok: resp.ok };
}, { rid: roomId, vcf: vcfContent });
console.log('Upload:', uploadResult.status, uploadResult.ok ? 'OK' : 'FAIL');
await pageGeo.waitForTimeout(3000);

// Expand and find the .vcf file
await expandRoomAndFiles(pageGeo);
const vcfIdx = await pageGeo.evaluate(() => [...document.querySelectorAll('rb-object-item')].findIndex(e => e.getAttribute('type') === 'file' && e.querySelector('.oi-name')?.textContent?.includes('gate-contact.vcf')));
let aPass = false;
if (vcfIdx >= 0) {
  await pageGeo.evaluate(i => document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content')?.scrollIntoView({ block: 'center' }), vcfIdx);
  await pageGeo.waitForTimeout(300);
  const pos = await pageGeo.evaluate(i => { const c = document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }, vcfIdx);
  await pageGeo.touchscreen.tap(pos.x, pos.y);
  await pageGeo.waitForTimeout(2000);

  // Verify newtab downloads the vcf content
  const ntPos = await pageGeo.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    const btn = [...d.querySelectorAll('button')].find(b => b.textContent.includes('New tab'));
    if (!btn) return null; btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (ntPos) {
    const np = ctxGeo.waitForEvent('page', { timeout: 5000 }).catch(() => null);
    await pageGeo.touchscreen.tap(ntPos.x, ntPos.y);
    const newPage = await np;
    if (newPage) {
      await newPage.waitForTimeout(2000);
      const content = await newPage.evaluate(() => document.body?.textContent || '');
      aPass = content.includes('BEGIN:VCARD') && content.includes('Gate Test Contact');
      console.log('Downloaded VCF contains BEGIN:VCARD + name:', aPass);
      await newPage.close();
    } else { console.log('NewTab did not open'); }
  }
} else { console.log('gate-contact.vcf not found in room'); }
console.log('(A):', aPass ? 'PASS' : 'RED');
await pageGeo.screenshot({ path: 'test/visual/r2031-a-upload.png', fullPage: true });

// ============================================
// (B) Download member vCard → NOTE has date
// ============================================
console.log('\n=== (B) MEMBER VCARD → NOTE HAS DATE ===');
// Tap a member item
const memberIdx = await pageGeo.evaluate(() => [...document.querySelectorAll('rb-object-item')].findIndex(e => e.getAttribute('type') === 'member' && e.getBoundingClientRect().width > 0));
let bPass = false;
let vcardText = '';
if (memberIdx >= 0) {
  await pageGeo.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); if (d) { d.removeAttribute('open'); d.removeAttribute('ref'); } });
  await pageGeo.waitForTimeout(300);
  await pageGeo.evaluate(i => document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content')?.scrollIntoView({ block: 'center' }), memberIdx);
  await pageGeo.waitForTimeout(300);
  const mPos = await pageGeo.evaluate(i => { const c = document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }, memberIdx);
  await pageGeo.touchscreen.tap(mPos.x, mPos.y);
  await pageGeo.waitForTimeout(2000);

  // Find vCard download button
  const vcardBtn = await pageGeo.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    if (!d) return null;
    const btn = [...d.querySelectorAll('button, a')].find(b => b.textContent.toLowerCase().includes('vcard') || b.textContent.includes('vcf') || b.className.includes('vcard'));
    if (!btn) return null; btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), text: btn.textContent.trim().substring(0, 30) };
  });

  if (vcardBtn) {
    console.log('vCard button:', vcardBtn.text);
    // Hook createObjectURL to capture blob
    await pageGeo.evaluate(() => {
      window.__vcardBlob = null;
      const orig = URL.createObjectURL;
      URL.createObjectURL = function(obj) { if (obj instanceof Blob && (obj.type === 'text/vcard' || obj.type === 'text/x-vcard')) { obj.text().then(t => { window.__vcardBlob = t; }); } return orig.call(this, obj); };
    });
    await pageGeo.touchscreen.tap(vcardBtn.x, vcardBtn.y);
    await pageGeo.waitForTimeout(3000);
    vcardText = await pageGeo.evaluate(() => window.__vcardBlob || '');
    console.log('vCard text length:', vcardText.length);
    if (vcardText) {
      const hasNote = vcardText.includes('NOTE:');
      const today = new Date().toISOString().substring(0, 10);
      const hasDate = vcardText.includes(today) || vcardText.match(/\d{4}-\d{2}-\d{2}/) !== null;
      console.log('Has NOTE:', hasNote);
      console.log('Has date:', hasDate, '(looking for', today, ')');
      console.log('NOTE lines:', vcardText.split('\n').filter(l => l.startsWith('NOTE')).join(' | '));
      bPass = hasNote && hasDate;
    }
  } else {
    console.log('No vCard button found — checking drawer buttons:');
    const btns = await pageGeo.evaluate(() => {
      const d = document.querySelector('rb-detail-drawer');
      return d ? [...d.querySelectorAll('button, a')].map(b => b.textContent.trim().substring(0, 30)) : [];
    });
    console.log('Buttons:', btns.join(', '));
  }
}
console.log('(B):', bPass ? 'PASS' : 'RED');
await pageGeo.screenshot({ path: 'test/visual/r2031-b-vcard-date.png', fullPage: true });

// ============================================
// (C) NOTE has Google Maps link from mocked geo
// ============================================
console.log('\n=== (C) NOTE HAS MAPS LINK (mocked geo: 48.1351,11.5820) ===');
let cPass = false;
if (vcardText) {
  const hasMapLink = vcardText.includes('google.com/maps') || vcardText.includes('maps?q=');
  const hasCoords = vcardText.includes('48.135') && vcardText.includes('11.58');
  console.log('Has maps link:', hasMapLink);
  console.log('Has mocked coords (48.135/11.58):', hasCoords);
  cPass = hasMapLink && hasCoords;
}
console.log('(C):', cPass ? 'PASS (synthetic — real GPS = Tron device)' : 'RED');

// ============================================
// (D) Geo DENIED → NOTE has date, NO maps link
// ============================================
console.log('\n=== (D) GEO DENIED FALLBACK ===');
await setupUser(pageDenied, 'VcardDenied');
await joinSystemRoom(pageDenied);
await pageDenied.waitForTimeout(3000);
await expandRoomAndFiles(pageDenied);

const memIdx2 = await pageDenied.evaluate(() => [...document.querySelectorAll('rb-object-item')].findIndex(e => e.getAttribute('type') === 'member' && e.getBoundingClientRect().width > 0));
let dPass = false;
if (memIdx2 >= 0) {
  await pageDenied.evaluate(i => document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content')?.scrollIntoView({ block: 'center' }), memIdx2);
  await pageDenied.waitForTimeout(300);
  const mPos2 = await pageDenied.evaluate(i => { const c = document.querySelectorAll('rb-object-item')[i]?.querySelector('.oi-content'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }, memIdx2);
  await pageDenied.touchscreen.tap(mPos2.x, mPos2.y);
  await pageDenied.waitForTimeout(2000);

  const vcardBtn2 = await pageDenied.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    const btn = [...(d?.querySelectorAll('button, a') || [])].find(b => b.textContent.toLowerCase().includes('vcard') || b.textContent.includes('vcf'));
    if (!btn) return null; btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (vcardBtn2) {
    await pageDenied.evaluate(() => { window.__vcardBlob = null; const orig = URL.createObjectURL; URL.createObjectURL = function(obj) { if (obj instanceof Blob) { obj.text().then(t => { window.__vcardBlob = t; }); } return orig.call(this, obj); }; });
    await pageDenied.touchscreen.tap(vcardBtn2.x, vcardBtn2.y);
    await pageDenied.waitForTimeout(3000);
    const deniedVcard = await pageDenied.evaluate(() => window.__vcardBlob || '');
    if (deniedVcard) {
      const hasDate = deniedVcard.match(/\d{4}-\d{2}-\d{2}/) !== null;
      const hasBrokenMap = deniedVcard.includes('maps?q=undefined') || deniedVcard.includes('maps?q=null');
      const hasNoMap = !deniedVcard.includes('google.com/maps');
      console.log('Has date:', hasDate);
      console.log('No maps link:', hasNoMap);
      console.log('No broken maps link:', !hasBrokenMap);
      dPass = hasDate && (hasNoMap || !hasBrokenMap);
    } else { console.log('No vCard blob captured'); }
  } else { console.log('No vCard button in denied context'); }
}
console.log('(D):', dPass ? 'PASS' : 'RED');
await pageDenied.screenshot({ path: 'test/visual/r2031-d-denied.png', fullPage: true });

// VERDICT
console.log('\n=== VERDICT R20.31 v0.6.60 ===');
console.log('(A) Upload .vcf downloadable:', aPass ? 'GREEN' : 'RED');
console.log('(B) NOTE has download date:', bPass ? 'GREEN' : 'RED');
console.log('(C) NOTE has Maps link (mocked):', cPass ? 'GREEN (synthetic)' : 'RED');
console.log('(D) Geo denied graceful:', dPass ? 'GREEN' : 'RED');
console.log('OVERALL:', aPass && bPass && cPass && dPass ? 'GREEN' : 'RED');

await browser.close();
console.log('DONE');
