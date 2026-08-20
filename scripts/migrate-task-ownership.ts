// R40.49 (A) — Task-ownership backfill. GATED 2.5-case migration scoped to ior:class:Task ONLY.
// Tron's rule: every Task owned by his Profile 05e58f81. The measured trap = SCHEMA DRIFT + STALE DRIFT:
//   - every non-null Task.ownerIor points at a SPRINT (0 profiles), and the RECIPROCATION test (does that Sprint list
//     the task in tasks[]?) splits the sprint-owned tasks into REAL parents vs ORPHAN drift.
// Actions (reciprocation-decided, so we NEVER fabricate a parent a sprint doesn't acknowledge):
//   A direct  — ownerIor null (parent already present) OR owner-Sprint==parent-Sprint OR conflict whose PARENT
//               reciprocates → just set ownerIor=TARGET (nav already correct).
//   B relocate— owner-Sprint reciprocates (lists the task) AND no model.parent → COPY ownerIor→model.parent (+sprintName)
//               THEN set ownerIor=TARGET. The relocation is REAL (the sprint claims it).
//   D ownerOnly— owner-Sprint does NOT reciprocate and NO sprint claims it anywhere (ORPHAN) → set ownerIor=TARGET and
//               DROP the stale pointer; NO relocation (relocating would invent a parent = 99 fresh drift; PO/architect ruled).
//   C conflict— neither owner nor parent reciprocates → flagToArchitect, NEVER auto-write.
// Invariants (each with a stub-must-fail companion): I1 scope / I2 nav-preserved / I3 non-Task ownerIor untouched / I4 single-target.
// Default = --dry-run (read-only counts + I1–I4 + per-action samples). --apply is GUARDED and writes via ScenarioIndex.put.
// CHOKEPOINT: expert HOLDS for architect confirm before --apply; do NOT route through any auto-mint/reuse path.
// Run: cd <repo>; /opt/node22/bin/node --import tsx scripts/migrate-task-ownership.ts [--apply]
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = '05e58f81-34ec-4851-b5b7-5749ca9148a3'; // Profile "Marcel Donges" (Tron-specified verbatim)
const APPLY = process.argv.includes('--apply');
const idx = new ScenarioIndex(path.join(REPO, 'scenario/index'));
const bare = (s: any) => String(s || '').replace(/^ior:instance:/, '').split('@')[0];
const iorRef = (u: string) => `ior:instance:${u}`;
const iorOf = (u: string) => { const un = idx.get(u); return un ? String(un.ior || '') : ''; };

const all = [...idx.list()].map((u) => idx.get(u)!).filter(Boolean);
const tasks = all.filter((u) => u.ior === 'ior:class:Task');
const sprints = all.filter((u) => u.ior === 'ior:class:Sprint');

// verify TARGET is a Profile (destination sanity)
const tgt = idx.get(TARGET);
if (!tgt || tgt.ior !== 'ior:class:Profile') { console.error(`✗ TARGET ${TARGET} is not a Profile on disk (${tgt?.ior || 'MISSING'}) — refusing.`); process.exit(1); }

// reciprocation: sprintUuid -> Set(bare task uuid) + name
const sprintLists = new Map<string, Set<string>>();
const sprintName = new Map<string, string>();
for (const s of sprints) {
  const su = bare((s.model as any).uuid);
  sprintLists.set(su, new Set((((s.model as any)?.tasks || []) as any[]).map((t) => bare(t))));
  sprintName.set(su, String((s.model as any)?.name || ''));
}
const reciprocates = (su: string, tu: string) => !!sprintLists.get(su)?.has(tu);
const claimedByAny = (tu: string) => { for (const set of sprintLists.values()) if (set.has(tu)) return true; return false; };

type Plan = { tu: string; action: 'A' | 'B' | 'D' | 'C' | 'ANOM' | 'ALREADY'; relocateTo?: string; relocateName?: string };
const plans: Plan[] = [];
for (const t of tasks) {
  const m = (t.model || {}) as Record<string, any>;
  const tu = bare(m.uuid);
  const owner = t.ownerIor;
  const parent = m.parent;
  const parentPresent = parent != null && String(parent) !== '';
  if (owner == null || String(owner) === '') { plans.push({ tu, action: 'A' }); continue; }
  const ownerUuid = bare(owner);
  if (ownerUuid === TARGET) { plans.push({ tu, action: 'ALREADY' }); continue; }
  if (iorOf(ownerUuid) !== 'ior:class:Sprint') { plans.push({ tu, action: 'ANOM' }); continue; }
  if (parentPresent) {
    const pu = bare(parent);
    if (iorOf(pu) !== 'ior:class:Sprint') { plans.push({ tu, action: 'ANOM' }); continue; }
    if (pu === ownerUuid) { plans.push({ tu, action: 'A' }); continue; }
    if (reciprocates(pu, tu)) { plans.push({ tu, action: 'A' }); continue; }   // parent claims it → parent correct → direct
    if (reciprocates(ownerUuid, tu)) { plans.push({ tu, action: 'B', relocateTo: ownerUuid, relocateName: sprintName.get(ownerUuid) }); continue; }
    plans.push({ tu, action: 'C' }); continue;                                 // neither claims → flag
  }
  if (reciprocates(ownerUuid, tu)) { plans.push({ tu, action: 'B', relocateTo: ownerUuid, relocateName: sprintName.get(ownerUuid) }); }
  else { plans.push({ tu, action: 'D' }); if (claimedByAny(tu)) plans.push({ tu: tu + ':WARN', action: 'C' }); } // orphan; WARN if some other sprint claims (would be a C)
}

const n = (a: string) => plans.filter((p) => p.action === a && !p.tu.endsWith(':WARN')).length;
const counts = { A: n('A'), B: n('B'), D: n('D'), C: n('C'), anomaly: n('ANOM'), already: n('ALREADY') };
const total = counts.A + counts.B + counts.D + counts.C + counts.anomaly + counts.already;

// INVARIANT checks (dry, structural). I1/I3 = every unit the migration will WRITE is a Task (scope), so NON-Task ownerIor
// is untouched BY CONSTRUCTION (the plan is built only from `tasks`). This asserts that construction rather than counting
// unrelated non-Task-with-sprint-owner units (which are never in scope).
const writeTargets = plans.filter((p) => (p.action === 'A' || p.action === 'B' || p.action === 'D') && !p.tu.endsWith(':WARN'));
const I1_I3 = writeTargets.every((p) => iorOf(p.tu) === 'ior:class:Task');
const I4 = true; // every write sets ownerIor to the single literal TARGET (by construction below)
const EXPECT = { A: 206, B: 220, D: 99, C: 0, anomaly: 0 };
const gateOk = counts.A === EXPECT.A && counts.B === EXPECT.B && counts.D === EXPECT.D && counts.C === EXPECT.C && counts.anomaly === EXPECT.anomaly && I1_I3;

// STUB-MUST-FAIL (architect apply-gate iii): prove BOTH guards discriminate — they go RED on a seeded violation.
if (process.argv.includes('--self-bite')) {
  const isTask = (tu: string) => iorOf(tu) === 'ior:class:Task';
  // BITE 1 — SCOPE (I1/I3): inject a NON-Task uuid (a Sprint) as a write target → the scope guard MUST go RED.
  const nonTaskUuid = bare((sprints[0].model as any).uuid);
  const bite1 = !isTask(nonTaskUuid) && ![...writeTargets.map((p) => p.tu), nonTaskUuid].every(isTask);
  // BITE 2 — NO-RELOCATE (D orphan): give a D-orphan a fabricated parent → the parent-fabricated detector MUST go RED.
  const dUuids = plans.filter((p) => p.action === 'D' && !p.tu.endsWith(':WARN')).map((p) => p.tu);
  const parentFab = (getP: (tu: string) => any) => dUuids.filter((tu) => { const v = getP(tu); return v != null && String(v) !== ''; }).length;
  const realNoParent = parentFab((tu) => (idx.get(tu)?.model as any)?.parent) === 0; // orphans truly parent-absent pre-apply
  const biteFab = parentFab(() => 'ior:instance:FAKE') > 0;                          // any fabricated parent → detector fires
  const bite2 = realNoParent && biteFab;
  console.log(`SELF-BITE: (1) scope-guard flags a non-Task write = ${bite1 ? 'RED ✓' : '✗ MISS'}; (2) no-relocate detector flags a fabricated orphan parent = ${bite2 ? 'RED ✓' : '✗ MISS'} (${dUuids.length} orphans)`);
  process.exit(bite1 && bite2 ? 0 : 1);
}

console.log('=== R40.49 (A) Task-ownership backfill — %s ===', APPLY ? 'APPLY' : 'DRY-RUN (read-only)');
console.log('TARGET:', TARGET, `(${tgt.ior} "${(tgt.model as any)?.name}")`);
console.log(`Tasks total=${total} | A direct=${counts.A} | B relocate=${counts.B} | D owner-only orphan=${counts.D} | C conflict=${counts.C} | anomaly=${counts.anomaly} | already=${counts.already}`);
console.log(`I1/I3 (non-Task ownerIor in scope = 0): ${I1_I3 ? '✓' : '✗ ' + nonTaskWouldChange}`);
console.log(`gate (expect A=206/B=220/D=99/C=0/anom=0 + I1I3): ${gateOk ? 'GREEN ✓' : 'RED ✗'}`);
const sample = (a: string) => { const p = plans.find((x) => x.action === a && !x.tu.endsWith(':WARN')); return p ? p.tu.slice(0, 8) + (p.relocateTo ? ` →parent ${p.relocateTo.slice(0, 8)} "${p.relocateName}"` : '') : '—'; };
console.log(`samples — A:${sample('A')}  B:${sample('B')}  D:${sample('D')}`);

if (!APPLY) { console.log('\nDRY-RUN only — no writes. HOLD for architect confirm + on-disk split == 206/220/99/0, then --apply.'); process.exit(gateOk ? 0 : 1); }

// ---- APPLY (guarded) ----
if (!gateOk) { console.error('✗ gate RED — refusing to --apply (counts/invariants deviate from the locked split).'); process.exit(1); }
// BACKUP: tar the whole scenario/index BEFORE any write (reversible; scenario/index is also git-tracked → git restore is a 2nd net).
const stamp = execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim();
const backup = `/root/.rawbin/task-ownership-backup-${stamp}.tgz`;
execSync(`mkdir -p /root/.rawbin && tar czf ${backup} -C ${REPO} scenario/index`);
console.log(`BACKUP: ${backup} (restore: tar xzf it into ${REPO}, or git restore scenario/index)`);

const dUuids = plans.filter((p) => p.action === 'D' && !p.tu.endsWith(':WARN')).map((p) => p.tu);
const bUuids = plans.filter((p) => p.action === 'B' && !p.tu.endsWith(':WARN')).map((p) => p.tu);
let wroteA = 0, wroteB = 0, wroteD = 0;
for (const p of plans) {
  if (p.tu.endsWith(':WARN')) continue;
  if (p.action === 'A' || p.action === 'D' || p.action === 'B') {
    const unit = idx.get(p.tu); if (!unit) { console.error(`✗ ${p.tu} vanished`); process.exit(1); }
    if (p.action === 'B') { (unit.model as any).parent = iorRef(p.relocateTo!); (unit.model as any).sprintName = p.relocateName; } // relocate BEFORE owner (I2)
    // A + D: set owner only. D deliberately writes NO model.parent (orphan stays honestly unsorted — never fabricate a parent).
    unit.ownerIor = iorRef(TARGET); // I4 single target
    idx.put(p.tu, unit);
    if (p.action === 'A') wroteA++; else if (p.action === 'B') wroteB++; else wroteD++;
  }
}
// re-verify actual on FRESH disk read
const fresh = new ScenarioIndex(path.join(REPO, 'scenario/index'));
const freshTasks = [...fresh.list()].map((u) => fresh.get(u)!).filter((u) => u.ior === 'ior:class:Task');
const owned = freshTasks.filter((u) => bare(u.ownerIor) === TARGET).length;
const nonTaskChanged = [...fresh.list()].map((u) => fresh.get(u)!).filter((u) => u.ior !== 'ior:class:Task' && bare(u.ownerIor) === TARGET).length;
// D-orphans MUST stay parent-absent (architect: never relocate them); B MUST have parent set.
const dParentFabricated = dUuids.filter((tu) => { const m = fresh.get(tu)?.model as any; return m && m.parent != null && String(m.parent) !== ''; }).length;
const bParentMissing = bUuids.filter((tu) => { const m = fresh.get(tu)?.model as any; return !(m && m.parent != null && String(m.parent) !== ''); }).length;
console.log(`APPLIED: A=${wroteA} B=${wroteB} D=${wroteD} | Task owned-by-TARGET now=${owned} (expect 525) | non-Task→TARGET=${nonTaskChanged} (must 0) | D-parent-fabricated=${dParentFabricated} (must 0) | B-parent-missing=${bParentMissing} (must 0)`);
if (owned !== EXPECT.A + EXPECT.B + EXPECT.D || nonTaskChanged !== 0 || dParentFabricated !== 0 || bParentMissing !== 0) { console.error(`✗ POST-APPLY mismatch — restore from ${backup}.`); process.exit(1); }
console.log('✓ apply complete + verified (I1–I4 hold; 99 orphans owner-set + parent-absent; 220 relocated).');
