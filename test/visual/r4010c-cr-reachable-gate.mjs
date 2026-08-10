// [test:uuid:67697d86-b488-4e81-bd80-3e7b38674fda] (READY, DO NOT MINT WHILE RED) R40.10 BUG-A — after a decline, the minted ChangeRequest must be REACHABLE as a child/itemView on
// the TASK DETAIL surface, not merely existing in the store. GATE-THE-AC-SURFACE: the r4010 tsx gate proved the SERVER
// effect (CR minted + status→In Progress) but never the USER-FACING outcome (Tron sees 'Forward Links: no links').
// Root: rb-task-detail renders forwardOnly(obj) = the LOCKED 7-step chain forward keys only → changeRequests is filtered out.
// Fixture = Tron's REAL declined task cec4747a carrying CR d12b4c7f. @390 real-WebKit. RED until the CR is rendered as a
// child/itemView on the task detail (architect diagnoses forwardOnly/task-detail; expert builds). Ready marker on GREEN.
import { webkit, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const TASK = 'cec4747a-e235-4e65-b59b-3f82f0cbeee3';   // Tron's declined task (status In Progress)
const CR = 'd12b4c7f-065a-49b6-acf9-92624aeaed44';     // the minted ChangeRequest it must surface
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await webkit.launch();
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});

    // open the task's detail surface (R30.21 fetch-fallback resolves the unit + renders rb-task-detail)
    await page.evaluate((t) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); } d.setAttribute('ref', `task:${t}`); }, TASK);
    await sleep(1800);

    const r = await page.evaluate((cr) => {
      const d = document.querySelector('rb-detail-drawer');
      const html = (d?.querySelector('.drawer-panel-detail, rb-task-detail') || d)?.innerHTML || '';
      const taskRendered = /Task<\/span>|dv-type-task|Forward Links/.test(html) && html.length > 300; // control: the task detail DID render
      // BUG-A assertion: the CR must be REACHABLE — its uuid or a 'Change Request' itemView present on the task surface
      const crReachable = html.includes(cr) || /Change Request/i.test(html);
      const saysNoLinks = /no links/i.test(html);
      return { taskRendered, crReachable, saysNoLinks, len: html.length };
    }, CR);

    const pass = r.taskRendered && r.crReachable;   // GREEN only when the task renders AND the CR is reachable from it
    results.push(pass);
    console.log(`iter ${i}: task-detail-rendered=${r.taskRendered}(control) | CR-reachable-from-task=${r.crReachable} | (says-no-links=${r.saysNoLinks}, detail ${r.len}c) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.10 BUG-A: ChangeRequest reachable from task detail @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED — CR minted server-side but NOT reachable on the task surface (BUG-A, gate-the-AC-surface)');
process.exitCode = green ? 0 : 1;
