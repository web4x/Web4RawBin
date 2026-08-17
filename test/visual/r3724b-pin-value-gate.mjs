// [test:uuid:3a6f0d92-8c14-4e7b-a5d0-9f2e1b7c6a48] T37.24 / R40.18 slice-1 AC-1 — CurrentSprint pin @390 real-WebKit VALUE + RENDER gate. Family: real-time-MVC / pin-correctness / payload-is-not-pixels.
// ★ CATCHES a false-green I made: the pin name RENDERS "📌 Current — Task 37.24:…" with a LITERAL "…" (a JS substring truncation, NOT CSS ellipsis → textOverflow:clip, scrollWidth==clientWidth) while the payload is FULL. So a DOM-string/clamp check passes while Tron sees a truncated name. Assert the RENDERED innerText (what's on screen), never the payload. served==0.8.99 phantom-guarded. DET-3x.
// PER-DEFECT (Tron screenshot 2026-08-17): (1) TRUNCATION — rendered current-row name must be FULL (no literal '…'); (2) ACTION-VISIBILITY — 'Set current'/'Set next' on a DERIVED pin (architect ruling retire-vs-label; measured+reported); (3) PROGRESS — checklist implementing box vs derived-shipped (req reconciling; measured+reported). VALUE — current == Task 37.24 (never 37.4-Planned).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import fs from 'node:fs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const OUT = 'test-results/r3724b-pin-value'; fs.mkdirSync(OUT, { recursive: true });
const ELLIPSIS = /[…]|\.\.\./; // literal ellipsis char OR three dots in the RENDERED name

const cfg = await (await fetch(`${BASE}/api/config`).catch(() => null))?.json?.().catch(() => ({})) || {};
const served = cfg.version || '?';

const browser = await webkit.launch({ headless: true });
const value = [], trunc = [];
let defect2 = null, defect3 = null;
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('.cs-pin-node'), { timeout: 20000 }).catch(() => {});
    await sleep(1500);

    const pin = await page.evaluate(() => {
      const node = document.querySelector('.cs-pin-node');
      const names = Array.from(node?.querySelectorAll('.oi-name') || []);
      const curEl = names.find((e) => /current/i.test(e.innerText || '') && /37\./.test(e.innerText || ''));
      const cur = curEl?.closest('rb-object-item') || curEl;
      const rect = curEl ? curEl.getBoundingClientRect() : null;
      return {
        found: !!curEl,
        renderedName: (curEl?.innerText || '').replace(/\s+/g, ' ').trim(), // what's ON SCREEN
        ref: cur?.getAttribute?.('ref') || '',
        visible: !!rect && rect.width > 0 && rect.height > 0 && rect.top < 844 && rect.bottom > 0,
        vw: window.innerWidth,
      };
    });
    await page.screenshot({ path: `${OUT}/pin-iter${i}.png` });

    // VALUE (render-based): names 37.24, not 37.4/Planned
    const valuePass = pin.found && pin.visible && pin.vw === 390 && /\b37\.24\b/.test(pin.renderedName)
      && !/\bplanned\b/i.test(pin.renderedName) && !/\b37\.4\b(?!\d)/.test(pin.renderedName.replace(/37\.24/g, '')) && served === '0.8.99';
    value.push(valuePass);
    // TRUNCATION (defect 1): the RENDERED name must NOT contain a literal ellipsis
    const notTruncated = pin.found && !ELLIPSIS.test(pin.renderedName);
    trunc.push(notTruncated);
    console.log(`iter ${i}: VALUE=${valuePass} TRUNC-ok=${notTruncated} | rendered="${pin.renderedName}" | ref=${pin.ref}`);

    // defects 2/3 measured ONCE (iter 1) via the current task's detail drawer
    if (i === 1 && pin.ref) {
      const uuid = pin.ref.includes(':') ? pin.ref.slice(pin.ref.indexOf(':') + 1) : pin.ref;
      await page.evaluate((u) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); } d.setAttribute('ref', `task:${u}`); }, uuid).catch(() => {});
      await sleep(1800);
      await page.screenshot({ path: `${OUT}/drawer-iter1.png` });
      const dr = await page.evaluate(() => {
        const d = document.querySelector('rb-detail-drawer');
        const txt = (d?.querySelector('.drawer-panel-detail')?.innerText || '');
        const btns = Array.from(d?.querySelectorAll('button, .rb-drawer-action, [data-verb]') || []).map(b => (b.textContent||'').replace(/\s+/g,' ').trim());
        return {
          setCurrentBtn: btns.some(t => /set current|set next|📌/i.test(t)), // defect 2: manual override on a derived pin
          checklistImplementing: /implementing/i.test(txt) ? (/\[x\]\s*implementing|implementing[\s\S]{0,6}\bx\b/i.test(txt) ? 'checked' : (/\[ \]\s*implementing/i.test(txt) ? 'UNCHECKED' : 'present-state-unclear')) : 'not-shown',
          detailLen: txt.length,
        };
      });
      defect2 = dr.setCurrentBtn; defect3 = dr.checklistImplementing;
    }
    await ctx.close();
  }
} finally { await browser.close(); }

const g = (a) => a.length === 3 && a.every(Boolean);
console.log('\n===== T37.24 AC-1 pin @390 real-WebKit (served ' + served + ') — PER-DEFECT =====');
console.log(`  VALUE (current == Task 37.24, not 37.4-Planned): ${g(value) ? 'GREEN' : 'RED'} (${value.filter(Boolean).length}/3)`);
console.log(`  DEFECT-1 TRUNCATION (rendered name has NO literal '…'): ${g(trunc) ? 'GREEN' : 'RED — name is truncated on screen'} (${trunc.filter(Boolean).length}/3)`);
console.log(`  DEFECT-2 ACTION-VISIBILITY (Set current/next on a DERIVED pin): ${defect2 === null ? 'not-measured' : defect2 ? 'RED — buttons PRESENT (architect ruling retire-vs-label pending)' : 'GREEN — absent'}`);
console.log(`  DEFECT-3 PROGRESS (implementing checkbox vs derived-shipped): implementing=${defect3} ${defect3 === 'UNCHECKED' ? 'RED — shows unchecked though implementing shipped (req reconciling)' : defect3 === 'checked' ? 'GREEN' : '(measured; req reconciling)'}`);
console.log('  Screenshots: ' + OUT + '/pin-iter*.png + drawer-iter1.png (surface to Tron)');
console.log('  ⏳ DEVICE-ONLY → TRON @390 finger (never headless-green): live-on-advance (advance→pin re-derives no-reload) + final truncation finger-confirm.');
const overall = g(value) && g(trunc) && defect2 === false && (defect3 === 'checked' || defect3 === 'not-shown');
console.log('OVERALL:', overall ? 'GREEN DET-3x' : 'RED — live defect(s) present (this gate now CATCHES what the payload check missed)');
process.exitCode = overall ? 0 : 1;
