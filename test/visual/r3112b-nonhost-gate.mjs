// [test:uuid:3e57bca1-089e-43ea-b3cf-ae69144b2b33] R31.12 v0.7.144 non-host/read-only/server-guard — GREEN DET-3x engine-independent @390 (sw+/api/config 0.7.144): (1) title role=button+tabindex=0 (real interactive, not h2), (2) non-host title-tap UN-GATED opens Room Settings, (3) non-host READ-ONLY (inputs disabled + Save removed + save-handler host-only), (4) server REJECTS non-owner UPDATE_ROOM_CONFIG (ERROR owner, reject-first, pollution-safe). tap-FIRES-on-real-WebKit rides Tron device (like R30.53 codicon). Impls: read-only openRoomEditor f9b579c1 (direct) + role=button/non-host-tap rides rb-header T40 39074a59 (impl-edit) + server owner-guard UPDATE_ROOM_CONFIG @server.ts:2666 (NO marker yet -> req/architect mint or ride a message-handler impl).
// R31.12 v0.7.144 — non-host title-tap + read-only settings + server owner-guard. Gates the ENGINE-INDEPENDENT parts
// (Chromium can't validate 'tap FIRES on real iOS WebKit' — it false-greened the old <h2> click; that piece = Tron device).
// (1) title is role=button + tabindex (real interactive, not a plain h2) — the WebKit-tappable affordance.
// (2) title-tap is bound for a NON-host too (un-gated from show-edit): a non-host member tapping the title opens settings.
// (3) non-host READ-ONLY: the Room Settings modal has all inputs disabled, NO Save button, save-handler host-only.
// (4) server REJECTS a non-owner UPDATE_ROOM_CONFIG (server.ts:2671 reject-first, before any mutation → POLLUTION-SAFE).
// SystemTester joins Marcel's dnd room 3231db71 = a real NON-host member. Client served sw==rawbin-v0.7.144 + /api/config 0.7.144.
import { devices, chromium, webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { WebSocket } from 'ws';
import https from 'node:https';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const CLIENT_VER = 'rawbin-v0.7.144';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((res) => { const r = https.request({ host: HOST, port: PORT, path: p, rejectUnauthorized: false }, (x) => { let b = ''; x.on('data', c => b += c); x.on('end', () => res(b)); }); r.on('error', () => res('')); r.end(); });

// (4) raw-ws: non-owner UPDATE_ROOM_CONFIG → server ERROR "owner" (reject-first, room unchanged)
const serverRejectProbe = () => new Promise((resolve) => {
  const ws = new WebSocket(`wss://${HOST}:${PORT}`, { rejectUnauthorized: false });
  let sent = false; const out = { rejected: false, accepted: false, errMsg: '' };
  const done = () => { try { ws.close(); } catch { /* */ } resolve(out); };
  const t = setTimeout(done, 9000);
  ws.on('open', () => ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ST, deviceId: 'r3112b-nonowner-probe' })));
  ws.on('message', (d) => {
    let m; try { m = JSON.parse(d.toString()); } catch { return; }
    if (!sent && (m.type === 'PROFILE' || m.type === 'IDENTIFIED' || m.type === 'WELCOME' || m.type === 'ROOM_LIST')) {
      sent = true; setTimeout(() => ws.send(JSON.stringify({ type: 'UPDATE_ROOM_CONFIG', roomId: DND, name: 'R31.12-nonowner-probe', playerToken: ST })), 400);
    }
    if (m.type === 'ERROR' && /owner/i.test(m.message || '')) { out.rejected = true; out.errMsg = m.message; clearTimeout(t); done(); }
    if (m.type === 'ROOM_CONFIG_UPDATED') { out.accepted = true; clearTimeout(t); done(); } // would be the BUG (server accepted a non-owner)
  });
  ws.on('error', () => { clearTimeout(t); done(); });
});

// (1)(2)(3) browser: role=button, non-host tap→read-only modal, inputs disabled + no Save
async function browserArcs(engine, label) {
  const browser = await engine.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
  try {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/app?join=${DND}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').startsWith('room:'), { timeout: 15000 }).catch(() => {});
    await sleep(1500);
    const roleBtn = await page.evaluate(() => { const t = document.querySelector('.rb-header-title'); return t ? { role: t.getAttribute('role'), tabindex: t.getAttribute('tabindex'), cursor: getComputedStyle(t).cursor } : null; });
    await page.click('.rb-header-title', { timeout: 5000 }).catch(() => {});
    await sleep(700);
    const modal = await page.evaluate(() => {
      const has = !!document.querySelector('#re-name');
      const inputs = Array.from(document.querySelectorAll('#re-name, input[name=re-vis], input[name=re-mode]'));
      const allDisabled = inputs.length > 0 && inputs.every(i => i.disabled === true);
      const saveGone = !document.querySelector('#re-save');
      const h3 = document.querySelector('div[style*="position:fixed"] h3, div[style*="position: fixed"] h3')?.textContent || (Array.from(document.querySelectorAll('h3')).find(h => /Room Settings/.test(h.textContent))?.textContent || '');
      return { has, allDisabled, saveGone, h3 };
    });
    await ctx.close();
    return { roleBtn, modal };
  } finally { await browser.close(); }
}
const roleOk = (r) => r.roleBtn?.role === 'button' && r.roleBtn?.tabindex === '0';
const tapReadOnlyOk = (r) => r.modal?.has === true && r.modal?.allDisabled === true && r.modal?.saveGone === true; // non-host: modal opens, all inputs disabled, no Save

// ── version guard ──
const sw = await httpGet('/sw.js'); const cn = (sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
const cfg = await httpGet('/api/config'); let sv = null; try { sv = JSON.parse(cfg).version; } catch { /* */ }
console.log(`client sw=${cn} | server /api/config=${sv}`);

const results = [];
if (cn !== CLIENT_VER) { console.log(`ABORT phantom-guard: sw ${cn} != ${CLIENT_VER}`); process.exitCode = 1; }
else {
  for (let i = 1; i <= 3; i++) {
    const b = await browserArcs(chromium, 'chromium');
    const sr = await serverRejectProbe();
    const pass = roleOk(b) && tapReadOnlyOk(b) && sr.rejected && !sr.accepted;
    results.push(pass);
    console.log(`iter ${i}: role=button=${roleOk(b)}(${JSON.stringify(b.roleBtn)}) | nonhost-tap→readonly=${tapReadOnlyOk(b)}(modal=${b.modal?.has} disabled=${b.modal?.allDisabled} noSave=${b.modal?.saveGone} h3="${b.modal?.h3}") | server-rejects-nonowner=${sr.rejected}(accepted=${sr.accepted} "${sr.errMsg}") => ${pass ? 'GREEN' : 'RED'}`);
  }

  // ── WebKit attempt (the tap-FIRES-on-WebKit part Chromium can't validate) ──
  let wk = 'NOT ATTEMPTED';
  try { const b = await browserArcs(webkit, 'webkit'); wk = `LAUNCHED — role=button=${roleOk(b)} nonhost-tap→readonly=${tapReadOnlyOk(b)} (real-WebKit tap fired the modal: ${b.modal?.has})`; }
  catch (e) { wk = `UNLAUNCHABLE here (${(e.message || '').split('\n')[0].slice(0, 80)}) → tap-FIRES-on-WebKit = TRON DEVICE (like R30.53 codicon)`; }
  console.log(`\nWebKit @390: ${wk}`);
}

console.log('\n===== R31.12 v0.7.144 non-host / read-only / server-guard (engine-independent, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL (engine-independent):', green ? 'GREEN DET-3x' : 'RED');
if (process.exitCode !== 1) process.exitCode = green ? 0 : 1;
