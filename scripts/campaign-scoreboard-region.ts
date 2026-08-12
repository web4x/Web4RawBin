/**
 * Campaign-scoreboard LIVE-region writer — extends the T37.6 auto-regen-on-commit pattern to
 * scrum.pmo/campaign-scoreboard.md.
 *
 * WHY (Tron, 2026-08-12): tasks advanced overnight and THE BOARD NEVER MOVED. campaign-scoreboard.mjs MEASURES
 * every S30++ task from units but only console.logs — the planner HAND-TRANSCRIBES the numbers, so it lags
 * (vigilance-dependent). This writes the machine-measured DATA (headline counts + per-sprint table +
 * remaining-by-blocker + per-task remaining list) into a GENERATED-INDEX region IN the board, via the shared
 * owned-output-guard, so committed-board == regen-of-units BY CONSTRUCTION. A credit/flip/gate cannot land without
 * the board moving in the same commit.
 *
 * SINGLE SOURCE: campaign-scoreboard.mjs (--json) is the ONLY measurement; this file only FORMATS + writes via
 * guardedWriteRegion (no second measurement, no console-parsing). Curated analysis sections OUTSIDE the region are
 * preserved byte-for-byte (C7). The region is designed to GROW: as the planner persists EXCLUDE/DEFER rulings into
 * units (law #103) they become machine-measured and migrate into this region.
 *
 * STANDING RULE it embodies (PO 2026-08-12): a gate result reaches this board ONLY via Test-unit.status — a gate
 * that flips without writing its Test unit leaves the board blind. Units are the single source; the board reads them.
 *
 * Run: node --import tsx scripts/campaign-scoreboard-region.ts [--write | --bite]   (default = --check; drift = RED)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { guardedWriteRegion } from './owned-output-guard.js';
import { BEGIN, END } from '../src/ts/scenario/sprint-overview-generator.js';

type Totals = { total: number; done: number; qa: number; superseded: number; remaining: number };
type PerSprint = { sp: string; total: number; done: number; qa: number; superseded: number; remaining: number };
type Blocker = { gap: string; count: number };
type Task = { sp: string; uuid: string; derived: string; gap: string; device: boolean; name: string };
type Measure = { totals: Totals; perSprint: PerSprint[]; byBlocker: Blocker[]; remainingTasks: Task[]; buildCoupled: number };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_REL = 'scrum.pmo/campaign-scoreboard.md';
// RAWBIN_BOARD_PATH overrides the target for isolated testing (must still be named campaign-scoreboard.md so the
// owned-output-guard's isOwned() accepts it); defaults to the real board in production.
const BOARD = process.env.RAWBIN_BOARD_PATH || path.join(ROOT, BOARD_REL);

const fail = (msg: string): never => { console.error(`FAIL campaign-board: ${msg}`); process.exit(1); };

// SINGLE measurement source: campaign-scoreboard.mjs --json. No second measurement lives here. Spawn it with the
// SAME node running this writer (process.execPath) — no PATH dependency (the .mjs is plain node; any node runs it).
function measure(): Measure {
  const raw = execFileSync(process.execPath, [path.join(ROOT, 'scripts/campaign-scoreboard.mjs'), '--json'], { cwd: ROOT, encoding: 'utf-8' });
  return JSON.parse(raw) as Measure;
}

function emitRegionInner(d: Measure): string {
  const t = d.totals;
  const out: string[] = [];
  out.push('### LIVE — auto-regenerated from units on commit (cannot go stale; do not hand-edit between the markers)');
  out.push('');
  out.push(`- **TOTAL S30++ tasks: ${t.total}** — Done **${t.done}** · QA-Review **${t.qa}** · SUPERSEDED-terminal **${t.superseded}** · **REMAINING (<QA-Review): ${t.remaining}** (${t.total} = ${t.done}+${t.qa}+${t.superseded}+${t.remaining})`);
  out.push('');
  out.push('| Sprint | total | Done | QA-Review | superseded | remaining<QA |');
  out.push('|--------|-------|------|-----------|------------|--------------|');
  for (const s of d.perSprint) out.push(`| ${s.sp} | ${s.total} | ${s.done} | ${s.qa} | ${s.superseded} | ${s.remaining} |`);
  out.push('');
  out.push('**REMAINING by blocker:** ' + (d.byBlocker.length ? d.byBlocker.map((b) => `${b.gap} ${b.count}`).join(' · ') : '(none — every S30++ task at QA-Review or terminal)'));
  out.push('');
  if (d.remainingTasks.length) {
    out.push('| sprint | task | status | blocker | device | name |');
    out.push('|--------|------|--------|---------|--------|------|');
    for (const r of d.remainingTasks) out.push(`| ${r.sp} | ${r.uuid} | ${r.derived} | ${r.gap} | ${r.device ? 'DEVICE' : ''} | ${r.name} |`);
    out.push('');
  }
  // GAP B (declared-not-measured, never silent): the .mjs does not yet AST-measure src host-decl existence for
  // build-coupled markers — that lag is an UNMEASURED input, so it is NAMED here (like the unresolved-pin placeholder).
  out.push(`_Measured from units. **Unmeasured input (declared, GAP B):** src host-decl existence for build-coupled markers is not AST-measured here — the interim BUILD_COUPLED override map holds **${d.buildCoupled}** entr${d.buildCoupled === 1 ? 'y' : 'ies'} (a hand-maintained 2nd source; target 0 via AST src-measure, then delete the map). Gate results reach this board ONLY via Test-unit.status._`);
  return out.join('\n');
}

function buildRegion(d: Measure): string {
  return `${BEGIN}\n<!-- do not edit between these markers — regen: npm run regen:board (auto-staged by the pre-commit hook) -->\n\n${emitRegionInner(d)}\n\n${END}`;
}

// Extract the content strictly BETWEEN the markers (or null if malformed/absent).
function regionInner(s: string): string | null {
  const b = s.indexOf(BEGIN);
  const e = s.indexOf(END);
  if (b === -1 || e === -1 || e < b) return null;
  return s.slice(b + BEGIN.length, e);
}

// Replace the existing BEGIN..END region (inclusive) with fresh. Caller guarantees existing carries the markers.
function replaceRegion(existing: string, fresh: string): string | null {
  const b = existing.indexOf(BEGIN);
  const e = existing.indexOf(END);
  if (b === -1 || e === -1 || e < b) return null;
  return existing.slice(0, b) + fresh + existing.slice(e + END.length);
}

// POSITIVE region-content guard (architect backstop #4): the region must hold ONLY machine-measured content.
// guardedWriteRegion preserves content OUTSIDE the markers but CANNOT detect a curated section that leaked INSIDE —
// --write would silently overwrite it. The generated region uses only `###` + tables, never an `##` (H2) section
// header, so any H2 inside the region = a curated section leaked in → ERROR, never a silent overwrite.
function assertMachineOnly(inner: string): void {
  const strayH2 = inner.split('\n').find((l) => l.startsWith('## '));
  if (strayH2) fail(`a curated section leaked INSIDE the generated region ("${strayH2.trim()}") — move it OUTSIDE the markers before regen (guardedWriteRegion cannot detect an in-region overwrite). Refusing.`);
}

// ── stub-must-fail ON THE CHECK ITSELF (architect #5): a drift-check that cannot go RED certifies nothing.
if (process.argv.includes('--bite')) {
  const d0 = measure();
  const wrap = (inner: string): string => `HEAD-NARRATIVE\n${BEGIN}\n${inner}\n${END}\nTAIL-NARRATIVE`;
  const goodBoard = replaceRegion(wrap('placeholder'), buildRegion(d0));
  if (goodBoard === null) { console.error('  BITE FAIL: replaceRegion returned null on a well-formed board'); process.exit(1); }
  const corruptBoard = goodBoard.replace(/REMAINING \(<QA-Review\): \d+/, 'REMAINING (<QA-Review): 99999');
  const idempotentClean = replaceRegion(goodBoard, buildRegion(measure())) === goodBoard;     // correct region → no drift
  const driftOnCorrupt = replaceRegion(corruptBoard, buildRegion(measure())) !== corruptBoard; // tampered region → drift
  const narrativeKept = (replaceRegion(goodBoard, buildRegion(measure())) || '').includes('HEAD-NARRATIVE') && (replaceRegion(goodBoard, buildRegion(measure())) || '').includes('TAIL-NARRATIVE');
  const ok = idempotentClean && driftOnCorrupt && narrativeKept;
  console.log(`bite: idempotent-clean=${idempotentClean} corrupt-detected=${driftOnCorrupt} narrative-preserved=${narrativeKept} => ${ok ? 'PASS (drift-check non-vacuous, narrative safe)' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}

const WRITE = process.argv.includes('--write');
const existing = fs.existsSync(BOARD) ? fs.readFileSync(BOARD, 'utf-8') : null;
if (existing === null) fail(`${BOARD_REL} missing.`);
const inner = regionInner(existing);
if (inner === null) fail(`no GENERATED-INDEX region in ${BOARD_REL} yet — add the BEGIN/END markers once (one-time bootstrap), then this owns it. Refusing to guess placement (never clobber a markerless board).`);
assertMachineOnly(inner); // #4: never silently overwrite a curated section that leaked inside the markers

const d = measure();
const next = replaceRegion(existing, buildRegion(d));
if (next === null) fail('GENERATED-INDEX markers malformed.');

if (WRITE) {
  // HOOK-only anti-sweep (--staged-guard): never sweep an UNSTAGED curated edit OUTSIDE the region into another
  // agent's commit. --write only touches the region, so out-of-region content must already match the committed/
  // staged base; if it differs, the planner has in-progress curation — fail-closed rather than auto-stage it.
  if (process.argv.includes('--staged-guard')) {
    const gitShow = (ref: string): string => { try { return execFileSync('git', ['show', ref], { cwd: ROOT, encoding: 'utf-8' }); } catch { return ''; } };
    let stagedNames: string[] = [];
    try { stagedNames = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: ROOT, encoding: 'utf-8' }).split('\n'); } catch { /* not a git tree */ }
    const base = stagedNames.includes(BOARD_REL) ? gitShow(`:${BOARD_REL}`) : gitShow(`HEAD:${BOARD_REL}`);
    const outside = (s: string): string => { const b = s.indexOf(BEGIN); const e = s.indexOf(END); return (b === -1 || e === -1) ? s : s.slice(0, b) + s.slice(e + END.length); };
    if (base !== '' && outside(existing) !== outside(base)) fail(`${BOARD_REL} has UNSTAGED curated edits OUTSIDE the region — stage or restore them first (the hook will not sweep uncommitted curation into this commit).`);
  }
  const wrote = guardedWriteRegion(BOARD, next, BEGIN, (bn) => bn === 'campaign-scoreboard.md');
  if (!wrote) fail('--write: owned-output-guard REFUSED (markerless / wrong-name) — nothing written.');
  console.log(`OK campaign-board --write: LIVE region regenerated (Done ${d.totals.done} / QA ${d.totals.qa} / REMAINING ${d.totals.remaining}); curated sections preserved.`);
  process.exit(0);
}

// --check (default): the committed board's LIVE region MUST equal regen-of-units (drift = RED, same fail-closed shape).
if (next !== existing) fail('--check: committed board LIVE region != regen-of-units (STALE — run npm run regen:board). Done/QA/REMAINING or per-task rows drifted.');
console.log(`OK campaign-board --check: LIVE region matches units (Done ${d.totals.done} / QA ${d.totals.qa} / REMAINING ${d.totals.remaining}).`);
process.exit(0);
