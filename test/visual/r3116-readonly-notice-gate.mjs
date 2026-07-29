// [test:uuid:ad86c3a0-8db2-446c-8e09-a9c7d0aee4b2] R31.16 read-only-notice (req/ior 8a584787) — GREEN DET-3x @390 stable v0.8.1 (sw rawbin-v0.8.1, bundle app-XEFVE7TV.js stable): non-host opens room settings -> visible read-only notice ('not the room owner') + NO Save + h3 'Room Settings' (3/3); host -> NO notice + Save + h3 'Edit Room Settings'; notice text present in the served bundle. Engine-independent (plain HTML5, no device -> Chromium valid oracle, no Tron). -> req wires onto the R31.16 read-only-notice render impl (RoomView !isHost gate).
// R31.16 read-only-notice (ior 8a584787) — engine-independent @390 (plain HTML5, ZERO device code → Chromium is a
// VALID oracle, certify WITHOUT Tron). NON-host opens room settings → visible '🔒 Read-only … not the room owner'
// notice + NO Save (h3 'Room Settings'); HOST → NO notice + Save (h3 'Edit Room Settings'). RoomView:148 (!isHost).
// TRIMMED (was 4-min timeout: 2ctx/iter × 3 + banner-intercepted title clicks pre-v0.8.1): host-check folded into the
// create context; non-host DET-3x = 3 fresh dnd joins (no pollution); host room created ONCE + hard-budget cleanup.
import { devices, chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((res) => { const r = https.request({ host: HOST, port: PORT, path: p, rejectUnauthorized: false }, (x) => { let b = ''; x.on('data', c => b += c); x.on('end', () => res(b)); }); r.on('error', () => res('')); r.end(); });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const newRoomPage = async (joinId) => { const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' }); await seedSystemTester(ctx); const page = await ctx.newPage(); page.on('dialog', d => d.accept().catch(() => {})); await page.goto(joinId ? `${BASE}/app?join=${joinId}` : `${BASE}/app`, { waitUntil: 'domcontentloaded' }); return { ctx, page }; };
const roomReady = (page) => page.waitForFunction(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').startsWith('room:'), { timeout: 15000 }).catch(() => {});
// open settings (real title tap; fallback rb-edit) → report notice text/visibility + h3 + Save button
const noticeState = async (page) => {
  await page.click('.rb-header-title', { timeout: 3000 }).catch(() => {}); await sleep(500);
  if (!(await page.evaluate(() => /Room Settings/i.test(document.body.innerText || '')))) { await page.evaluate(() => document.querySelector('.room-body,#rrc-root')?.dispatchEvent(new CustomEvent('rb-edit', { bubbles: true }))); await sleep(500); }
  return page.evaluate(() => {
    const txt = document.body.innerText || '';
    const hasText = /not the room owner/i.test(txt) && /read-only/i.test(txt);
    const el = Array.from(document.querySelectorAll('div')).find(d => /not the room owner/i.test(d.textContent || '') && d.children.length === 0);
    const visible = !!el && el.offsetHeight > 0;
    const h3 = Array.from(document.querySelectorAll('h3')).find(h => /Room Settings/.test(h.textContent || ''))?.textContent || '';
    return { hasText, visible, h3, saveBtn: !!document.querySelector('#re-save') };
  });
};

const sw = await httpGet('/sw.js'); const cn = (sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
const bundle = ((await httpGet('/app')).match(/app-[A-Z0-9]+\.js/) || [])[0];
const bundleHasNotice = /not the room owner/i.test(await httpGet(`/dist/${bundle}`));
const verOk = cn === 'rawbin-v0.8.1';
console.log(`served sw=${cn} (v0.8.1=${verOk}) bundle=${bundle} | notice-in-served-bundle=${bundleHasNotice}`);

const results = [];
let OWNED = null, hostNoNotice = false, hs = {};
try {
  // ── create host room ONCE + host-check in the SAME context (host → NO notice + Save) ──
  const cr = await newRoomPage(null); await sleep(3000);
  await cr.page.click('#create-room-btn', { timeout: 8000 }).catch(() => {}); await cr.page.fill('#room-name', 'SystemTester R31.16 notice').catch(() => {}); await cr.page.click('#confirm-create-btn', { timeout: 8000 }).catch(() => {});
  await roomReady(cr.page); OWNED = await cr.page.evaluate(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').replace('room:', '') || null);
  await sleep(800); hs = await noticeState(cr.page);
  hostNoNotice = !hs.hasText && hs.saveBtn && /^Edit Room Settings/.test(hs.h3);
  console.log(`HOST (owned ${OWNED}) NO-notice=${hostNoNotice} (text=${hs.hasText} save=${hs.saveBtn} h3="${hs.h3}")`);
  await cr.ctx.close();

  // ── non-host DET-3x: 3 fresh dnd joins → visible read-only notice + no Save ──
  for (let i = 1; i <= 3; i++) {
    const nh = await newRoomPage(DND); await roomReady(nh.page); await sleep(1000); const n = await noticeState(nh.page); await nh.ctx.close();
    const nonHostNotice = n.hasText && n.visible && !n.saveBtn && /^Room Settings/.test(n.h3);
    const pass = nonHostNotice && hostNoNotice && bundleHasNotice && verOk;
    results.push(pass);
    console.log(`iter ${i}: non-host NOTICE=${nonHostNotice}(text=${n.hasText} vis=${n.visible} noSave=${!n.saveBtn} h3="${n.h3}") => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  if (OWNED) { try {
    const d = await newRoomPage(OWNED); await roomReady(d.page); await sleep(800);
    await d.page.evaluate(() => document.querySelector('.room-body,#rrc-root')?.dispatchEvent(new CustomEvent('rb-delete', { bubbles: true }))); await sleep(400);
    await d.page.click('[data-action="delete"]', { force: true, timeout: 4000 }).catch(() => {}); await sleep(1800); await d.ctx.close();
    const p = await newRoomPage(OWNED); await sleep(2000);
    const gone = await p.page.evaluate((id) => !((document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').includes(id)), OWNED);
    console.log(`cleanup: owned room gone(rejoin-probe)=${gone}${gone ? '' : ' ⚠ FLAG restart-flush'}`); await p.ctx.close();
  } catch { /* budget */ } }
  await browser.close();
}

console.log('\n===== R31.16 read-only-notice (engine-independent, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — non-host read-only notice, host editable' : 'RED');
process.exitCode = green ? 0 : 1;
