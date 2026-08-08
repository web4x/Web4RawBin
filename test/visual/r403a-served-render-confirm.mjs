// [test:uuid:f2c7b3e9-4d81-4a06-b5e2-9c14f8d3a670] R40.3-A AC-1 RbKeyboardBar.suppressSoftKeyboard (Impl c3a56e56) — the terminal input target is configured to suppress the OS keyboard (inputmode=none + readonly) without losing the controller input path; verified on served 0.8.67 @390 real-WebKit.
// [test:uuid:b8e4a1c2-7f39-4d5b-a061-2e9c6f04b8d1] R40.3-A AC-2+AC-5 RbKeyboardBar.renderKeyMap (Impl dbdcc42d) — the keyboard bar RENDERS 8 data-driven keys read from the config unit (j.unit.model.keys) and a key tap dispatches its byte sequence to the PTY ws (suppression did not break typing); served 0.8.67.
// R40.3-A — SERVED-RENDER CONFIRMATION on 0.8.67 (wrapper fix live). The r403a RED baseline proved the keyboard bar was
// ABSENT (component read j.model.keys; /api/ior wraps at j.unit.model.keys). This confirms the fix END-TO-END: the REAL
// fixed component (esbuild'd from HEAD == served 0.8.67) mounted @390 real-WebKit, fetching the REAL /api/ior, RENDERS the
// keyboard bar with 8 keys (not the empty-array no-bar state). Terminal ws is owner-gated → mocked at the client boundary.
//   [SERVED-RENDER] the .rb-keybar renders with 8 buttons read from j.unit.model.keys — the exact RED→GREEN flip.
//   [HARNESS] AC-1 suppress-attrs on the xterm textarea · AC-2 keybar tap → the fixed component's sendSeq→ws.send PTY bytes.
// On GREEN: AC-1/2/5 markers → req; AC-3 terminal-visible + AC-4 input-row-not-overlaying + AC-OSK UNBLOCK → Tron owner-device QA.
import { webkit, devices } from '@playwright/test';
import { execSync } from 'node:child_process';
import { seedSystemTester } from './system-tester-setup.mjs';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const BUNDLE = `${ROOT}/test-results/r403a-render/term.bundle.js`;
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

execSync(`mkdir -p ${ROOT}/test-results/r403a-render`, { cwd: ROOT });
execSync(`npx esbuild src/public/ts/trace/rb-terminal-detail.ts --bundle --format=iife --loader:.css=text --outfile=${BUNDLE}`, { cwd: ROOT, stdio: 'pipe' });

// mock ONLY the owner-gated terminal ws (readyState OPEN + record sends); real /api/ior fetch passes through
const INIT = `(() => {
  const Real = window.WebSocket;
  function Hook(url, proto) {
    if (String(url).includes('/api/server-manager/terminal')) {
      const f = { url, readyState: 1, binaryType: 'arraybuffer', onopen: null, onmessage: null, onclose: null,
        send(d){ (window.__wsSends = window.__wsSends || []).push(typeof d === 'string' ? d : Array.from(new Uint8Array(d))); }, close(){ this.readyState = 3; } };
      setTimeout(() => { try { f.onopen && f.onopen(); } catch(e){} }, 0); return f;
    }
    return proto !== undefined ? new Real(url, proto) : new Real(url);
  }
  Hook.CONNECTING=0; Hook.OPEN=1; Hook.CLOSING=2; Hook.CLOSED=3; window.WebSocket = Hook;
})()`;

const browser = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    await ctx.addInitScript(INIT);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' }); // prod origin → relative /api/ior fetch resolves
    const defined = await page.evaluate(() => !!customElements.get('rb-terminal-detail')); // /trace bundle does NOT define it (tag-string only)
    await page.addScriptTag({ path: BUNDLE }).catch(() => {}); // inject the REAL fixed component (defines rb-terminal-detail w/ xterm)
    await page.evaluate(() => {
      const host = document.createElement('div'); host.id = 'th'; host.style.cssText = 'width:390px;height:600px'; document.body.appendChild(host);
      const el = document.createElement('rb-terminal-detail'); el.setAttribute('uuid', '%0'); host.appendChild(el);
    });
    await page.waitForSelector('rb-terminal-detail .rb-keybar', { timeout: 12000 }).catch(() => {});
    await sleep(1200); // xterm open + real /api/ior fetch + keybar render

    const m = await page.evaluate(() => {
      const td = document.querySelector('rb-terminal-detail');
      const bar = td && td.querySelector('.rb-keybar');
      const keys = bar ? Array.from(bar.querySelectorAll('button')).map(b => (b.textContent || '').trim()) : [];
      const ta = td && td.querySelector('.xterm-helper-textarea');
      return { hasBar: !!bar, nKeys: keys.length, keys, ta: ta ? { inputmode: ta.getAttribute('inputmode'), readonly: ta.hasAttribute('readonly') } : null };
    });

    // AC-2: tap a keybar key → the fixed component's sendSeq → mock ws.send gets the PTY bytes
    await page.evaluate(() => { window.__wsSends = []; const b = Array.from(document.querySelectorAll('rb-terminal-detail .rb-keybar button')).find(x => (x.textContent || '').trim() === 'Esc'); if (b) b.click(); });
    await sleep(150);
    const sends = await page.evaluate(() => window.__wsSends || []);
    const reachesPTY = sends.some(s => Array.isArray(s) && s[0] === 27); // Esc → 0x1b

    const barRenders = m.hasBar && m.nKeys >= 8;                    // ★ RED→GREEN: 8 keys from j.unit.model.keys, NOT empty
    const suppress = !!m.ta && m.ta.inputmode === 'none' && m.ta.readonly === true;
    const pass = barRenders && suppress && reachesPTY;
    results.push(pass);
    if (i === 1) await page.screenshot({ path: 'test-results/r403a-render/bar-renders.png' }).catch(() => {});
    console.log(`iter ${i}: (trace-predefined=${defined}) ★[SERVED-RENDER]bar-renders=${barRenders}(${m.nKeys} keys: ${m.keys.join('/')}) [HARNESS]AC1-suppress=${suppress}(${JSON.stringify(m.ta)}) AC2-reachesPTY=${reachesPTY} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.3-A SERVED-RENDER confirm @390 real-WebKit (served 0.8.67) DET-3x =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — keyboard bar RENDERS on served 0.8.67' : 'RED');
process.exitCode = green ? 0 : 1;
