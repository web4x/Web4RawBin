// R40.50 (d) /model DOM render — ISOLATED SCRATCH at the 0.8.120 build (PO option d). The /model surface is OWNER-gated (403 on prod
// for non-owners), so we render its REAL DOM in scratch with an owner session minted from the SYSTEM literal (ServerManagerGuard OWNER_TOKEN
// — NOT a human credential; runtime-read, headers-only, absent from committed files). Real WebKit @390. NO prod credential, NO Tron burden.
// Honest layered claim: this = REAL /model DOM renders DESC; r4050-surface-desc-gate = prod /model FEED DESC + /trace render DESC; source-invariant = no re-sort can exist.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
const COMMIT = process.env.R4050_COMMIT || 'c45f10fd6'; // deploy(R40.50) v0.8.120
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isDesc = (a) => a.length >= 2 && a.every((n, i) => i === 0 || a[i - 1] > n);

const f = await setupFoundation({ commit: COMMIT, buildDist: true });
const oh = f.ownerHeaders(); const smSession = (/sm_session=([^;]+)/.exec(oh.Cookie || '') || [])[1] || '';
const cookie = { name: 'sm_session', value: smSession, domain: 'localhost', path: '/', httpOnly: true, secure: true };
const browser = await webkit.launch({ headless: true });
const raw = { servedVersion: f.servedVersion, worktreeSha: f.worktreeSha };
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  await page.goto(`${f.base}/model`, { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForSelector('rb-object-item', { timeout: 20000 }).catch(() => {});
  await sleep(1800);
  raw.itemCount = await page.evaluate(() => document.querySelectorAll('rb-object-item').length);
  raw.topLevel = await page.evaluate(() => [...document.querySelectorAll('rb-object-item')].map((el) => (el.getAttribute('name') || el.querySelector('.oi-name')?.textContent || '').slice(0, 30)));
  // /model path to sprints — the architect's banked selector (PO): CurrentSprint + Sprint N folders sit under RawBin →
  // TRACEABILITY (not diagrams). Use the expandPath METHOD (the click-.oi-expand approach found no handles).
  raw.nav = await page.evaluate(async () => { try { const t = document.querySelector('rb-trace-tree'); await t?.expandPath?.(['mof-m1', 'project:RawBin', 'rawbin:traceability']); return 'expandPath(mof-m1/project:RawBin/rawbin:traceability)'; } catch (e) { return 'expandPath-ERR:' + (e && e.message || e); } });
  await sleep(1800);
  raw.modelDomOrder = await page.evaluate(() => { const nums = []; for (const el of document.querySelectorAll('rb-object-item')) { const name = el.getAttribute('name') || el.querySelector('.oi-name')?.textContent || ''; const m = /^\s*Sprint\s+(\d+)\b/.exec(name); if (m) nums.push(Number(m[1])); } return nums; });
  raw.sampleNames = await page.evaluate(() => [...document.querySelectorAll('rb-object-item')].slice(0, 12).map((el) => (el.getAttribute('name') || el.querySelector('.oi-name')?.textContent || '').slice(0, 28)));
  await ctx.close();
} finally { await browser.close(); raw.teardown = await f.teardown(); }

console.log(JSON.stringify(raw, null, 2));
const rendered = raw.modelDomOrder.length >= 2;
const desc = isDesc(raw.modelDomOrder);
const prodSafe = raw.teardown?.prodUp === true && raw.teardown?.leftover === 0;
console.log('\n=== R40.50 (d) /model DOM render (SCRATCH @ 0.8.120 build, owner session from system literal) ===');
console.log(`  served=${raw.servedVersion} worktree=${raw.worktreeSha} · itemCount=${raw.itemCount} · /model DOM sprint order=[${raw.modelDomOrder.join(',')}]`);
console.log(`  DESC=${desc} · rendered=${rendered} · prod:4444 untouched=${prodSafe}`);
let verdict, exit;
if (!prodSafe) { verdict = `INVALID — teardown not clean (prodUp=${raw.teardown?.prodUp}, leftover=${raw.teardown?.leftover})`; exit = 2; }
else if (!rendered) { verdict = `FINDING (report, do NOT fall back to by-construction): scratch rendered /model but found no Sprint rows to read (itemCount=${raw.itemCount}, sample=${JSON.stringify(raw.sampleNames)}). The /model DOM sprint order could not be observed with what is built — hand to PO/architect.`; exit = 1; }
else if (desc) { verdict = `✓ /model DOM RENDERS DESC (REAL render @390, scratch v${raw.servedVersion}) — [${raw.modelDomOrder.join(',')}]. Layered with prod /model FEED DESC + /trace render DESC + source-invariant (no re-sort) = measured at every layer. R40.50 (d) COMPLETE.`; exit = 0; }
else { verdict = `RED — /model DOM rendered ASCENDING/non-DESC [${raw.modelDomOrder.join(',')}] — the /model surface is NOT descending (real defect).`; exit = 1; }
console.log(`\n${exit === 0 ? '✓' : exit === 2 ? '⊘' : '✗'} ${verdict}`);
process.exit(exit);
