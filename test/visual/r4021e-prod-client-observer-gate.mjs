// T37.21 PART-2 CLIENT-HALF — COORDINATED READ-ONLY OBSERVER on PROD (PO-authorised; classifier-clean: this harness does
// NO prod write). The classifier correctly blocks a tester-driven prod create, so the EXPERT fires the create (their
// mutation, unblocked, and they own the measured cleanup + post-R40.78-restart re-verify). This gate ONLY observes: it
// stands up two owner browsers on prod /model, both subscribed to dir:src/shared, browser-2 PASSIVE, and POLLS for the
// EXPERT-created folder to appear via the live path (no reload). Live-insert requires the create to fire WHILE the browsers
// are already loaded+subscribed — so run this, ping the expert "OBSERVER ARMED", the expert creates within the window.
//   b1-shows  = the actor's own view would reflect it (here b1 is also just subscribed → its live path).
//   b2-frame  = a unit-changed WS frame reached passive browser-2 (server-broadcast half, already proven).
//   b2-insert = browser-2's /model tree live-inserted the node with NO reload (the open SUBSCRIBE+RENDER piece).
// PROD renders the full drill (expert-verified mof-m1→project:RawBin→rawbin:ts→dir:src/shared) so a RED is a CLEAN verdict.
import { webkit } from '@playwright/test';
import fs from 'node:fs';
const BASE = 'https://localhost:4444';
const PARENT = 'dir:src/shared';
const FOLDER = 'R4078-CLIENTGATE-DELETEME';      // the name the EXPERT will create
const WINDOW_S = 55;                              // poll window for the expert to fire the create
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim(); // identity seed — NEVER printed
// sm_session for the OWNER-GATED /model route (INV-D4 fail-closed): EXPERT-minted, written to a file OUTSIDE the repo.
// CONSUME + DELETE it immediately (minimal on-disk window), verify gone, and NEVER print the value (never-write-secret-values).
const SM_FILE = process.env.SM_SESSION_FILE || '/root/.rawbin/sm-session-r4078';
let SM_SESSION = null, smFileGone = null;
try { if (fs.existsSync(SM_FILE)) { SM_SESSION = fs.readFileSync(SM_FILE, 'utf8').trim() || null; fs.unlinkSync(SM_FILE); smFileGone = !fs.existsSync(SM_FILE); } } catch { /* absent */ }
console.log(`sm_session: present=${!!SM_SESSION} sourceFileDeleted=${smFileGone} (value NEVER printed)`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const WS_RECORDER = `(() => { const _WS = window.WebSocket; window.WebSocket = new Proxy(_WS, { construct(T, a) { const ws = new T(...a);
  ws.addEventListener('message', (ev) => { try { const m = JSON.parse(ev.data); if (m && m.type === 'unit-changed') (window.__frames = window.__frames || []).push({ ior: m.ior, uuid: m.uuid, at: Date.now() }); } catch {} }); return ws; } }); })();`;
const MATCH = (par) => `(() => { const t = document.getElementById('model-tree'); if (!t) return { found:false };
  const raw = ${JSON.stringify(par)};
  const n = [...t.querySelectorAll('rb-object-item, [ref], [data-ref], [uuid], [data-uuid]')].find((x) => [...x.attributes].some((a) => { const v = a.value; return v === raw || v.endsWith(':' + raw) || v === 'collection:' + raw; }));
  return { found: !!n }; })()`;

const browser = await webkit.launch();
let verdict = 'INCONCLUSIVE', exit = 1;
try {
  const mk = async () => {
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    if (SM_SESSION) await ctx.addCookies([{ name: 'sm_session', value: SM_SESSION, domain: 'localhost', path: '/' }]); // owner page-auth for /model
    await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
    await ctx.addInitScript(WS_RECORDER);
    const page = await ctx.newPage();
    await page.goto(BASE + '/model', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => { const t = document.getElementById('model-tree'); return t && t.querySelectorAll('rb-object-item, .tt-row, [ref]').length > 0; }, { timeout: 20000 }).catch(() => {});
    await sleep(600);
    return { ctx, page };
  };
  const treeText = (page) => page.evaluate(() => (document.getElementById('model-tree')?.textContent || '').replace(/\s+/g, ' ').trim());
  const expandTo = async (page, label) => {
    await page.evaluate(async (p) => { const t = document.getElementById('model-tree'); if (t && t.expandPath) await t.expandPath(p); }, ['mof-m1', 'project:RawBin', 'rawbin:ts', PARENT]);
    await page.waitForFunction(`(${MATCH(PARENT)}).found === true`, { timeout: 15000 }).catch(() => {});
    await sleep(700);
    const m = await page.evaluate(MATCH(PARENT));
    R(`  ${label}: ${PARENT} rendered+subscribed=${m.found}`);
    return m.found;
  };

  const b1 = await mk(); const b2 = await mk();
  const b1Ready = await expandTo(b1.page, 'browser-1'); const b2Ready = await expandTo(b2.page, 'browser-2');
  const s1 = await b1.page.evaluate(() => (window.__sent = 'S' + Math.floor(performance.now())));
  const s2 = await b2.page.evaluate(() => (window.__sent = 'S' + Math.floor(performance.now())));
  await b1.page.evaluate(() => { window.__frames = []; }); await b2.page.evaluate(() => { window.__frames = []; });
  const b2Before = await treeText(b2.page);

  R(`\n★ OBSERVER ARMED — both browsers on prod /model subscribed to ${PARENT} (b1=${b1Ready} b2=${b2Ready}). EXPERT: create '${FOLDER}' under ${PARENT} NOW. Polling ${WINDOW_S}s…\n`);

  let b1Shows = false, b2Shows = false, b2FrameGot = false, firstInsertAt = null;
  for (let i = 0; i < WINDOW_S; i++) {
    await sleep(1000);
    const b1t = await treeText(b1.page); const b2t = await treeText(b2.page);
    const fr = await b2.page.evaluate(() => window.__frames || []);
    if (b1t.includes(FOLDER)) b1Shows = true;
    if (fr.length > 0) b2FrameGot = true;
    if (b2t.includes(FOLDER) && b2t !== b2Before) { b2Shows = true; if (!firstInsertAt) firstInsertAt = i + 1; }
    if (b2Shows && b1Shows) break;
    if ((i + 1) % 10 === 0) R(`  …t+${i + 1}s: b1-shows=${b1Shows} b2-frame=${b2FrameGot}(${fr.length}) b2-insert=${b2Shows}`);
  }
  const b1NoReload = (await b1.page.evaluate(() => window.__sent)) === s1;
  const b2NoReload = (await b2.page.evaluate(() => window.__sent)) === s2;
  const frames = await b2.page.evaluate(() => window.__frames || []);

  R(`  RESULT: b1-shows=${b1Shows}(no-reload=${b1NoReload}) · b2-frame=${b2FrameGot}(${frames.length}) · b2-live-insert=${b2Shows}(no-reload=${b2NoReload})${firstInsertAt ? ` @t+${firstInsertAt}s` : ''}`);

  if (!b1Ready || !b2Ready) verdict = `BLOCKED: parent ${PARENT} did not render (b1=${b1Ready} b2=${b2Ready})${SM_SESSION ? '' : ' — NO sm_session (owner-gated /model served fail-closed, no #model-tree): the expert-minted session file was absent/empty'}.`;
  else if (!b2FrameGot && !b1Shows) verdict = `INCONCLUSIVE: no WS frame + no b1-change in ${WINDOW_S}s — the create likely did NOT fire during the window. Re-arm + have the expert create WHILE this polls.`;
  else if (b1Shows && b2Shows && b1NoReload && b2NoReload) { verdict = `GREEN — CLIENT HALF WORKS: browser-1 reflects the new folder and the PASSIVE browser-2 LIVE-INSERTED it over WS, both with NO reload. Two browsers updated without a reload = exactly what Tron asked for. (@390 real-WebKit, PROD.)`; exit = 0; }
  else verdict = `RED (CLEAN — prod renders the full drill): b1-shows=${b1Shows} b2-frame=${b2FrameGot}(${frames.length}) b2-live-insert=${b2Shows} b1-noreload=${b1NoReload} b2-noreload=${b2NoReload}. ${b2FrameGot && !b2Shows ? 'The frame ARRIVES but /model does NOT consume it into the DOM → the client ViewBus subscribe+live-insert (piece-2) is the real gap.' : ''}`;
} catch (e) {
  verdict = `ERROR: ${String(e && e.message).slice(0, 200)}`;
} finally {
  await browser.close().catch(() => {});
}
R(`\n═══ T37.21 PART-2 CLIENT-HALF (PROD, coordinated observer) ═══\n${verdict}`);
R(`EXPERT: cleanup owed for '${FOLDER}' under ${PARENT} (rmdir + unit + verify BOTH gone + git-clean + post-R40.78-restart API re-verify).`);
process.exit(/^GREEN/.test(verdict) ? 0 : 1);
