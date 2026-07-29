// R31.16 read-only-notice (ior 8a584787) — engine-independent @390. Plain-text HTML5, ZERO device code → Chromium is a
// VALID oracle (certify WITHOUT Tron). NON-host opens room settings → a visible read-only NOTICE ('not the room owner');
// HOST → NO notice (editable). NOTE: PO said v0.7.148 but served client is rawbin-v0.8.0 (bundle app-GSRDGJPS.js == HEAD
// pkg 0.8.0) — the notice shipped in the 0.8.0 bundle (RoomView:148); gating served==0.8.0 (flagged). Non-host = dnd room
// (no pollution); host = a SystemTester-owned room (create+delete, rejoin-probe verified).
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
// after opening settings, report: is a VISIBLE read-only notice present? + h3 text
const noticeState = async (page) => { await page.click('.rb-header-title', { timeout: 5000 }).catch(() => {}); await sleep(700); return page.evaluate(() => { const modalTxt = document.body.innerText || ''; const hasText = /not the room owner/i.test(modalTxt) && /read-only/i.test(modalTxt); const el = Array.from(document.querySelectorAll('div')).find(d => /not the room owner/i.test(d.textContent || '') && d.children.length === 0); const visible = !!el && el.offsetHeight > 0; const h3 = Array.from(document.querySelectorAll('h3')).find(h => /Room Settings/.test(h.textContent || ''))?.textContent || ''; const saveBtn = !!document.querySelector('#re-save'); return { hasText, visible, h3, saveBtn }; }); };

const sw = await httpGet('/sw.js'); const cn = (sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
const bundle = ((await httpGet('/app')).match(/app-[A-Z0-9]+\.js/) || [])[0];
const bundleHasNotice = /not the room owner/i.test(await httpGet(`/dist/${bundle}`));
console.log(`served sw=${cn} bundle=${bundle} | notice-text-in-served-bundle=${bundleHasNotice} (PO said v0.7.148; served is ${cn})`);

const results = [];
let OWNED = null;
try {
  // create host room for the host-no-notice arc
  const cr = await newRoomPage(null); await sleep(3500);
  await cr.page.click('#create-room-btn', { timeout: 8000 }).catch(() => {}); await cr.page.fill('#room-name', 'SystemTester R31.16 notice').catch(() => {}); await cr.page.click('#confirm-create-btn', { timeout: 8000 }).catch(() => {});
  await roomReady(cr.page); OWNED = await cr.page.evaluate(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').replace('room:', '') || null); await cr.ctx.close();
  console.log(`OWNED host room = ${OWNED}`);

  for (let i = 1; i <= 3; i++) {
    const nh = await newRoomPage(DND); await roomReady(nh.page); await sleep(1200); const n = await noticeState(nh.page); await nh.ctx.close();
    const h = await newRoomPage(OWNED); await roomReady(h.page); await sleep(1200); const hs = await noticeState(h.page); await h.ctx.close();
    const nonHostNotice = n.hasText && n.visible && !n.saveBtn && /^Room Settings/.test(n.h3);   // non-host: notice present+visible, no Save, h3 'Room Settings'
    const hostNoNotice = !hs.hasText && hs.saveBtn && /^Edit Room Settings/.test(hs.h3);          // host: NO notice, Save present, h3 'Edit Room Settings'
    const pass = nonHostNotice && hostNoNotice && bundleHasNotice;
    results.push(pass);
    console.log(`iter ${i}: non-host NOTICE=${nonHostNotice}(text=${n.hasText} vis=${n.visible} noSave=${!n.saveBtn} h3="${n.h3}") | host NO-notice=${hostNoNotice}(text=${hs.hasText} save=${hs.saveBtn} h3="${hs.h3}") => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  if (OWNED) { try { const d = await newRoomPage(OWNED); await roomReady(d.page); await sleep(900); await d.page.evaluate(() => document.querySelector('.room-body,#rrc-root')?.dispatchEvent(new CustomEvent('rb-delete', { bubbles: true }))); await sleep(400); await d.page.click('[data-action="delete"]', { force: true, timeout: 4000 }).catch(() => {}); await sleep(2000); await d.ctx.close(); const p = await newRoomPage(OWNED); await sleep(2500); const gone = await p.page.evaluate((id) => !((document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').includes(id)), OWNED); console.log(`cleanup: owned room gone(rejoin-probe)=${gone}`); await p.ctx.close(); } catch { /* */ } }
  await browser.close();
}

console.log('\n===== R31.16 read-only-notice (engine-independent, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — non-host sees read-only notice, host does not' : 'RED');
process.exitCode = green ? 0 : 1;
