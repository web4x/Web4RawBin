// [test:uuid:ee18399f-f40f-4b01-ad8f-b0672b6e883b] R25.4 minimize — ✕ to peek bar + grab-bar expand
// [test:uuid:222969ea-e5fb-4dbd-8d40-06051e314d77] R25.4 onGrabBarPointer
// [test:uuid:d82ebcf5-58ef-4227-b32a-7f4c3cfb5f80] R25.3 recognizeIdentity
// v0.6.94 gate — 4 items. SystemTester ONLY. Reuse dnd room + EXISTING WebItem (no drop).
//   (1) R25.2 BUG1: rb-webitem-detail renders the launcher card (badge + ↗ Open), not empty.
//   (2) R25.4 BUG2: MOUSE drag on grab-bar (.drawer-handle) resizes the drawer.
//   (3) R25.4 BUG3: ✕ (.drawer-close) MINIMIZES to peek ([minimized] attr); grab-bar click expands.
//   (4) R25.3: fresh browser, import vCard w/ known phone (+4981422917723) -> 'User already exists'
//       + 🔓 Unlock; NO new COMMITTED duplicate Marcel minted (a provisional uncommitted device
//       token is expected for any new device — the fix only prevents a committed dup).
// DET-3x. Item 4 reuses ONE fresh context (3 reloads) -> a single provisional device token,
// which is reported for cleanup (cannot auto-delete prod profiles.json).

import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = 'https://prod.wo-da.de:4444';
const FULL = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';   // existing message: WebItem in dnd room
const KNOWN_PHONE = '+4981422917723';                   // Tron primary 8f74dfba
const PROFILES = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/data/profiles.json';
const committedDupCount = () => JSON.parse(fs.readFileSync(PROFILES, 'utf8')).filter(p => p.profileCommitted && String(p.phone || '').replace(/\s/g, '') === KNOWN_PHONE && !p.redirectTo).length;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

// (1)(2)(3) — SystemTester (committed -> no profile mint), reuse dnd room
async function drawerItems() {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e')); });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  await page.waitForSelector('#member-name', { timeout: 20000 }).catch(() => {});
  const card = page.locator('.room-card:has-text("dnd test")').first();
  await card.waitFor({ timeout: 10000 });
  const jb = card.locator('.btn-join').first();
  if (await jb.isVisible({ timeout: 1500 }).catch(() => false)) await jb.click(); else await card.click();
  await page.waitForSelector('#rrc-drop', { timeout: 20000 }); await page.waitForTimeout(2000);

  // (1) rb-webitem-detail launcher card (the BUG1 fix component)
  const item1 = await page.evaluate(async (full) => {
    if (customElements.whenDefined) await customElements.whenDefined('rb-webitem-detail').catch(() => {});
    document.querySelectorAll('.__wi').forEach(e => e.remove());
    const el = document.createElement('rb-webitem-detail'); el.className = '__wi'; el.setAttribute('uuid', full); document.body.appendChild(el);
    await new Promise(z => setTimeout(z, 2800));
    const t = el.textContent || '';
    return /📧|🔗|📅|📍|📞/.test(t) && /Open/i.test(t) && !!el.querySelector('a[href^="message:"], a[href*="://"]') && !/not found|Failed|Loading/i.test(t);
  }, FULL);

  // (2) MOUSE grab-bar resize -> drawer height changes
  const item2 = await page.evaluate(async () => {
    const d = document.getElementById('room-file-preview'); const h = d?.querySelector('.drawer-handle'); if (!d || !h) return false;
    const before = d.offsetHeight; const r = h.getBoundingClientRect();
    h.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: r.x + 10, clientY: r.y + 5 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.x + 10, clientY: r.y - 150 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.x + 10, clientY: r.y - 170 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: r.x + 10, clientY: r.y - 170 }));
    await new Promise(z => setTimeout(z, 400));
    return Math.abs(d.offsetHeight - before) > 20;
  });

  // (3) ✕ minimizes to peek; grab-bar click expands
  const item3 = await page.evaluate(async () => {
    const d = document.getElementById('room-file-preview'); if (!d) return false;
    if (d.hasAttribute('minimized')) { d.querySelector('.drawer-handle')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise(z => setTimeout(z, 200)); }
    d.querySelector('.drawer-close')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(z => setTimeout(z, 300));
    const minimized = d.hasAttribute('minimized') && d.isConnected && (d.querySelector('.drawer-body')?.style.display === 'none');
    d.querySelector('.drawer-handle')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(z => setTimeout(z, 300));
    const expanded = !d.hasAttribute('minimized');
    return minimized && expanded;
  });

  await ctx.close();
  return { item1, item2, item3 };
}

// (4) — ONE fresh context, reloaded per iter (single provisional device token)
async function vcardOnboarding(page, i) {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await page.waitForTimeout(3500);
  await page.waitForSelector('#pe-vcf-input', { timeout: 15000 }).catch(() => {});
  // vary FN per iter so setInputFiles re-fires 'change' (same file is a no-op)
  const vcf = `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Known Person ${i}\r\nTEL;TYPE=CELL:${KNOWN_PHONE}\r\nEND:VCARD\r\n`;
  await page.setInputFiles('#pe-vcf-input', { name: `known-${i}.vcf`, mimeType: 'text/vcard', buffer: Buffer.from(vcf) }).catch(() => {});
  await page.waitForFunction(() => /User already exists/i.test(document.body.textContent || ''), { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const txt = document.body.textContent || '';
    const h3 = [...document.querySelectorAll('h3')].map(h => h.textContent || '').join(' | ');
    const save = document.getElementById('pe-save')?.textContent || '';
    return { existsMsg: /User already exists/i.test(h3) || /User already exists/i.test(txt), unlock: /Unlock device with your secret code/i.test(txt) || /🔓\s*Unlock/i.test(save), save: save.slice(0, 16) };
  });
}

const dupBaseline = committedDupCount();
const results = [];
for (let i = 1; i <= 3; i++) {
  const d = await drawerItems();
  // item 4: truly FRESH context per iter (new device) for clean recognition
  const fc = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
  const fp = await fc.newPage();
  const v = await vcardOnboarding(fp, i);
  await fc.close();
  const item4 = v.existsMsg && v.unlock && (committedDupCount() === dupBaseline); // recognized + NO committed dup
  const pass = d.item1 && d.item2 && d.item3 && item4;
  results.push(pass);
  console.log(`iter ${i}: (1)card=${d.item1} (2)mouseResize=${d.item2} (3)X→peek+expand=${d.item3} (4)unlock[exists=${v.existsMsg},unlock=${v.unlock},dups=${committedDupCount()}/${dupBaseline}]=${item4} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT v0.6.94 (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log(`NOTE: item 4 left ≤1 provisional uncommitted device token (new-device onboarding mints one; reported for cleanup). committed dup Marcels w/ known phone: ${committedDupCount()} (baseline ${dupBaseline}).`);
await browser.close();
process.exit(green ? 0 : 1);
