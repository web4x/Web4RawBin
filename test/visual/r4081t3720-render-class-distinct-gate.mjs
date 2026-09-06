// T37.20 DEFECT-2 inc-2 (JOB3) — per-class RENDER: each natural class must render AS ITSELF, not a generic file row. inc-1 proved
// each unit is VISIBLE; inc-2 must prove Image renders an actual <img>, and Email/Contact/CalendarEntry render class-DISTINCT cards
// that DIFFER from each other AND from a generic file row. All-same-generic-markup = FAIL even if every node is visible ('renders
// itself' is Tron's bar; a shared generic row is the old defect in a new class name). Real drops via the app's #rrc-drop; the
// rendered markup is captured from rb-natural-detail (the class renders itself there). Runtime-read served version (provenance).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const roomFiles = (roomId) => new Promise((res) => { const u = new URL(`${BASE}/api/trace/children/roomcoll:${roomId}:files`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d).children || []); } catch { res([]); } }); }).on('error', () => res([])); });

// class-distinct markers: each kind must render its OWN chrome; image must carry a real <img>.
const INPUTS = [
  { key: 'image→Image', kind: 'file', name: 't.png', mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4], must: (h) => /<img\s/i.test(h) && /\/content/.test(h), label: 'Image' },
  { key: '.eml→Email', kind: 'file', name: 't.eml', mime: 'message/rfc822', bytes: [...Buffer.from('From: a@b\r\nSubject: t\r\n\r\nhi')], must: (h) => /Email/i.test(h) && /open message/i.test(h), label: 'Email' },
  { key: '.vcf→Contact', kind: 'file', name: 't.vcf', mime: 'text/vcard', bytes: [...Buffer.from('BEGIN:VCARD\r\nFN:T\r\nEND:VCARD')], must: (h) => /Contact/i.test(h) && /vCard/i.test(h), label: 'Contact' },
  { key: '.ics→CalendarEntry', kind: 'file', name: 't.ics', mime: 'text/calendar', bytes: [...Buffer.from('BEGIN:VCALENDAR\r\nEND:VCALENDAR')], must: (h) => /Calendar/i.test(h) && /iCalendar|open event/i.test(h), label: 'Calendar' },
];

const browser = await webkit.launch();
const out = [];
let roomId = null, servedVersion = '?';
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('T3720 render-distinct', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'} servedVersion=${servedVersion}`);
  if (!roomId) throw new Error('no room');

  for (const inp of INPUTS) {
    const before = new Set((await roomFiles(roomId)).map((c) => c.uuid));
    await page.evaluate(async (d) => { const dz = document.getElementById('rrc-drop'); if (!dz) return; const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array(d.bytes)], d.name, { type: d.mime })); dz.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); }, { bytes: inp.bytes, name: inp.name, mime: inp.mime });
    await sleep(3500);
    const fresh = (await roomFiles(roomId)).find((c) => !before.has(c.uuid));
    // select the unit node → the drawer mounts rb-natural-detail (the class renders itself) → capture its markup
    const markup = fresh ? await page.evaluate(async ({ roomId, uuid }) => {
      const t = document.getElementById('room-tree'); if (t?.expandPath) { await t.expandPath([`room:${roomId}`]).catch(() => {}); await t.expandPath([`roomcoll:${roomId}:files`]).catch(() => {}); }
      await new Promise((r) => setTimeout(r, 700));
      const node = [...t.querySelectorAll('rb-object-item, [ref], [data-ref], [uuid], [data-uuid]')].find((n) => [...n.attributes].some((a) => a.value.includes(uuid)));
      if (node) node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 1100));
      const nat = document.querySelector('rb-natural-detail'); if (nat && nat.innerHTML.length > 10) return nat.innerHTML;
      const dp = document.querySelector('rb-detail-drawer .drawer-panel-detail, .drawer-panel-detail'); return dp ? dp.innerHTML : '';
    }, { roomId, uuid: fresh.uuid }) : '';
    const distinct = fresh ? inp.must(markup) : false;
    const hasImg = /<img\s/i.test(markup);
    out.push({ ...inp, uuid: fresh?.uuid, markup: markup.replace(/\s+/g, ' ').slice(0, 120), distinct, hasImg });
    R(`  [${inp.key}]: class-distinct-render=${distinct}${inp.label === 'Image' ? ` (has<img>=${hasImg})` : ''} → ${distinct ? 'PASS' : 'FAIL'}  markup="${markup.replace(/\s+/g, ' ').slice(0, 90)}"`);
  }
  // MUTUAL DISTINCTNESS: the 4 rendered markups must not collapse to the same generic row (normalize out uuid/name).
  const norm = (h) => h.replace(/[0-9a-f]{8}-[0-9a-f-]{20,}/gi, 'U').replace(/t\.(png|eml|vcf|ics)/g, 'N').replace(/\s+/g, ' ').trim();
  const normed = out.filter((o) => o.uuid).map((o) => norm(o.markup));
  const allDistinct = new Set(normed).size === normed.length && normed.length === INPUTS.length;
  R(`  MUTUAL DISTINCTNESS (no two classes share generic markup): ${allDistinct ? 'GREEN' : 'RED'} (${new Set(normed).size}/${normed.length} unique)`);
  out.push({ key: '__distinct__', distinct: allDistinct });

  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId); await sleep(1200);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

const perInput = out.filter((o) => o.key !== '__distinct__');
const distinctPass = out.find((o) => o.key === '__distinct__')?.distinct;
R(`\n═══ T37.20 inc-2 PER-CLASS RENDER (renders AS ITSELF) — prod SERVED v${servedVersion} ═══`);
for (const r of perInput) R(`  ${r.key.padEnd(20)}: ${r.distinct ? 'PASS' : 'FAIL'} (class-distinct render)`);
const n = perInput.filter((r) => r.distinct).length;
R(`  X/4 class-distinct = ${n}/${perInput.length} · mutual-distinctness = ${distinctPass ? 'GREEN' : 'RED'}`);
R(`  PASS = Image renders a real <img>, Email/Contact/Calendar render class-distinct cards, all mutually distinct (not one shared generic row).`);
process.exit(n === perInput.length && distinctPass ? 0 : 1);
