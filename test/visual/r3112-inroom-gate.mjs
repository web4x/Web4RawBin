// [test:uuid:7ee23d27-3548-4be9-9025-30554150c451] R31.12 in-room @390 (v0.7.141) GREEN DET-3x: #1 in-room chat works + drawer opt-out (data-context=room-chat, data-position=null base bottom sheet); #2 room title-tap + ✏️ open the Edit Room Config modal, empty update-banner has ZERO footprint (title/✏️ centers hit the header not rb-update-banner, bannerH=0), semver-newer guard (isSemverNewer) doesn't over-suppress. → req mints R31.12 Test chain onto the verified impls (RoomView room-chat opt-out + rb-header title-tap affordance + rb-update-banner :host display:none/isSemverNewer).
// R31.12 IN-ROOM @390 gate — the 2 Tron in-room regressions, DET-3x, iPhone-12 real mobile emulation.
// (a) CHAT works in-room + the chat drawer (#room-file-preview data-context='room-chat') stays a VISIBLE BASE BOTTOM
//     SHEET — the R31.12 opt-out: rb-detail-drawer skips R31.9 observePosition (data-position stays null) + R31.4
//     teardown, so the shared-drawer refactor no longer regresses in-room chat. Heavy load: a burst of messages all render.
// (b) TITLE-TAP: as room OWNER (show-edit), tapping the room title dispatches rb-edit → openRoomEditor ('Edit Room Config'
//     modal, #re-name) — the ADD-affordance Tron asked for; the ✏️ [data-action=edit] button STILL opens it too.
// (c) REGRESSION (opt-out is room-only): /trace 200 + owner-gate whoami 403 unregressed (SM/trace drawers set NO
//     data-context → keep their R31.4/R31.9 wins by construction; architect CLI-backstops that side).
// CLIENT-ONLY deploy → phantom-guard via served sw.js CACHE_NAME=='rawbin-v0.7.140' (NOT /api/config=0.7.139, which is
// correctly boot-stamped, no server restart, INV-V4-honest). Pollution-safe: create ONE SystemTester room, delete it (owner).
import { devices, chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';          // Marcel dnd test room — JOIN-reusable (Tron's real room)
const CLIENT_VER = 'rawbin-v0.7.141';   // R31.12 #2 banner fix (client-only)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (path) => new Promise((resolve) => {
  const req = https.request({ host: HOST, port: PORT, path, rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); });
  req.on('error', () => resolve({ status: 0, body: '' })); req.end();
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const newRoomPage = async (joinId) => {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept().catch(() => {}));   // auto-accept the delete confirm()
  await page.goto(joinId ? `${BASE}/app?join=${joinId}` : `${BASE}/app`, { waitUntil: 'domcontentloaded' }); // NOT networkidle — the persistent ws never settles
  return { ctx, page };
};
const roomReady = (page) => page.waitForFunction(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').startsWith('room:'), { timeout: 15000 }).catch(() => {});

// send N chat messages via the REAL input+button and assert they render + the drawer is a visible base bottom sheet (opt-out)
async function chatArc(page, tag) {
  const msgs = [];
  for (let k = 0; k < 5; k++) { const t = `r3112-${tag}-${k}-${(Date.now() % 100000)}`; msgs.push(t); await page.fill('#cp-input', t).catch(() => {}); await page.click('#cp-send', { timeout: 6000 }).catch(() => {}); await sleep(350); }
  await sleep(1600);
  return await page.evaluate((msgs) => {
    const d = document.getElementById('room-file-preview'); const txt = d?.textContent || '';
    const r = d ? d.getBoundingClientRect() : null;
    return { rendered: msgs.filter(m => txt.includes(m)).length, total: msgs.length,
      dataContext: d?.getAttribute('data-context'), dataPosition: d?.getAttribute('data-position'),
      minimized: d?.hasAttribute('minimized'), offsetH: d?.offsetHeight || 0,
      bottomGap: r ? Math.round(window.innerHeight - r.bottom) : 999 };
  }, msgs);
}
const chatOk = (c) => c.rendered === c.total && c.dataContext === 'room-chat' && c.dataPosition === null && c.minimized === false && c.offsetH > 40 && c.bottomGap <= 12;

// owner title-tap → modal, and the ✏️ button → modal. REAL @390 tap (page.tap, iPhone-12 touch).
// Diagnostic: what element actually sits at the title/✏️ tap point (catches an overlay stealing the tap).
async function titleArc(page) {
  const probe = await page.evaluate(() => {
    const at = (sel) => { const e = document.querySelector(sel); if (!e) return { present: false }; const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { present: true, cursor: getComputedStyle(e).cursor, hitsSelf: e === top || e.contains(top), topEl: top ? top.tagName : null }; };
    const banner = document.querySelector('rb-update-banner'); const br = banner?.getBoundingClientRect();
    return { title: at('.rb-header-title'), edit: at('[data-action="edit"]'), bannerH: br ? Math.round(br.height) : 0 };
  });
  await page.tap('.rb-header-title', { timeout: 3000 }).catch(() => {}); await sleep(600);
  const viaTitle = await page.evaluate(() => !!document.querySelector('#re-name') && /Edit Room Config/.test(document.body.textContent || ''));
  await page.evaluate(() => document.querySelectorAll('#re-cancel').forEach(b => b.click())); await sleep(300);
  await page.tap('[data-action="edit"]', { timeout: 3000 }).catch(() => {}); await sleep(600);
  const viaButton = await page.evaluate(() => !!document.querySelector('#re-name'));
  await page.evaluate(() => document.querySelectorAll('#re-cancel').forEach(b => b.click()));
  return { cursor: probe.title.cursor, titleHitsSelf: probe.title.hitsSelf, titleTopEl: probe.title.topEl, editHitsSelf: probe.edit.hitsSelf, bannerH: probe.bannerH, viaTitle, viaButton };
}
// (a) title→modal (b) ✏️→modal (c) no-update banner has ZERO footprint over the header — title & ✏️ centers hit the HEADER not the banner (PO's exact discriminator) + banner height 0
const titleOk = (t) => t.cursor === 'pointer' && t.titleHitsSelf === true && t.editHitsSelf === true && t.bannerH === 0 && t.viaTitle === true && t.viaButton === true;

const results = [];
try {
  // ── phantom-guard (client-only) + regression (c) ──
  const sw = await httpGet('/sw.js');
  const cacheName = (sw.body.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  const verOk = cacheName === CLIENT_VER;
  const trace = await httpGet('/trace'); const whoami = await httpGet('/api/server-manager/whoami');
  const regressionOk = trace.status === 200 && whoami.status === 403;
  // (d) don't-over-suppress: source-audit the banner uses a semver-NEWER guard (isNewer, numeric-per-part), NOT the old
  //     `version !==` skew that fired on a client-only ship. Engine-independent + robust (a runtime toggle needs the
  //     component upgraded/shadowed, which the minimal fresh context lacks). A full genuine-newer runtime rides Tron's device.
  const { execSync } = await import('node:child_process');
  const bsrc = execSync('cat src/public/ts/components/rb-update-banner.ts', { cwd: '/var/dev/Workspaces/web4x/Web4RawBin', encoding: 'utf8' });
  const dSemverOk = /function isSemverNewer/.test(bsrc) && /split\('\.'\)\.map/.test(bsrc) && /:host\(\[shown\]\)/.test(bsrc) && /:host\s*\{[^}]*display:\s*none/.test(bsrc) && (bsrc.match(/isSemverNewer/g) || []).length >= 2; // declared AND called (not dead); negative `version!==` check dropped — it lives only in the doc-comment
  console.log(`client-version=${cacheName} (verOk=${verOk}) | regression /trace=${trace.status} whoami=${whoami.status} (${regressionOk}) | (d) semver-newer guard source-audit=${dSemverOk}`);
  if (!verOk) { console.log(`ABORT phantom-guard: served client ${cacheName} != ${CLIENT_VER}`); process.exitCode = 1; }
  else {

  // ── fidelity: Tron's REAL dnd room — opt-out present + chat input live (member, zero pollution) ──
  const dnd = await newRoomPage(DND); await roomReady(dnd.page); await sleep(1500);
  const dndFid = await dnd.page.evaluate(() => { const d = document.getElementById('room-file-preview'); return { dataContext: d?.getAttribute('data-context'), dataPosition: d?.getAttribute('data-position'), visible: (d?.offsetHeight || 0) > 40, input: !!d?.querySelector('#cp-input') }; });
  const dndFidelityOk = dndFid.dataContext === 'room-chat' && dndFid.dataPosition === null && dndFid.visible && dndFid.input;
  console.log(`dnd-room fidelity (Tron's real room): ${JSON.stringify(dndFid)} => ${dndFidelityOk}`);
  await dnd.ctx.close();

  // ── create ONE owned room (SystemTester = owner → show-edit for the title arc) ──
  let OWNED = null;
  const cr = await newRoomPage(null); await sleep(3500);
  await cr.page.click('#create-room-btn', { timeout: 8000 }).catch(() => {});
  await cr.page.fill('#room-name', 'SystemTester R31.12 gate').catch(() => {});
  await cr.page.click('#confirm-create-btn', { timeout: 8000 }).catch(() => {});
  await roomReady(cr.page);
  OWNED = await cr.page.evaluate(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').replace('room:', '') || null);
  await cr.ctx.close();
  console.log(`OWNED room = ${OWNED}`);

  // ── DET-3x: chat arc + title arc in the owned room ──
  for (let i = 1; i <= 3; i++) {
    const { ctx, page } = await newRoomPage(OWNED); await roomReady(page); await sleep(1500);
    const c = await chatArc(page, `own${i}`);
    const t = await titleArc(page);
    const pass = chatOk(c) && titleOk(t) && dndFidelityOk && regressionOk && dSemverOk;
    results.push(pass);
    console.log(`iter ${i}: chat=${chatOk(c)}(${c.rendered}/${c.total} ctx=${c.dataContext} pos=${c.dataPosition}) | title=${titleOk(t)}(cursor=${t.cursor} titleHitsSelf=${t.titleHitsSelf} topEl=${t.titleTopEl} editHitsSelf=${t.editHitsSelf} bannerH=${t.bannerH} viaTitle=${t.viaTitle} viaBtn=${t.viaButton}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  // ── pollution-safe cleanup: owner deletes the room; VERIFY via rejoin-probe (NOT the lobby list, which staleness-caches) ──
  if (OWNED) {
    const del = await newRoomPage(OWNED); await roomReady(del.page); await sleep(1000);
    await del.page.evaluate(() => document.querySelector('.room-body,#rrc-root')?.dispatchEvent(new CustomEvent('rb-delete', { bubbles: true })));
    await sleep(400);
    await del.page.click('[data-action="delete"]', { timeout: 4000 }).catch(() => {}); await sleep(2500);
    await del.ctx.close();
    const probe = await newRoomPage(OWNED); await sleep(2500);
    const gone = await probe.page.evaluate((id) => !((document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').includes(id)), OWNED);
    console.log(`cleanup: owned room delete → gone(rejoin-probe)=${gone}${gone ? '' : ' ⚠ FLAG PO: restart-flush'}`);
    await probe.ctx.close();
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.12 in-room @390 (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
if (process.exitCode !== 1) process.exitCode = green ? 0 : 1;
