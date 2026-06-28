// R21.1 gate — vCard import PERSISTS .vcf in the user's data dir, retrievable via
// GET /api/vcard/<token>. Fix/impl 0d931d17f (R21.1 profile.dropVCard) + storeVCard
// POST /api/vcard (server.ts:454) + serveVCard GET /api/vcard/:token (server.ts:984).
//
// Faithful path: real import via #pe-vcf-input -> ProfileEditor change handler
// POSTs /api/vcard {playerToken, data:b64(vcf)} -> server encryptFile(...,'vcard').
// Then GET /api/vcard/<token> -> decryptFile -> returns the stored vcf text.
//
// Discriminator: GET returns 404 "No vCard stored" until a real import persists the
// file; after import it returns 200 with BEGIN:VCARD + the unique FN we imported.
// DET-3x: 3 distinct FNs, each overwrites contact.vcf; GET must return the latest.
// One user/context to keep prod pollution to a single tagged profile.

import { chromium } from '@playwright/test';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const TAGBASE = 'r211persist';
const results = [];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('  [page-err]', m.text().slice(0, 120)); });

function vcf(fn) { return `BEGIN:VCARD\nVERSION:3.0\nFN:${fn}\nTEL:+49123450000\nN:${fn};;;;\nEND:VCARD`; }

async function seedDeviceKeys() {
  await page.evaluate(() => {
    localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
  });
}
async function clearDeviceGate() {
  if (await page.locator('#de-code').isVisible({ timeout: 1500 }).catch(() => false)) {
    await seedDeviceKeys();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
  }
}
// GET /api/vcard/<token> from the page origin (no auth needed; checks fileExists)
async function getStoredVCard(token) {
  return await page.evaluate(async (t) => {
    const r = await fetch('/api/vcard/' + t, { cache: 'no-store' });
    return { status: r.status, body: r.ok ? await r.text() : await r.text().catch(() => '') };
  }, token);
}

// --- bootstrap: committed profile + device keys (authenticated token + userProfile) ---
console.log(`=== R21.1 vCard persistence gate @ ${BASE} ===`);
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
  await seedDeviceKeys();
  await page.fill('#pe-name', `${TAGBASE}-init`);
  await page.fill('#pe-code', '1234');
  await page.click('#pe-save');
  await page.waitForTimeout(3000);
  await clearDeviceGate();
}
await page.waitForSelector('#member-name', { timeout: 20000 });
const token = await page.evaluate(() => localStorage.getItem('rawbin-player-id'));
console.log('bootstrap: lobby reached, token =', token);

// baseline: before any import for THIS token, GET should be 404 (RED-baseline proof)
const baseline = await getStoredVCard(token);
console.log('baseline GET /api/vcard/<token>:', baseline.status, JSON.stringify(baseline.body.slice(0, 40)));

// --- DET-3x measured iterations ---
for (let i = 1; i <= 3; i++) {
  const fn = `${TAGBASE}-vcf-${i}`;

  await page.goto(`${BASE}/app?editProfile=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await clearDeviceGate();
  await page.waitForSelector('#pe-name', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('#pe-vcf-input', { state: 'attached', timeout: 20000 });

  // REAL import -> ProfileEditor change handler POSTs /api/vcard
  await page.setInputFiles('#pe-vcf-input', {
    name: `${fn}.vcf`, mimeType: 'text/vcard', buffer: Buffer.from(vcf(fn)),
  });
  const importApplied = (await page.inputValue('#pe-name').catch(() => '')) === fn;

  // poll GET until the freshly-imported vcf is retrievable (persistence proven)
  let got = { status: 0, body: '' };
  for (let t = 0; t < 50; t++) {
    got = await getStoredVCard(token);
    if (got.status === 200 && got.body.includes('BEGIN:VCARD') && got.body.includes(fn)) break;
    await page.waitForTimeout(200);
  }
  const pass = importApplied && got.status === 200 && got.body.includes('BEGIN:VCARD') && got.body.includes(fn);
  results.push({ i, fn, importApplied, status: got.status, hasVcard: got.body.includes('BEGIN:VCARD'), hasFN: got.body.includes(fn), pass });
  console.log(`iter ${i}: import=${importApplied} GET=${got.status} BEGIN:VCARD=${got.body.includes('BEGIN:VCARD')} FN(${fn})=${got.body.includes(fn)} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT R21.1 (DET-3x) ===');
console.log(`  baseline (pre-import) GET = ${baseline.status} ${baseline.status === 404 ? '(RED-baseline OK: 404 before import)' : '(note: not 404)'}`);
results.forEach(r => console.log(`  iter ${r.i}: ${r.pass ? 'GREEN' : 'RED'}`));
console.log('TOKEN (for external curl verify):', token);
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
await browser.close();
process.exit(green ? 0 : 1);
