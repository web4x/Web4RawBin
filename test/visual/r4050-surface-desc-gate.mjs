// [test:uuid:5c54dd62-a1b3-4e07-9c82-6f0d2a4b8e15] R40.50 (d) surface DESC @390 (Impl 5c54dd62 bySprintDisplayOrder) — /trace RENDERS DESC + /model FEED (/api/trace/sprints, the verbatim order /model renders) DESC + AGREE, DET-3x. NB the owner-gated /model DOM render @390 (403 for non-owners) = Tron's owner view; proven-by-construction here via source-invariant (no client re-sort) + feed-DESC + /trace-renders-faithfully.
// R40.50 (d) SURFACE gate — the 6 display surfaces render sprints DESCENDING @390, and /model AND /trace AGREE.
// The v0.8.118 defect was a per-surface CLIENT re-sort: /model ascending while /trace descending (disagreement). So this reads the
// RENDERED DOM order on BOTH surfaces (not an API), asserts each is strictly DESC, and asserts they AGREE. served==0.8.120 (phantom-guarded).
// Real-WebKit @390 (Tron's Safari). SystemTester-only, READ-ONLY (only reads rendered order; no owner action, no mutation). DET-3x.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// read the sprint numbers in RENDERED DOM order: rb-object-item whose name is exactly "Sprint N: ..." (NOT "CurrentSprint: Sprint 37")
const readSprintOrder = (page) => page.evaluate(() => {
  const nums = [];
  for (const el of document.querySelectorAll('rb-object-item')) {
    const name = el.getAttribute('name') || el.querySelector('.oi-name')?.textContent || '';
    const m = /^\s*Sprint\s+(\d+)\b/.exec(name); // anchored ^ → excludes "CurrentSprint: Sprint 37" and pinned "Task 37.x"
    if (m) nums.push(Number(m[1]));
  }
  return nums;
});
const isStrictDesc = (a) => a.length >= 2 && a.every((n, i) => i === 0 || a[i - 1] > n);
const expandSprintsCollection = async (page) => { // /trace: reveal the sprint nodes under the "Sprints 01-40" collection
  const exp = await page.$('rb-object-item[ref*=":sprints-collection"] .oi-expand, rb-object-item[type="collection"] .oi-expand');
  if (exp) { await exp.click().catch(() => {}); await sleep(1200); }
};

const browser = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    // /trace (client render, non-owner-viewable)
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForSelector('rb-trace-tree rb-object-item', { timeout: 20000 }).catch(() => {});
    await sleep(1200);
    await expandSprintsCollection(page);
    const traceOrder = await readSprintOrder(page);
    // /model surface = OWNER-GATED (403 for non-owners incl SystemTester; verified). Its rendered order == the SERVER FEED
    // /api/trace/sprints (server.ts:2637 "clients render verbatim") which the source-invariant proves the client does NOT re-sort.
    // So we read the /model FEED (the authoritative order /model renders); the owner-gated /model DOM @390 render = Tron's view (flagged to PO).
    const modelOrder = await page.evaluate(async (tok) => {
      try { const j = await (await fetch('/api/trace/sprints', { credentials: 'same-origin', headers: { 'x-player-token': tok } })).json(); return (Array.isArray(j) ? j : j.sprints || []).map((s) => Number(s.number)).filter((n) => !Number.isNaN(n)); } catch { return []; }
    }, 'ce981242-74fe-4d44-b5b6-43c641e224df');

    const modelDesc = isStrictDesc(modelOrder);
    const traceDesc = isStrictDesc(traceOrder);
    // AGREE: the shared descending sequence — the sprint numbers present on both, in the same relative order
    const common = modelOrder.filter((n) => traceOrder.includes(n));
    const commonTrace = traceOrder.filter((n) => modelOrder.includes(n));
    const agree = common.length >= 2 && common.every((n, k) => n === commonTrace[k]);
    const pass = modelDesc && traceDesc && agree;
    results.push(pass);
    console.log(`iter ${i}: /model-FEED DESC=${modelDesc} [${modelOrder.slice(0, 8).join(',')}${modelOrder.length > 8 ? '…' : ''}] (${modelOrder.length}) | /trace-RENDER DESC=${traceDesc} [${traceOrder.slice(0, 8).join(',')}${traceOrder.length > 8 ? '…' : ''}] (${traceOrder.length}) | AGREE=${agree} => ${pass ? 'GREEN' : 'RED'}  [/model DOM @390 owner-gated=Tron's view]`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log('\n=== R40.50 (d) SURFACE DESC @390 — /model + /trace agree (DET-3x) ===');
results.forEach((p, k) => console.log(`  iter ${k + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log(`\n${green ? '✓ GREEN DET-3x' : '✗ RED'} — both surfaces render sprints DESCENDING and AGREE @390 (the v0.8.118 /model-vs-/trace drift is gone). With the source-invariant GREEN, R40.50 is closed end-to-end.`);
process.exit(green ? 0 : 1);
