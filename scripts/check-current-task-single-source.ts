/**
 * R40.56 — the CURRENT-TASK single-source gate. Asserts the HAZARD, not an actor-blocklist (that is exactly why
 * check-pin-single-source missed derivedCurrentTaskUuid: a 2-regex blocklist of known SHAPES can never prove a
 * single-source invariant — the next divergence is always a new shape). [[scan-the-hazard-not-the-actors]]
 *
 * THE HAZARD (names itself, unevadable): a function that REDUCES ior:class:Task units to ONE returned uuid, selected
 * by a status/recency comparison — i.e. "which task is *the current one*." Current-task selection must have exactly ONE
 * definition site (CurrentSprint.getThreeSlots, the designation-honoring resolver the pin/scoreboard/tree read). ANY
 * other function that computes it is a SECOND SOURCE. "0 such selections outside the sanctioned accessor" proves
 * single-source in ONE number — same shape as "0 raw insertAdjacentHTML outside the primitive."
 *
 * Detection is per-FUNCTION-BODY (brace-matched, not a line regex): HAZARD = the body (a) loops Task units
 * [`ior:class:Task`], AND (b) selects by recency/status [`lastAdvancedAt` max/sort, or a `deriveStatusEnum` status
 * filter driving the pick], AND (c) returns a SCALAR uuid (a reduce-to-one, not a slots object / array). getThreeSlots
 * is the sanctioned site (ALLOW). derivedCurrentTaskUuid (server.ts) is the live known-positive specimen this gate must
 * RED on today.
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-current-task-single-source.ts [--strict|--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src/ts', 'src/public/ts', 'src/shared'];
// The ONE sanctioned current-task definition site (the designation-honoring resolver every consumer READS). Same
// pattern as check-pin-single-source allow-listing sprint-pin-resolver.ts. A NEW accessor must be added here EXPLICITLY.
const ALLOW_FILES = new Set(['src/ts/scenario/CurrentSprint.ts']);

// ── PURE CORE: is THIS function body a current-task selection hazard? (exported for the selftest) ──
export function isCurrentTaskSelectionHazard(body: string): boolean {
  const loopsTaskUnits = /ior:class:Task/.test(body);                                  // (a) iterates Task units
  const selectsByRecencyOrStatus = /lastAdvancedAt/.test(body) || /deriveStatusEnum/.test(body); // (b) recency/status pick
  // (c) reduces to ONE returned scalar uuid: returns a bare identifier (accumulator), body reads `.uuid`, and it is NOT
  // returning a slots object / array (those are the legitimate multi-value shapes). `return best` / `return uuid`.
  const returnsScalar = /\breturn\s+[A-Za-z_$][\w$]*\s*;/.test(body);                  // returns a bare variable (not {…}/[…]/literal)
  const readsUuid = /\.uuid\b/.test(body) || /\buuid\b/.test(body);
  return loopsTaskUnits && selectsByRecencyOrStatus && returnsScalar && readsUuid;
}

// Extract top-level + nested function/method bodies via brace matching. Returns {name, startLine, body}.
function extractFunctions(src: string): { name: string; line: number; body: string }[] {
  const out: { name: string; line: number; body: string }[] = [];
  // function NAME(...)  |  const NAME = (...) =>  |  NAME(...) {  (method) — capture the name + the '{' that opens the body.
  const headerRe = /(?:function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::[^{]+)?|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::[^={]+)?=>\s*|(?:^|\n)\s*(?:private\s+|public\s+|async\s+|static\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::[^{]+)?)\{/g;
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(src)) !== null) {
    const name = m[1] || m[2] || m[3] || '(anon)';
    const open = src.indexOf('{', m.index + m[0].length - 1);
    if (open < 0) continue;
    let depth = 0, i = open;
    for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } } }
    out.push({ name, line: src.slice(0, m.index).split('\n').length, body: src.slice(open, i) });
  }
  return out;
}

function scan(): { file: string; line: number; fn: string }[] {
  const findings: { file: string; line: number; fn: string }[] = [];
  const walk = (dir: string): void => {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(rel); continue; }
      if (!e.name.endsWith('.ts') || e.name.endsWith('.d.ts') || rel.split(path.sep).includes('__tests__')) continue;
      if (ALLOW_FILES.has(rel.split(path.sep).join('/'))) continue;
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
      if (!/ior:class:Task/.test(src)) continue; // cheap pre-filter
      for (const f of extractFunctions(src)) if (isCurrentTaskSelectionHazard(f.body)) findings.push({ file: rel.split(path.sep).join('/'), line: f.line, fn: f.name });
    }
  };
  for (const d of SCAN_DIRS) walk(d);
  return findings;
}

function selftest(): number {
  let fail = 0;
  const ck = (n: string, c: boolean) => { console.log(`  ${c ? 'PASS' : 'FAIL'}  ${n}`); if (!c) fail++; };
  // the exact derivedCurrentTaskUuid shape → HAZARD
  ck('derivedCurrentTaskUuid shape (loop Task + max lastAdvancedAt + return uuid) → hazard', isCurrentTaskSelectionHazard(
    `{ let best=''; let bestAt=''; for (const u of idx.list()){ const unit=idx.get(u); if(!unit||unit.ior!=='ior:class:Task')continue; const m=unit.model; const at=String(m.lastAdvancedAt||''); if(best===''||at>bestAt){best=String(m.uuid);bestAt=at;} } return best; }`));
  // a status-filter variant (deriveStatusEnum) returning a uuid → also hazard
  ck('status-filter Task-select returning a uuid → hazard', isCurrentTaskSelectionHazard(
    `{ let pick=''; for (const u of idx.list()){ const t=idx.get(u); if(t?.ior!=='ior:class:Task')continue; if(deriveStatusEnum(t.model.statusChecklist)!=='In Progress')continue; pick=String(t.model.uuid); } return pick; }`));
  // a function that loops Task units but returns a STATUS object (deriveSprintStatus) → NOT a hazard (no scalar uuid)
  ck('Task-loop returning a status/counts object → NOT a hazard', !isCurrentTaskSelectionHazard(
    `{ const counts={done:0}; for(const ref of tasks){ const t=idx.get(ref); if(t?.ior!=='ior:class:Task')continue; if(deriveStatusEnum(t.model.statusChecklist)==='Done')counts.done++; } return counts; }`));
  // a function that returns a uuid but does NOT loop Task units → NOT a hazard (not a task-current selection)
  ck('returns a uuid but no Task-unit loop → NOT a hazard', !isCurrentTaskSelectionHazard(
    `{ let best=''; for(const u of idx.list()){ const s=idx.get(u); if(s?.ior!=='ior:class:Sprint')continue; best=String(s.model.uuid); } return best; }`));
  // a Task-loop returning the slots OBJECT (getThreeSlots shape) → NOT a scalar-uuid reduce
  ck('Task-loop returning a {current,...} slots object → NOT a scalar-uuid hazard', !isCurrentTaskSelectionHazard(
    `{ for(const u of idx.list()){ const t=idx.get(u); if(t?.ior!=='ior:class:Task')continue; } return { current, lastCompleted, nextBacklog }; }`));
  if (fail) { console.error(`check:current-task-single-source SELFTEST FAILED (${fail}).`); return 1; }
  console.log('check:current-task-single-source SELFTEST GREEN — hazard = Task-loop + recency/status pick + scalar-uuid return; status-objects / sprint-loops / slots-objects excluded.');
  return 0;
}

const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(selftest());

const findings = scan();
const strict = args.includes('--strict');
console.log(`\n=== R40.56 current-task single-source gate — ${findings.length === 0 ? 'PASS (0 Task-current selections outside CurrentSprint.getThreeSlots)' : `FAIL (${findings.length} rogue current-task selection${findings.length === 1 ? '' : 's'})`} ===`);
for (const f of findings) console.log(`  - ${f.file}:${f.line} — function ${f.fn}() reduces Task units to one uuid by status/recency (a SECOND current-task source; must read CurrentSprint.getThreeSlots)`);
if (findings.length) console.log('  → current-task has ONE definition site (getThreeSlots); every consumer READS slots.current, never re-derives.');
if (strict && findings.length) process.exit(1);
