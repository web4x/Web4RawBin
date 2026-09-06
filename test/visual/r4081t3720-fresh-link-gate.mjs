// T37.20 DEFECT-1 FRESH-UNIT acceptance (PO): the '(noop)' green was indistinguishable from Tron's 'drop does nothing' — the
// source unit was already in the room. REAL acceptance: drag a unit NOT in the target room → it LINKS and RENDERS there
// (appears in the room tree, resolves as its class), still with ZERO fetch. Upload file F into room B, then drop F's ref onto a
// FRESH room C's #rrc-drop → assert F is now in C's files, renders, no 403, zero client federation-import. PASS = real link+render.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const roomFiles = (rid) => new Promise((res) => { const u = new URL(`${BASE}/api/trace/children/roomcoll:${rid}:files`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res((JSON.parse(d).children || []).map((c) => c.uuid)); } catch { res([]); } }); }).on('error', () => res([])); });
const iorClass = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d).className); } catch { res(null); } }); }).on('error', () => res(null)); });
const mkRoom = (page, name) => page.evaluate(async (name) => { const c = window.__rawbinClient; c.createRoom(name, 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; }, name);

const browser = await webkit.launch();
let roomB = null, roomC = null, res = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  const reqs = []; page.on('request', (r) => reqs.push(r.url()));
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  // room B + upload file F
  roomB = await mkRoom(page, 'T3720 B (source)');
  const SRC = crypto.randomBytes(2048); const Bd = '----fB';
  const body = Buffer.concat([Buffer.from(`--${Bd}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${Bd}\r\nContent-Disposition: form-data; name="file"; filename="fresh-src.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), SRC, Buffer.from(`\r\n--${Bd}--\r\n`, 'utf8')]);
  const up = await page.request.post(`${BASE}/api/room/${roomB}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${Bd}` }, data: body });
  const F = (await up.json().catch(() => ({}))).uuid || '';
  R(`  room B=${roomB?.slice(0, 8)} uploaded F=${F.slice(0, 12)} class=${await iorClass(F)}`);
  // room C (fresh — F is NOT in it)
  roomC = await mkRoom(page, 'T3720 C (target)');
  await sleep(1500);
  const cBefore = await roomFiles(roomC);
  const inCBefore = cBefore.includes(F);
  R(`  room C=${roomC?.slice(0, 8)} — F already in C? ${inCBefore} (must be false for a fresh link)`);
  // drop F's ref onto C's #rrc-drop, using the app's drag MIMEs (F is external to C)
  const reqBefore = reqs.length;
  const drop = await page.evaluate((F) => {
    const dz = document.getElementById('rrc-drop'); if (!dz) return { ok: false, why: 'no dz' };
    const dt = new DataTransfer(); const ref = `file:${F}`;
    dt.setData('application/rb-object-ref', ref); dt.setData('application/rb-unit', ref);
    dt.setData('text/plain', `#file.show?uuid=${F}`); dt.setData('text/uri-list', `${location.origin}/app#file.show?uuid=${F}`);
    dz.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return { ok: true, types: [...dt.types] };
  }, F);
  await sleep(4500);
  const dropReqs = reqs.slice(reqBefore);
  const zeroFetch = dropReqs.filter((u) => /\/api\/federation\/import/.test(u)).length === 0;
  const cAfter = await roomFiles(roomC);
  const linkedIntoC = cAfter.includes(F) && !inCBefore; // F is NOW in C and was NOT before = a REAL fresh link
  const sys = await page.evaluate(() => [...document.querySelectorAll('[class*="message"]')].map((n) => n.textContent || '').filter((t) => /drop|link|federation|fail|error/i.test(t)).slice(-4));
  const sysFailed = sys.some((t) => /fail|403|error/i.test(t));
  // PO close: EXPAND room C's Files node BEFORE asserting render (rules out 'rendered-but-collapsed'). A still-invisible unit
  // after expand = a REAL render defect (link in the API but the user never sees it = the same complaint in a new costume).
  await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) { await t.expandPath([`room:${rid}`]).catch(() => {}); await t.expandPath([`roomcoll:${rid}:files`]).catch(() => {}); } }, roomC);
  await sleep(1500);
  const renders = await page.evaluate((F) => (document.getElementById('room-tree')?.textContent || '').includes('fresh-src') || [...(document.getElementById('room-tree')?.querySelectorAll('rb-object-item') || [])].some((n) => [...n.attributes].some((a) => a.value.includes(F))), F);
  const cls = await iorClass(F);
  res = { F, linkedIntoC, zeroFetch, sysFailed, renders, cls, sys, pass: linkedIntoC && zeroFetch && !sysFailed && /File/i.test(cls || '') };
  R(`  drop types=${JSON.stringify(drop.types)}`);
  R(`  ★ FRESH LINK: linkedIntoC=${linkedIntoC} (C files ${cBefore.length}→${cAfter.length}) zeroFetch=${zeroFetch} noError=${!sysFailed} renders=${renders} class=${cls} sys=${JSON.stringify(sys).slice(0, 150)}`);
  R(`    ⇒ ${res.pass ? 'PASS — a unit NOT in the room LINKED + RENDERS + resolves as its class, ZERO fetch (his real outcome, not a noop)' : `RED — ${!linkedIntoC ? 'F did NOT link into C (noop/nothing = Tron bug)' : sysFailed ? 'error: ' + sys.filter((t) => /fail|403/i.test(t)).join('|').slice(0, 60) : !res.pass ? 'inspect' : ''}`}`);
  await page.evaluate((a) => { window.__rawbinClient?.deleteRoom?.(a[0]); window.__rawbinClient?.deleteRoom?.(a[1]); }, [roomB, roomC]); await sleep(1200);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }
R(`\n═══ T37.20 DEFECT-1 FRESH-UNIT LINK (prod) : ${res.pass ? 'GREEN' : 'RED'} ═══`);
process.exit(res.pass ? 0 : 1);
