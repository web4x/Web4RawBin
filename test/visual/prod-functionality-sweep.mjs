// PROD FUNCTIONALITY SWEEP @390 (PO, Tron's width) — walk the real user paths, screenshot each, report what is
// BROKEN / EMPTY / WRONG. Screenshot evidence, not DOM counts. SystemTester identity (ce981242) for room paths (HARD RULE).
// Read-only walk (no room create, no real chat send, no file write to prod). Known suspect: T36.3 method-detail unenriched.
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const iPhone = devices['iPhone 12'];
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DIR = 'test-results/prod-sweep';
fs.mkdirSync(DIR, { recursive: true });
const findings = [];
const note = (path, verdict, detail) => { findings.push({ path, verdict, detail }); console.log(`  [${verdict}] ${path}: ${detail}`); };

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYS);
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(String(e).slice(0, 120)));
  const shot = (n) => page.screenshot({ path: `${DIR}/${n}.png` }).catch(() => {});
  const bodyText = () => page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300));

  // ── 1. ROOM LIST (/app) ──
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }).catch(() => {});
  await sleep(2000); await shot('01-app-roomlist');
  const t1 = await bodyText();
  const rooms = await page.evaluate(() => document.querySelectorAll('[class*="room"], rb-room, .room-item, [data-room]').length);
  note('1-room-list', t1.length > 20 ? 'OK?' : 'EMPTY', `rooms-ish=${rooms} | "${t1.slice(0, 120)}"`);

  // ── 2. ENTER A ROOM ──
  const entered = await page.evaluate(() => { const r = document.querySelector('[class*="room"], .room-item, [data-room]'); if (r) { r.click(); return true; } return false; });
  await sleep(2500); await shot('02-room-entered');
  const t2 = await bodyText();
  note('2-enter-room', entered ? (t2.length > 20 ? 'OK?' : 'EMPTY') : 'BROKEN', entered ? `"${t2.slice(0, 120)}"` : 'no clickable room element found');

  // ── 3. CHAT ──
  const chat = await page.evaluate(() => ({ input: !!document.querySelector('textarea, input[type=text], [contenteditable]'), msgs: document.querySelectorAll('[class*="message"], [class*="msg"], .chat-line').length }));
  await shot('03-chat'); note('3-chat', chat.input ? 'OK?' : 'BROKEN', `composer=${chat.input} messages-ish=${chat.msgs}`);

  // ── 4. FILE DROP (presence of a drop target; not writing a real file to prod) ──
  const drop = await page.evaluate(() => !!document.querySelector('[class*="drop"], [ondrop], .dropzone, [class*="upload"]'));
  note('4-file-drop', drop ? 'OK?' : 'UNKNOWN', `drop-target-present=${drop} (real drop = manual/Tron)`);

  // ── 5. TRACE VIEW (/trace) ──
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 0, { timeout: 20000 }).catch(() => {});
  await sleep(1500); await shot('05-trace');
  const trace = await page.evaluate(() => ({ items: document.querySelectorAll('rb-object-item').length, cs: /CurrentSprint:\s*Sprint\s*\d+/.test(document.querySelector('rb-trace-tree')?.textContent || ''), text: (document.querySelector('rb-trace-tree')?.textContent || '').replace(/\s+/g, ' ').slice(0, 100) }));
  note('5-trace-view', trace.items > 1 && trace.cs ? 'OK?' : (trace.items > 0 ? 'PARTIAL' : 'EMPTY'), `items=${trace.items} pin=${trace.cs} "${trace.text}"`);

  // ── 6. SCENARIO DETAIL (open a node's detail) ──
  await page.evaluate(() => { const it = document.querySelector('rb-object-item'); it?.dispatchEvent(new CustomEvent('open-detail', { bubbles: true })); it?.click(); });
  await sleep(2000); await shot('06-scenario-detail');
  const det = await page.evaluate(() => { const d = document.querySelector('rb-detail-drawer, .drawer-panel-detail, [class*="detail"]'); return { present: !!d, text: (d?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200) }; });
  note('6-scenario-detail', det.present && det.text.length > 30 ? 'OK?' : (det.present ? 'EMPTY' : 'BROKEN'), `"${det.text.slice(0, 140)}"`);

  // ── 7. METHOD DETAIL — T36.3 enrichment suspect (137/138 unenriched) ──
  // find a real Method uuid via /api/trace, mount its detail, assess ENRICHMENT (signature/description vs bare stub)
  const method = await page.evaluate(async () => {
    try {
      const sprints = await (await fetch('/api/trace/children/8e8b32d6-22bf-46f7-bf5c-7da31ef41e19?mode=trace')).json();
      // walk to a method: sprint→task→uc→class→method is deep; instead scan /api/trace for any Method via a class
      return null;
    } catch { return null; }
  });
  // direct: query a couple of method units for enrichment (content-evidence, not a DOM count)
  const methEnrich = await page.evaluate(async () => {
    const out = [];
    // pull methods from a known class chain via the trace API is deep; sample /api/ior on method-shaped units from the tree
    const items = [...document.querySelectorAll('rb-object-item')].map((x) => x.getAttribute('ref') || '').filter((r) => r.startsWith('method:')).slice(0, 3);
    for (const ref of items) {
      const u = ref.split(':').pop();
      try { const j = await (await fetch(`/api/ior/ior:instance:${u}`)).json(); const m = j?.unit?.model || {}; out.push({ u: u.slice(0, 8), name: (m.name || '').slice(0, 40), hasDesc: !!m.description, hasSig: !!(m.signature || m.params || m.returns), keys: Object.keys(m).length }); } catch {}
    }
    return out;
  });
  await shot('07-method-detail');
  note('7-method-detail', methEnrich.length ? (methEnrich.every((m) => m.hasDesc || m.hasSig) ? 'OK?' : 'WRONG(T36.3?)') : 'NO-METHOD-ON-SURFACE', JSON.stringify(methEnrich));

  await ctx.close();
  console.log(`\n  JS errors during sweep: ${jsErrors.length ? JSON.stringify(jsErrors.slice(0, 5)) : 'none'}`);
} finally { await browser.close().catch(() => {}); }

console.log(`\n═══ PROD @390 FUNCTIONALITY SWEEP — findings ═══`);
for (const f of findings) console.log(`  [${f.verdict}] ${f.path}: ${f.detail}`);
console.log(`Screenshots in ${DIR}/ (01..07).`);
