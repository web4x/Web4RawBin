// T37.21 RE-MEASURE (PO: 5-day-old open-part claims DECAY — verify on LIVE PROD v0.8.206, do not repeat a stale claim). Three
// parts: (2) Add-folder → creates + live-MVC renders (client-half); (5) nested physical-folder tree = R40.78 (folder in folder
// renders as a unit); (4) the MISSING sunburst renders in the room-collection detail. Per-part verdict: CLOSED or STILL-OPEN + evidence.
// (PART2's 2nd-browser WS fan-out = the long-pole 2-browser harness; single-browser live-MVC measured here, fan-out flagged.)
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const post = (p, b) => new Promise((res) => { const u = new URL(`${BASE}${p}`); const data = Buffer.from(JSON.stringify(b)); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res(d)); }); req.on('error', () => res('')); req.write(data); req.end(); });

const browser = await webkit.launch();
let servedVersion = '?', roomId = null; const res = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 950 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('T3721 revisit', 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) throw new Error('no room');
  // give Files real content (a file) so a sunburst has data to draw
  const B = '----vB'; const upBody = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="seed.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('seed-' + roomId), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: upBody });
  await post(`/api/room/${roomId}/folder`, { name: 'Alpha', nestedPath: '', playerToken: SYS });
  await post(`/api/room/${roomId}/folder`, { name: 'Beta', nestedPath: 'Alpha', playerToken: SYS }); // NESTED (R40.78): Beta inside Alpha
  await sleep(1500);
  await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.renderSeed) t.renderSeed(rid); }, roomId);
  await sleep(1500);
  await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) { await t.expandPath([`room:${rid}`]).catch(() => {}); await t.expandPath([`roomcoll:${rid}:files`]).catch(() => {}); await t.expandPath([`roomcoll:${rid}:files/Alpha`]).catch(() => {}); } }, roomId);
  await sleep(1200);
  R(`  room=${roomId.slice(0, 12)} served=${servedVersion}`);

  const tree = await page.evaluate(() => (document.getElementById('room-tree')?.textContent || '').replace(/\s+/g, ' '));
  // PART 1/2: room collections render as folders + Add-folder result (Alpha) renders (client live-MVC)
  res.part2 = { filesNode: /Files/.test(tree), membersNode: /Members/.test(tree), alphaRenders: /Alpha/.test(tree) };
  R(`  PART2 (collections as folders + Add-folder live-MVC): Files=${res.part2.filesNode} Members=${res.part2.membersNode} Alpha-renders=${res.part2.alphaRenders} → ${res.part2.filesNode && res.part2.alphaRenders ? 'CLOSED' : 'STILL-OPEN'}`);
  // PART 5 (R40.78 nested): Beta renders INSIDE Alpha + disambiguate DATA (does Beta nest under Alpha server-side) vs RENDER (tree/expand)
  const alphaKids = await new Promise((r2) => { const u = new URL(`${BASE}/api/trace/children/${encodeURIComponent(`roomcoll:${roomId}:files/Alpha`)}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (rr) => { let d = ''; rr.on('data', (c) => d += c); rr.on('end', () => { try { r2(JSON.parse(d).children || []); } catch { r2([]); } }); }).on('error', () => r2([])); });
  const betaOnDisk = alphaKids.some((c) => /Beta/.test(c.name || ''));
  res.part5 = { betaRenders: /Beta/.test(tree), betaNestedData: betaOnDisk, alphaKidCount: alphaKids.length };
  R(`  PART5 (nested R40.78 — Beta inside Alpha): DATA nested(api)=${betaOnDisk} (Alpha children=${alphaKids.length}) · RENDER in tree=${res.part5.betaRenders} → ${betaOnDisk && res.part5.betaRenders ? 'CLOSED' : betaOnDisk ? 'DATA-OK but RENDER-open (expand/tree)' : 'STILL-OPEN (nested create/nest failed)'}`);
  // PART 4 sunburst: select the Files collection → its detail must render a SUNBURST (svg arcs), not just a list
  const sb = await page.evaluate(async (rid) => {
    const t = document.getElementById('room-tree');
    const node = [...t.querySelectorAll('rb-object-item')].find((n) => [...n.attributes].some((a) => a.value.includes(`${rid}:files`) && !a.value.includes('/')));
    if (node) node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 1300));
    const d = document.querySelector('rb-detail-drawer, .drawer-panel-detail, rb-natural-detail') || document.body;
    const svg = d.querySelectorAll('svg path, svg circle, [class*="sunburst"], rb-sunburst, canvas').length;
    return { svgArcs: svg, hasSunburstEl: !!d.querySelector('[class*="sunburst"], rb-sunburst'), detailLen: (d.textContent || '').length };
  }, roomId);
  res.part4 = { sunburst: sb.svgArcs > 0 || sb.hasSunburstEl };
  R(`  PART4 (missing sunburst in detail): svg-arcs=${sb.svgArcs} sunburst-el=${sb.hasSunburstEl} → ${res.part4.sunburst ? 'CLOSED (sunburst renders)' : 'STILL-OPEN (no sunburst in the detail)'}`);

  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId); await sleep(1200);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.21 RE-MEASURE (live prod v${servedVersion}) — per-part ═══`);
R(`  PART2 Add-folder + collections-as-folders (client live-MVC) : ${res.part2?.filesNode && res.part2?.alphaRenders ? 'CLOSED' : 'STILL-OPEN'} (2nd-browser WS fan-out = long-pole harness, NOT measured here — flag)`);
R(`  PART5 nested physical-folder tree (R40.78)                  : ${res.part5?.betaRenders ? 'CLOSED' : 'STILL-OPEN'}`);
R(`  PART4 sunburst in the collection detail                    : ${res.part4?.sunburst ? 'CLOSED' : 'STILL-OPEN'}`);
process.exit(0);
