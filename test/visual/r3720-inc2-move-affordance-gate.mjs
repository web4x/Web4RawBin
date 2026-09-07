// T37.20 INC-2 (v0.8.208) — the explicit "📁 Move…" affordance, behavioural on prod, SystemTester.
// Claim: on a room FILE detail a 'Move…' action SHOWS → a folder picker → picking a folder MOVES
// the file INTO it via the SAME /api/room/<id>/move-unit path the drag uses (two affordances, ONE mechanism).
//
// (A) DISCOVERABILITY (resolver, deterministic, FAILABLE type-gate): applicableActionsFor offers 'move'/'📁 Move…'
//     for a FILE unit and does NOT for a member unit (a removed/mis-typed decl → RED).
// (B) BEHAVIOURAL (webkit @390, DET-3x): fire the REAL registered Command (rb-drawer-action{verb:'move'}) — the exact
//     path the button tap fires — assert the 'Move to…' picker renders folder rows (Files root + the folder), click the
//     folder row, then SERVER-VERIFY the file re-parented (location root → folder). Real transition = FAILABLE (a dead
//     affordance or broken move leaves location at root → RED).

import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (path, body) => new Promise((res) => { const u = new URL(`${BASE}${path}`); const data = Buffer.from(JSON.stringify(body)); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, body: j }); }); }); req.on('error', (e) => res({ status: 0, body: { error: String(e.message) } })); req.write(data); req.end(); });
const iorModel = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { const j = JSON.parse(d); res(j?.unit?.model || {}); } catch { res({}); } }); }).on('error', () => res({})); });

// ── (A) DISCOVERABILITY via the pure resolver (node-testable, deterministic) ──
function discoverability() {
  const tmp = `${REPO}/test/visual/.inc2-resolver-check.ts`;
  const code = [
    "import { applicableActionsFor, UNIVERSAL_DECLS } from '../../src/public/ts/trace/action-applicability.ts';",
    "const off = (u:any) => applicableActionsFor(u, {}, UNIVERSAL_DECLS).offered.map((a:any) => a.verb + '|' + a.label);",
    "const fileHasMove = off({ type: 'file' }).some((x:string) => x.startsWith('move|') && x.includes('\\u{1F4C1} Move'));",
    "const memberHasMove = off({ type: 'member' }).some((x:string) => x.startsWith('move|'));",
    "console.log(JSON.stringify({ fileHasMove, memberHasMove }));",
  ].join('\n');
  try {
    writeFileSync(tmp, code);
    const out = execSync(`npx tsx ${tmp}`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const j = JSON.parse(out.trim().split('\n').pop());
    return { ...j, pass: j.fileHasMove === true && j.memberHasMove === false };
  } catch (e) { return { error: String(e.message || e).slice(0, 200), pass: false }; }
  finally { try { unlinkSync(tmp); } catch {} }
}

// ── (B) BEHAVIOURAL: one full affordance-driven move, server-verified ──
async function behaviouralMove(browser, tag) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  const out = { tag };
  try {
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
    out.served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
    await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
    await sleep(1500);
    const roomId = await page.evaluate(async (t) => { const c = window.__rawbinClient; c.createRoom('T3720 INC2 move ' + t, 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const el = document.getElementById('room-tree'); if (el?.getAttribute('data-seed-ior')) return el.getAttribute('data-seed-ior'); } return null; }, tag);
    if (!roomId) throw new Error('no room');
    out.roomId = roomId.slice(0, 12);
    // folder + file (unique bytes → no content-hash dedup)
    await post(`/api/room/${roomId}/folder`, { name: 'MoveTarget', nestedPath: '', playerToken: SYS });
    const B = '----inc2'; const bytes = Buffer.from('inc2-move-' + tag + '-' + roomId.slice(0, 6));
    const upBody = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="inc2-moveme.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), bytes, Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
    const up = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: upBody });
    const fUuid = (await up.json().catch(() => ({}))).uuid || '';
    if (!fUuid) throw new Error('no file uuid');
    await sleep(1200);
    out.locBefore = (await iorModel(fUuid)).location || '(root)';
    out.wasRoot = !/MoveTarget/.test(out.locBefore); // must start at root so GREEN is a real transition

    // ── fire the REAL registered 'move' Command (same event the button tap dispatches) ──
    await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'move', ref: 'file:' + ref }, bubbles: true })), fUuid);
    // the picker sheet is an overlay containing 'Move to…' + rb-object-item folder rows
    const picker = await page.waitForFunction(() => {
      const sheets = [...document.querySelectorAll('div')].filter(d => /Move to…/.test(d.textContent || '') && d.querySelector('rb-object-item'));
      if (!sheets.length) return null;
      const items = [...sheets[0].querySelectorAll('rb-object-item')].map(i => (i.data && i.data.title) || i.textContent || '');
      return { rows: items };
    }, { timeout: 8000 }).then(h => h.jsonValue()).catch(() => null);
    out.pickerRows = picker ? picker.rows : [];
    out.pickerShown = !!picker && picker.rows.some(r => /Files \(root\)/.test(r)) && picker.rows.some(r => /MoveTarget/.test(r));

    // ── click the MoveTarget folder row: find the rb-object-item titled 'MoveTarget', click its PARENT row
    //    (the row wrapper carries the move listener; the item itself has pointerEvents:none) ──
    const clicked = await page.evaluate(() => {
      const item = [...document.querySelectorAll('rb-object-item')].find(i => /MoveTarget/.test((i.data?.title || i.textContent) || ''));
      const row = item && item.parentElement;
      if (!row) return false; row.click(); return true;
    });
    out.rowClicked = clicked;
    await sleep(2000);

    // ── SERVER-TRUTH: did F re-parent INTO MoveTarget? ──
    const fLoc = String((await iorModel(fUuid)).location || '');
    out.locAfter = fLoc;
    out.reparented = /MoveTarget/.test(fLoc);
    out.pass = out.wasRoot && out.pickerShown && out.rowClicked && out.reparented;
  } catch (e) { out.error = String(e.message || e); out.pass = false; }
  finally { await ctx.close(); }
  return out;
}

// ── DRIVE ──
const disc = discoverability();
console.log(`(A) discoverability: fileOffersMove=${disc.fileHasMove} memberOffersMove=${disc.memberHasMove} typeGate=${disc.pass ? 'PASS' : 'FAIL'}${disc.error ? ' err=' + disc.error : ''}`);

const browser = await webkit.launch();
const runs = [];
for (let i = 1; i <= 3; i++) {
  const r = await behaviouralMove(browser, `r${i}`);
  runs.push(r);
  console.log(`(B) run ${i}: served=${r.served} room=${r.roomId} wasRoot=${r.wasRoot} pickerRows=[${(r.pickerRows || []).join(', ')}] pickerShown=${r.pickerShown} rowClicked=${r.rowClicked} loc '${r.locBefore}'→'${r.locAfter}' reparented=${r.reparented} => ${r.pass ? 'GREEN' : 'RED'}${r.error ? ' err=' + r.error : ''}`);
}
await browser.close();

const behaviouralGreen = runs.length === 3 && runs.every(r => r.pass);
const green = disc.pass && behaviouralGreen;
console.log(`\n=== INC-2 VERDICT (📁 Move… affordance) ===`);
console.log(`  discoverability(type-gate) = ${disc.pass ? 'GREEN' : 'RED'}`);
console.log(`  behavioural move DET-3x    = ${behaviouralGreen ? 'GREEN' : 'RED'}`);
console.log(green ? 'OVERALL: GREEN DET-3x — affordance shows, picker renders folders, move re-parents via move-unit' : 'OVERALL: RED');
process.exit(green ? 0 : 1);
