// T37.20 remaining inputs (JOB1 completion). Each dropped input must instantiate its CORRECT CLASS (Tron: no shapes — a unit is
// a class instance) via the app's OWN #rrc-drop handler, and resolve via /api/ior as that class. URL→WebItem; image→Image;
// .eml→Email; .vcf→Contact; .ics→CalendarEntry. iOS photo/Mail are DESKTOP-WEBKIT repros (flagged, NOT real iOS). PASS = right
// class instantiated. 'File for everything' = FAIL (wrong class = the functional thing Tron rejected).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const roomFiles = (roomId) => new Promise((res) => { const u = new URL(`${BASE}/api/trace/children/roomcoll:${roomId}:files`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d).children || []); } catch { res([]); } }); }).on('error', () => res([])); });
const iorClass = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d).className); } catch { res(null); } }); }).on('error', () => res(null)); });

const INPUTS = [
  { key: 'URL→WebItem', kind: 'url', payload: 'https://example.com/t3720-webitem', want: /WebItem/i, ios: false },
  { key: 'image→Image (iOS-photo repro)', kind: 'file', name: 't.png', mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4], want: /Image/i, ios: true },
  { key: '.eml→Email (iOS-Mail repro)', kind: 'file', name: 't.eml', mime: 'message/rfc822', bytes: [...Buffer.from('From: a@b\r\nSubject: t\r\n\r\nhi')], want: /Email/i, ios: true },
  { key: '.vcf→Contact', kind: 'file', name: 't.vcf', mime: 'text/vcard', bytes: [...Buffer.from('BEGIN:VCARD\r\nFN:T\r\nEND:VCARD')], want: /Contact/i, ios: false },
  { key: '.ics→CalendarEntry', kind: 'file', name: 't.ics', mime: 'text/calendar', bytes: [...Buffer.from('BEGIN:VCALENDAR\r\nEND:VCALENDAR')], want: /CalendarEntry|Calendar/i, ios: false },
];

const browser = await webkit.launch();
const out = [];
let roomId = null;
let servedVersion = '?'; // GATE-PROVENANCE (PO): read the ACTUAL served build at runtime — never a hardcoded literal that can attribute a verdict to the wrong version
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('T3720 remaining', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) throw new Error('no room');

  for (const inp of INPUTS) {
    const before = new Set((await roomFiles(roomId)).map((c) => c.uuid));
    await page.evaluate(async (inp) => {
      const dz = document.getElementById('rrc-drop'); if (!dz) return;
      const dt = new DataTransfer();
      if (inp.kind === 'url') { dt.setData('text/uri-list', inp.payload); dt.setData('text/plain', inp.payload); }
      else { dt.items.add(new File([new Uint8Array(inp.bytes)], inp.name, { type: inp.mime })); }
      dz.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
      dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    }, inp);
    await sleep(3500);
    const after = await roomFiles(roomId);
    const fresh = after.find((c) => !before.has(c.uuid));
    const cls = fresh ? await iorClass(fresh.uuid) : null;
    const instantiated = !!fresh;
    const rightClass = cls && inp.want.test(cls);
    // RENDER (the user outcome, PO): expand the room Files node and assert THIS unit is VISIBLE in the tree — class-resolves is
    // necessary, rendering-itself is what Tron sees. A unit in /api but invisible once expanded = a render defect (D1 in costume).
    const rendered = fresh ? await page.evaluate(async ({ roomId, uuid }) => {
      const t = document.getElementById('room-tree'); if (!t) return false;
      if (t.expandPath) { await t.expandPath([`room:${roomId}`]).catch(() => {}); await t.expandPath([`roomcoll:${roomId}:files`]).catch(() => {}); }
      await new Promise((r) => setTimeout(r, 900));
      const node = [...t.querySelectorAll('rb-object-item, [ref], [data-ref], [uuid], [data-uuid]')].find((n) => [...n.attributes].some((a) => a.value.includes(uuid)));
      if (!node) return false;
      const el = node.closest('.tt-row') || node;
      return el.offsetHeight > 0 && el.getBoundingClientRect().height > 0; // present AND visible (not height-0/clipped)
    }, { roomId, uuid: fresh.uuid }) : false;
    const pass = instantiated && rightClass && rendered;
    out.push({ ...inp, uuid: fresh?.uuid, cls, instantiated, rendered, pass });
    R(`  [${inp.key}]${inp.ios ? ' (desktop-webkit repro, NOT real iOS)' : ''}: instantiated=${instantiated} class=${cls || 'none'} rendered-visible=${rendered} → ${pass ? 'PASS' : 'FAIL/INCONCLUSIVE'}`);
  }
  // cleanup
  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId); await sleep(1200);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.20 REMAINING INPUTS — UNIT CLASS + RENDER per input (prod SERVED v${servedVersion}) ═══`);
for (const r of out) R(`  ${r.key.padEnd(34)}: ${r.pass ? 'PASS' : 'FAIL'} (class=${r.cls || 'none'}, rendered-visible=${r.rendered})${r.ios ? ' [desktop-webkit repro, not real iOS]' : ''}`);
R(`  PASS = correct CLASS instantiated AND the unit RENDERS VISIBLE on expand (Tron: right class AND rendering itself, not just 'stored'). Bare File on a typed input, or class-ok-but-invisible = FAIL.`);
process.exit(out.every((r) => r.pass) ? 0 : 1);
