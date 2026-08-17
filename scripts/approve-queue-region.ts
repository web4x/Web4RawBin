/**
 * One-pass APPROVE verdict-surface (Tron order #4) — the ~40 QA-Review tasks presented so Tron approves in a
 * single sitting @390 phone, bucketed so he does NO triage.
 *
 * RULES (PO 2026-08-12): GENERATED from measured units (never hand prose — that is the 11/9-vs-5/1 rot); phone-
 * readable @390 (short bullet rows, not wide tables); each row carries its CHECKABLE evidence + what it still needs;
 * NOTHING pre-marked Done (Done is Tron's act via R40.10, recorded as approvedBy/approvedAt DATA). THREE buckets:
 *   (1) READY-TO-APPROVE  — evidence-complete (two-keyed passing Test MEASURED); he just says yes.
 *   (2) NOT-READY         — at QA-Review but evidence INCOMPLETE, the one missing thing named; NOT approvable
 *                           (rubber-stamping an unevidenced row = the false-Done we refuse).
 *   (3) NEEDS-DEVICE-ACTION— device/pixel ACs (@390 tap/render, AC-5-DEVICE) — a DISTINCT act, batch into one
 *                           device sitting. Device takes precedence (a device row is not silently 'approvable').
 *
 * SINGLE SOURCE, NO FORK: measurement = scripts/qa-evidence-audit.mjs --json (the two-keyed passing Test per QA
 * task + a measured device-AC flag); status glyph = the SHARED statusSymbol() from src/ts/scenario/task-status.ts
 * (same vocabulary as the planning.md board — imported, never re-defined). This file only FORMATS + writes via the
 * R37.8 owned-output-guard; curated header outside the region preserved (C7).
 *
 * Run: node --import tsx scripts/approve-queue-region.ts [--write | --bite]   (default = --check; drift/vacuous = RED)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { guardedWriteRegion } from './owned-output-guard.js';
import { BEGIN, END } from '../src/ts/scenario/sprint-overview-generator.js';
import { statusSymbol } from '../src/ts/scenario/task-status.js'; // THE shared status vocabulary — no 2nd vocabulary

type QaTask = { sp: string; uuid: string; name: string; covered: boolean; testName: string; reason: string; device: boolean; checklist: string };
type Measure = { counts: { qaReview: number; wouldPass: number; would409: number; device: number }; qaTasks: QaTask[] };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC_REL = 'scrum.pmo/approve-queue.md';
const DOC = process.env.RAWBIN_APPROVE_PATH || path.join(ROOT, DOC_REL);
const WRITE = process.argv.includes('--write');
const fail = (msg: string): never => { console.error(`FAIL approve-queue: ${msg}`); process.exit(1); };

// SINGLE measurement source: qa-evidence-audit.mjs --json (spawned with the same node running this writer).
function measure(): Measure {
  const raw = execFileSync(process.execPath, [path.join(ROOT, 'scripts/qa-evidence-audit.mjs'), '--json'], { cwd: ROOT, encoding: 'utf-8' });
  return JSON.parse(raw) as Measure;
}

function emitRegionInner(d: Measure): string {
  const t = d.qaTasks;
  const ready = t.filter((x) => x.covered && !x.device);
  const notReady = t.filter((x) => !x.covered && !x.device);
  const device = t.filter((x) => x.device); // device takes precedence over covered
  const row = (x: QaTask, note: string): string => `- ${statusSymbol(x.checklist)} **${x.sp} ${x.uuid}** ${x.name}${note ? ` — _${note}_` : ''}`;
  const out: string[] = [];
  out.push('### One-pass approve — measured from units (do not hand-edit between the markers)');
  out.push('');
  out.push('_Nothing here is Done — Done is YOUR act (approve → recorded as approvedBy/approvedAt DATA). Readiness = a MEASURED two-keyed passing Test on the unit, never a status claim._');
  out.push('');
  out.push(`#### ✅ READY TO APPROVE — ${ready.length} (evidence-complete; one-pass yes)`);
  if (!ready.length) out.push('- (none)');
  for (const x of ready) out.push(row(x, x.testName ? `Test: ${x.testName}` : 'two-keyed passing Test'));
  out.push('');
  out.push(`#### ⚠️ NOT READY — ${notReady.length} (at QA-Review but evidence INCOMPLETE — NOT approvable)`);
  if (!notReady.length) out.push('- (none — every QA-Review task carries two-keyed passing testing evidence)');
  for (const x of notReady) out.push(row(x, `needs: ${x.reason}`));
  out.push('');
  out.push(`#### 📱 NEEDS YOUR DEVICE ACTION — ${device.length} (device/pixel @390, e.g. AC-5-DEVICE — a distinct act, batch into ONE device sitting)`);
  if (!device.length) out.push('- (none)');
  for (const x of device) out.push(row(x, x.covered ? 'device @390 — headless evidence ok; needs your tap/pixel verify' : `device @390 + needs: ${x.reason}`));
  out.push('');
  out.push('_Readiness = MEASURED two-keyed passing Test (unit-level). Gate-served freshness (SIGNABLE) is a separate not-yet-derived signal — if a served gate looks stale, spot-check before approving._');
  return out.join('\n');
}

function buildRegion(d: Measure): string {
  return `${BEGIN}\n<!-- do not edit between these markers — regen: npm run regen:approve (auto-staged by the pre-commit hook) -->\n\n${emitRegionInner(d)}\n\n${END}`;
}

function regionInner(s: string): string | null {
  const b = s.indexOf(BEGIN); const e = s.indexOf(END);
  return (b === -1 || e === -1 || e < b) ? null : s.slice(b + BEGIN.length, e);
}
function replaceRegion(existing: string, fresh: string): string | null {
  const b = existing.indexOf(BEGIN); const e = existing.indexOf(END);
  return (b === -1 || e === -1 || e < b) ? null : existing.slice(0, b) + fresh + existing.slice(e + END.length);
}
// POSITIVE region-content guard: the region holds ONLY the generated surface (### / #### / bullets), never an `##`
// (H2) curated section — an H2 inside = a curated section leaked in → ERROR, never a silent overwrite.
function assertMachineOnly(inner: string): void {
  const strayH2 = inner.split('\n').find((l) => l.startsWith('## '));
  if (strayH2) fail(`a curated section leaked INSIDE the generated region ("${strayH2.trim()}") — move it OUTSIDE the markers. Refusing.`);
}

// ── meta-BITE (Tron order #4: a stale/vacuous surface must go RED — a check that cannot fail certifies nothing).
if (process.argv.includes('--bite')) {
  const d0 = measure();
  const wrap = (inner: string): string => `HEAD-NARRATIVE\n${BEGIN}\n${inner}\n${END}\nTAIL-NARRATIVE`;
  const good = replaceRegion(wrap('ph'), buildRegion(d0));
  if (good === null) { console.error('  BITE FAIL: replaceRegion null'); process.exit(1); }
  const corrupt = good.replace(/READY TO APPROVE — \d+/, 'READY TO APPROVE — 99999');
  const idempotentClean = replaceRegion(good, buildRegion(measure())) === good;
  const driftOnCorrupt = replaceRegion(corrupt, buildRegion(measure())) !== corrupt;
  // VACUOUS: a surface that renders NO task rows while units HAVE qa tasks must drift (RED). Simulate an empty measure.
  const emptyMeasure: Measure = { counts: { qaReview: 0, wouldPass: 0, would409: 0, device: 0 }, qaTasks: [] };
  const vacuousBoard = replaceRegion(wrap('ph'), buildRegion(emptyMeasure));
  const vacuousCaught = vacuousBoard !== null && d0.qaTasks.length > 0 && replaceRegion(vacuousBoard, buildRegion(d0)) !== vacuousBoard;
  const narrativeKept = (replaceRegion(good, buildRegion(measure())) || '').includes('HEAD-NARRATIVE');
  const ok = idempotentClean && driftOnCorrupt && vacuousCaught && narrativeKept;
  console.log(`bite: idempotent-clean=${idempotentClean} drift-detected=${driftOnCorrupt} vacuous-CAUGHT=${vacuousCaught} narrative-kept=${narrativeKept} => ${ok ? 'PASS (stale+vacuous non-vacuous, narrative safe)' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}

const existing = fs.existsSync(DOC) ? fs.readFileSync(DOC, 'utf-8') : null;
if (existing === null) fail(`${DOC_REL} missing — add the doc with GENERATED-INDEX markers once (one-time bootstrap), then this owns it.`);
const inner = regionInner(existing);
if (inner === null) fail(`no GENERATED-INDEX region in ${DOC_REL} yet — add the BEGIN/END markers once. Refusing to guess placement (never clobber a markerless doc).`);
assertMachineOnly(inner);

const d = measure();
const next = replaceRegion(existing, buildRegion(d));
if (next === null) fail('GENERATED-INDEX markers malformed.');

if (WRITE) {
  // Anti-sweep, SATISFIABLE shape (PO 2026-08-17 fleet-blocker fix; same class fixed on campaign-board 414adf6e8).
  // The OLD --staged-guard fail-CLOSED (blocked the commit) on a PEER's UNSTAGED out-of-region curation — and this hook
  // runs on every scenario-unit commit, so one agent's WIP blocked the WHOLE fleet (unsatisfiable gate). Correct shape:
  // fail-closed ONLY on our OWN region (--check/--bite below still go RED on in-region drift). A peer's out-of-region
  // edit WARNs, never blocks, and is never swept: regenerate the region in the working tree but do NOT stage the doc
  // (exit 3 → the hook skips its `git add`); the surface self-heals on the next clean regen, --check flags staleness.
  let peerCuration = false;
  if (process.argv.includes('--staged-guard')) {
    const gitShow = (ref: string): string => { try { return execFileSync('git', ['show', ref], { cwd: ROOT, encoding: 'utf-8' }); } catch { return ''; } };
    let stagedNames: string[] = [];
    try { stagedNames = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: ROOT, encoding: 'utf-8' }).split('\n'); } catch { /* not a git tree */ }
    const base = stagedNames.includes(DOC_REL) ? gitShow(`:${DOC_REL}`) : gitShow(`HEAD:${DOC_REL}`);
    const outside = (s: string): string => { const b = s.indexOf(BEGIN); const e = s.indexOf(END); return (b === -1 || e === -1) ? s : s.slice(0, b) + s.slice(e + END.length); };
    peerCuration = base !== '' && outside(existing) !== outside(base);
  }
  const wrote = guardedWriteRegion(DOC, next, BEGIN, (bn) => bn === 'approve-queue.md');
  if (!wrote) fail('--write: owned-output-guard REFUSED (markerless / wrong-name) — nothing written.');
  const r = d.qaTasks.filter((x) => x.covered && !x.device).length, dev = d.qaTasks.filter((x) => x.device).length;
  if (peerCuration) {
    console.warn(`WARN approve-queue: the planner has UNSTAGED curation OUTSIDE the region — regenerated the surface in the working tree but did NOT stage it (peer curation NOT swept, commit NOT blocked). Stage/restore the curation + rerun \`npm run regen:approve\`; --check flags any interim staleness.`);
    process.exit(3); // 3 = do NOT `git add` (would sweep the peer's out-of-region curation); non-blocking WARN
  }
  console.log(`OK approve-queue --write: ${d.counts.qaReview} QA-Review -> READY ${r} / NOT-READY ${d.counts.would409} / DEVICE ${dev}.`);
  process.exit(0);
}

// --check (default): committed surface MUST equal regen-of-units (stale OR vacuous = RED).
if (next !== existing) fail('--check: approve-queue is STALE vs units (run npm run regen:approve). A QA-Review advance/credit changed the buckets and the surface did not move.');
const r = d.qaTasks.filter((x) => x.covered && !x.device).length, dev = d.qaTasks.filter((x) => x.device).length;
console.log(`OK approve-queue --check: matches units (READY ${r} / NOT-READY ${d.counts.would409} / DEVICE ${dev}).`);
process.exit(0);
