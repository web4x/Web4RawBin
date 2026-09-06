// R40.90 cleanup exec — deleteRoom BOTH ours by KNOWN ID (no listing; direct), as SystemTester (owner). Live-memory drop +
// ROOM_DELETED broadcast (Tron's view clears). Disk removal is a separate step. Verify each room no longer resolves via /api/ior.
import { webkit } from '@playwright/test';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYSTEST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ROOM_IDS = ['2d6ac765-4fa7-4504-b311-5ebe409ae04b', 'ae7e2adc-dbec-4ac8-850f-f504c3719e59'];
const iorGet = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res({ status: r.statusCode, hasUnit: /"unit"|"model"/.test(d) })); }).on('error', () => res({ status: 0, hasUnit: false })); });

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYSTEST);
  const page = await ctx.newPage();
  await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  for (const id of ROOM_IDS) { const sent = await page.evaluate((rid) => { const c = window.__rawbinClient; if (c?.deleteRoom) { c.deleteRoom(rid); return true; } return false; }, id); R(`  deleteRoom(${id.slice(0, 8)}) sent=${sent}`); await sleep(1500); }
  await sleep(2000);
  await ctx.close();
} finally { await browser.close().catch(() => {}); }
for (const id of ROOM_IDS) { const g = await iorGet(id); R(`  VERIFY /api/ior ${id.slice(0, 8)}: status=${g.status} stillResolves=${g.hasUnit}  ${g.hasUnit ? '(still on disk — disk-remove next)' : 'GONE from resolver'}`); }
