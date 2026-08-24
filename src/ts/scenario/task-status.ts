// R37.5 — TaskStatus (Class abd7dac9): make Task.status a DERIVED value of Task.statusChecklist (the single source
// of truth) so status + checklist cannot disagree BY CONSTRUCTION, plus a fail-loud CI detector for the existing
// disagreements. ★ INV-S5a (no-status-invention): the detector NEVER auto-flips — it detects + lists; the OWNER
// resolves each checklist↔status conflict. Scripts/CI-only module (no server import → no restart).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from './index-store.js';
import { bareUuid } from '../shared/bare-uuid.js'; // R40.1 (d): canonical uuid normaliser for child-ref compare (never raw ===)

// R40.37: the enum + status sets moved to the dependency-free task-status-constants (so the browser client can share
// APPROVE_STATUSES without bundling this file's ScenarioIndex/fs deps). Re-exported here for existing importers.
import { STATUS_ORDER, APPROVE_STATUSES, type TaskStatusEnum } from './task-status-constants.js';
export type { TaskStatusEnum };
export { APPROVE_STATUSES, STATUS_ORDER };

// [impl:uuid:8a032c42-abf6-4678-9ce2-9834141a0e6e] TaskStatus.deriveStatusEnum (Method f0f9eaa4) — PURE: the
// derived status = the HIGHEST-order CHECKED top-level checkbox (Planned < In Progress < QA Review < Done);
// indented sub-steps are ignored (top-level only); a malformed/non-string checklist is handled safely (→ 'Planned',
// never throws). This is THE single-source derivation — a Task writer sets model.status = deriveStatusEnum(checklist).
// R40.59 (T40.1 decline-band): the ONE indented sub-step whose OPEN (unchecked) presence lifts a QA-Review/In-Progress
// task into the 'QA-Review-with-open-CR' band. deriveStatusEnum ignores indented lines for the top-level state, so the
// band is derived SEPARATELY from this sub-step — never a top-level checkbox, never stored. When the CR resolves the
// sub-step is TICKED ([x]) → hasOpenCrSubstep goes false → the task falls back to its clean top-level status (the
// complementary CR-resolve seam is a named follow-on). Single-source: this is the ONLY place the band is derived.
export const PROCESSING_CR_SUBSTEP = 'processing change requests';
export function hasOpenCrSubstep(checklist: string): boolean {
  return typeof checklist === 'string' && new RegExp(`^\\s+-\\s*\\[ \\]\\s*${PROCESSING_CR_SUBSTEP}\\b`, 'im').test(checklist);
}

export function deriveStatusEnum(checklist: string): TaskStatusEnum {
  if (typeof checklist !== 'string') return 'Planned'; // malformed non-string checklist → safe default, no crash
  let best = 0; // index into STATUS_ORDER; default = Planned when nothing is checked
  for (const line of checklist.split('\n')) {
    if (/^\s/.test(line)) continue;                    // leading whitespace = indented sub-step → ignore
    const m = /^-\s*\[([ xX])\]\s*(.+?)\s*$/.exec(line);
    if (!m || m[1] === ' ') continue;                  // not a top-level checkbox, or unchecked
    const idx = STATUS_ORDER.findIndex((s) => s.toLowerCase() === m[2].trim().toLowerCase());
    if (idx > best) best = idx;                        // keep the highest-order checked box
  }
  // R40.59 BAND (architect 0557e1532 inv-2, DERIVED-not-stored): a non-Done task carrying an OPEN processing-CR sub-step
  // derives the band. Checked AFTER the top-level loop so it layers on the highest checked box; NOT for a Done task (a
  // Done task with a stray open sub-step stays Done — Done is terminal, never silently reopened by a sub-step).
  if (STATUS_ORDER[best] !== 'Done' && hasOpenCrSubstep(checklist)) return 'QA-Review-with-open-CR';
  return STATUS_ORDER[best];
}

// TaskStatus.rollupParentStatus (R40.1 CR 18ebe066 AC-rollup-parent-status, design §3) — a parent-with-children's status
// is the WEAKEST-LINK rollup of its children's DERIVED statuses: the least-advanced child by STATUS_ORDER. So all Done ⇒
// Done; all ≥QA-Review ⇒ QA-Review; any child In-Progress/Planned ⇒ the parent is AT MOST that (≤In-Progress) — a
// coordination root can never be past its least-advanced child. children-rollup is AUTHORITATIVE for a parent-with-children
// (design §3): the parent's OWN stored/checklist status is IGNORED when it has children, so coordination-root 37.4
// (children all QA-Review, own stored 'Planned') derives QA-Review — its lying 'Planned' fixed BY CONSTRUCTION, NO disk
// write (single-writer intact; this is a READ-side derivation). PURE: takes the child derived-statuses; the child-FINDING
// (index) is childTaskUuids + the caller. Empty ⇒ null (caller uses the leaf deriveStatusEnum).
// [impl:uuid:44c4054a-cbd5-4405-9836-45d316603105] TaskStatus.rollupParentStatus (Method 796e6aff, R40.1 CR 18ebe066)
export function rollupParentStatus(childStatuses: TaskStatusEnum[]): TaskStatusEnum | null {
  if (!childStatuses.length) return null; // not a parent (no resolvable children) → caller uses leaf deriveStatusEnum
  let minIdx = STATUS_ORDER.length - 1; // start at Done; take the least-advanced (weakest link)
  for (const s of childStatuses) { const i = STATUS_ORDER.indexOf(s); if (i >= 0 && i < minIdx) minIdx = i; }
  return STATUS_ORDER[minIdx];
}

// TaskStatus.childTaskUuids (R40.1 CR 18ebe066) — resolve a task's SUBTASK children as bare uuids. Prefers the STRUCTURED
// form (a `children`/`subtasks` ARRAY of refs = the clean target shape); falls back to the LEGACY prose form —
// `[task:uuid:<uuid>]` markers inside the `subtasks` TEXT field (37.4's real on-disk shape; the children's own `parent`
// points at a common ancestor, not the coordination root, so it is NOT a usable link). ONLY the `subtasks` field is
// marker-scanned (semantically = children); `traceability` is NOT (it mixes up-refs). Reuses the canonical
// TraceConsistency marker pattern (single-source). Canonical bareUuid compare (never raw ===), dedup, no self.
// ★ DATA-DEBT (flagged, not silently absorbed): prose `subtasks` should be a structured ref array — named follow-on.
const TASK_MARKER_RE = /\[task:uuid:([0-9a-fA-F-]{36})\]/g;
// [impl:uuid:6537e99c-c266-4dc5-9002-3b952d2cc1c3] TaskStatus.childTaskUuids (Method 85d916a3, R40.1 CR 18ebe066)
export function childTaskUuids(model: Record<string, unknown>, selfUuid?: string): string[] {
  const out = new Set<string>();
  const self = selfUuid ? bareUuid(selfUuid) : '';
  const addRef = (r: unknown): void => { const b = bareUuid(String(r ?? '')); if (/^[0-9a-fA-F-]{36}$/.test(b) && b !== self) out.add(b.toLowerCase()); };
  for (const k of ['children', 'subtaskRefs']) { const v = model[k]; if (Array.isArray(v)) v.forEach(addRef); } // structured (clean form)
  const sub = model.subtasks;
  if (Array.isArray(sub)) sub.forEach(addRef);                                             // structured subtasks array
  else if (typeof sub === 'string') for (const m of sub.matchAll(TASK_MARKER_RE)) addRef(m[1]); // legacy prose markers (37.4)
  return [...out];
}

// TaskStatus.statusSymbol — the SINGLE at-a-glance status glyph for a task. ★ It CALLS deriveStatusEnum for the
// status enum (NO independent status re-derivation — the two-source disease is killed by delegating, PO hard-condition
// 2026-08-12); it only REFINES the In-Progress substate glyph on top, reading the indented sub-steps that
// deriveStatusEnum deliberately ignores. NO stored status field, NO second symbol vocabulary anywhere. SKILL.md legend
// (law#100 regression fix, Tron #1 2026-08-12 — planning.md rendered a Done-only checkbox so QA-Review advances were
// invisible): ⏳ Planned · 📝 designed(refinement done) · 🔧 implementing · ✅ impl-shipped · 🧪 QA-Review(testing) ·
// 🏁 Done. BOTH the sprint-board generator (planning.md) AND the verdict-surface import THIS one function — the
// no-2nd-source grep-lint (scripts/check-status-symbol-single-source) enforces that the glyphs live only here.
export const STATUS_GLYPHS = ['⏳', '📝', '🔧', '✅', '🧪', '🔁', '🏁'] as const; // R40.59: 🔁 = QA-Review-with-open-CR band
export function statusSymbol(checklist: string): string {
  switch (deriveStatusEnum(checklist)) {
    case 'Done': return '🏁';
    case 'QA-Review-with-open-CR': return '🔁'; // R40.59 band — else it would fall to the In-Progress default glyph
    case 'QA Review': return '🧪';
    case 'Planned': return '⏳';
    default: { // In Progress → finer glyph from the indented sub-steps (still the checklist = single-source)
      const sub = (label: string) => new RegExp(`^\\s+- \\[[xX]\\]\\s*${label}`, 'm').test(checklist);
      if (sub('implementing')) return '✅';  // impl shipped, tester pending
      if (sub('refinement')) return '📝';     // designed, awaiting impl
      return '🔧';                            // in progress, pre-refinement
    }
  }
}

export interface StatusOffender { uuid: string; name: string; declared: string; derived: TaskStatusEnum | '(malformed)' | '(no checklist)'; kind: 'FALSE-DONE' | 'MALFORMED' | 'UNVERIFIABLE' | 'DRIFT'; }

// [impl:uuid:d86f0309-df84-4fbf-9b47-da9e2b6abbee] TaskStatus.assertStatusConsistent (Method 1d96bae3) — the
// FAIL-LOUD detector: for every Task unit, compare model.status vs deriveStatusEnum(model.statusChecklist) and
// return EVERY offender, ordered FALSE-DONE first (status==='Done' but the Done box is unchecked = the priority
// class), then MALFORMED (non-string checklist), then plain DRIFT. NEVER auto-flips (INV-S5a) — detect + list only.
export function assertStatusConsistent(idx: ScenarioIndex): StatusOffender[] {
  const offenders: StatusOffender[] = [];
  for (const uuid of idx.list()) {
    const u = idx.get(uuid);
    if (!u || u.ior !== 'ior:class:Task') continue;
    const m = u.model as { name?: string; status?: string; statusChecklist?: unknown };
    const declared = String(m.status || '');
    const cl = m.statusChecklist;
    // MALFORMED = the checklist is PRESENT but not a string (array/object/number = a genuine data bug). An ABSENT
    // checklist (undefined/null) is NOT malformed — it derives 'Planned' and only counts as DRIFT if status disagrees.
    if (cl !== undefined && cl !== null && typeof cl !== 'string') {
      offenders.push({ uuid, name: String(m.name || uuid), declared, derived: '(malformed)', kind: 'MALFORMED' });
      continue;
    }
    if (cl === undefined || cl === null || String(cl).trim() === '') {
      // ★ FAIL-CLOSED: an ABSENT/empty checklist = UNVERIFIABLE — there is no data to verify status against, so it
      // is reported as its own NAMED category, NEVER silently read as clean (same vacuous-pass hole as proveComplete's
      // wrong-uuid bug). A task with no checklist could otherwise carry any status unchecked forever. [[false-low-worse-than-absent]]
      offenders.push({ uuid, name: String(m.name || uuid), declared, derived: '(no checklist)', kind: 'UNVERIFIABLE' });
      continue;
    }
    const derived = deriveStatusEnum(cl as string); // present string → parsed
    if (declared !== derived) {
      const kind: StatusOffender['kind'] = (declared === 'Done' && derived !== 'Done') ? 'FALSE-DONE' : 'DRIFT';
      offenders.push({ uuid, name: String(m.name || uuid), declared, derived, kind });
    }
  }
  const rank: Record<StatusOffender['kind'], number> = { 'FALSE-DONE': 0, MALFORMED: 1, UNVERIFIABLE: 2, DRIFT: 3 };
  offenders.sort((a, b) => rank[a.kind] - rank[b.kind]);
  return offenders;
}

// [BLOCKING PREDICATE — PO ruling 2026-08-12, single-source with the UNVERIFIABLE category] consistency:strict FAILS
// only on offenders it can EVALUATE against R37.5 (status == deriveStatusEnum(checklist)): FALSE-DONE / MALFORMED /
// DRIFT — each HAS a statusChecklist to derive from. An UNVERIFIABLE offender (kind='UNVERIFIABLE' = ABSENCE of
// statusChecklist, DERIVED by assertStatusConsistent — NOT a hardcoded slug list) is a FROZEN-LEGACY task predating
// the checklist schema: R37.5 cannot apply where there is no checklist, so the checker must not FAIL on it (same
// class as check:sprint-md excluding hand-authored/headerless files the write-guard preserves). It stays LISTED
// (never silently clean, INV-C3-2) + NAMED DEBT (backlog: give legacy tasks a checklist under R37.x). NON-BLINDING:
// a checklist-HAVING drift (DRIFT / FALSE-DONE / MALFORMED) STILL blocks — proven by --bite.
export function isBlockingStatusOffender(o: StatusOffender): boolean {
  return o.kind !== 'UNVERIFIABLE';
}

// [META-BITE — PO condition, 2026-08-12] Prove the UNVERIFIABLE exclusion did NOT blind the dual-status gate: a task
// WITH a checklist whose status drifts MUST still block (RED); only a no-checklist frozen-legacy task is excluded,
// and it stays LISTED. Runs assertStatusConsistent over a synthetic in-memory index. `task-status.ts --bite`.
export function runStatusScopeBite(): void {
  const mk = (uuid: string, status: string, checklist?: string) =>
    ({ ior: 'ior:class:Task', model: { uuid, name: uuid, status, statusChecklist: checklist } });
  const units: Record<string, unknown> = {
    A: mk('A', 'Done', '- [x] Planned\n- [x] In Progress\n- [x] QA Review'),        // FALSE-DONE: stored Done, Done box unchecked
    B: mk('B', 'Planned', '- [x] Planned\n- [x] In Progress'),                        // DRIFT: checklist derives In Progress
    C: mk('C', 'Planned', undefined),                                                 // UNVERIFIABLE: no checklist (frozen-legacy)
    D: mk('D', 'QA Review', '- [x] Planned\n- [x] In Progress\n- [x] QA Review'),     // consistent
  };
  const mockIdx = { list: () => Object.keys(units), get: (u: string) => units[u] } as unknown as ScenarioIndex;
  const off = assertStatusConsistent(mockIdx);
  const blocking = off.filter(isBlockingStatusOffender);
  const asserts: { ok: boolean; msg: string }[] = [];
  const A = (ok: boolean, msg: string) => asserts.push({ ok, msg });
  A(blocking.some((o) => o.uuid === 'A' && o.kind === 'FALSE-DONE'), 'FALSE-DONE (stored Done, Done box unchecked) BLOCKS strict');
  A(blocking.some((o) => o.uuid === 'B' && o.kind === 'DRIFT'), 'NON-BLINDING: a task WITH a checklist that DRIFTS still BLOCKS (RED)');
  A(!blocking.some((o) => o.uuid === 'C'), 'EXCLUSION: a no-checklist (UNVERIFIABLE frozen-legacy) task does NOT block strict');
  A(off.some((o) => o.uuid === 'C' && o.kind === 'UNVERIFIABLE'), 'VISIBILITY: the no-checklist task is STILL LISTED as UNVERIFIABLE (never silently clean)');
  A(!off.some((o) => o.uuid === 'D'), 'a consistent task (status == derived) is not an offender');
  const failed = asserts.filter((a) => !a.ok);
  for (const a of asserts) console.log(`  ${a.ok ? '✓' : '✗ FAIL'} ${a.msg}`);
  if (failed.length) { console.log(`\n✗ status-scope bite: ${failed.length}/${asserts.length} FAILED`); process.exit(1); }
  console.log(`\n✓ status-scope bite: ${asserts.length}/${asserts.length} — UNVERIFIABLE(no-checklist) excluded + LISTED; checklist-having DRIFT/FALSE-DONE still RED (non-vacuous, not blinded)`);
}

// [META-BITE — R40.1 CR 18ebe066 AC-stub-must-fail] Prove the rollup + child-resolver bite: a parent whose children are
// ALL QA-Review (referenced via legacy `[task:uuid:]` prose markers) DERIVES QA-Review even though its own checklist says
// 'Planned'; a leaf (no children) keeps its own derived status; the weakest-link rule holds (one In-Progress child ⇒
// parent In-Progress). A suite where the coordination-root shows 'Planned' (own checklist) instead of the rollup = RED.
export function runRollupBite(): void {
  const asserts: { ok: boolean; msg: string }[] = [];
  const A = (ok: boolean, msg: string) => asserts.push({ ok, msg });
  const C1 = '236918e9-6369-450f-aec3-b741451be147', C2 = 'fe6b4379-f116-4bf5-8b81-dd7d41d1bdba', C3 = '1b8ebc9a-7b94-468c-a0a9-f40f648e4cad';
  // child-resolver: prose-marker parse of a coordination root's subtasks text (37.4's real shape) resolves all 3 children
  const parentModel = { uuid: '79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d', status: 'Planned', statusChecklist: '- [x] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done', subtasks: `root of decomposition:\n- [Task 37.4.1](./x.md) \`[task:uuid:${C1}]\`\n- [Task 37.4.2](./y.md) \`[task:uuid:${C2}]\`\n- [Task 37.4.3](./z.md) \`[task:uuid:${C3}]\`` };
  const kids = childTaskUuids(parentModel, parentModel.uuid);
  A(kids.length === 3 && kids.includes(C1) && kids.includes(C2) && kids.includes(C3), 'child-resolver: prose [task:uuid:] markers in the subtasks field resolve all 3 subtask children (legacy shape)');
  A(childTaskUuids(parentModel, parentModel.uuid).every((k) => k !== bareUuid(parentModel.uuid)), 'child-resolver excludes self');
  // rollup: all children QA-Review → parent derives QA-Review (its lying stored/checklist 'Planned' is overridden)
  A(rollupParentStatus(['QA Review', 'QA Review', 'QA Review']) === 'QA Review', 'rollup: children ALL QA-Review ⇒ parent QA-Review (not the stored Planned)');
  A(deriveStatusEnum(parentModel.statusChecklist) === 'Planned' && rollupParentStatus(['QA Review', 'QA Review', 'QA Review']) === 'QA Review', 'STUB-MUST-FAIL: leaf-derive says Planned but the ROLLUP says QA-Review — a suite showing the coordination-root as Planned is RED');
  A(rollupParentStatus(['Done', 'Done', 'Done']) === 'Done', 'rollup: all Done ⇒ Done');
  A(rollupParentStatus(['QA Review', 'In Progress', 'QA Review']) === 'In Progress', 'rollup: weakest-link — one In-Progress child ⇒ parent In-Progress (never past its least-advanced child)');
  A(rollupParentStatus(['QA Review', 'Planned']) === 'Planned', 'rollup: a Planned child pins the parent to Planned');
  A(rollupParentStatus([]) === null, 'no children ⇒ null (caller uses the leaf deriveStatusEnum — a real leaf is unaffected)');
  const failed = asserts.filter((a) => !a.ok);
  for (const a of asserts) console.log(`  ${a.ok ? '✓' : '✗ FAIL'} ${a.msg}`);
  if (failed.length) { console.log(`\n✗ rollup-parent bite: ${failed.length}/${asserts.length} FAILED`); process.exit(1); }
  console.log(`\n✓ rollup-parent bite: ${asserts.length}/${asserts.length} — coordination root derives from children (weakest-link), lying 'Planned' fixed by construction, leaf unaffected`);
}

// [BITE — R40.59 T40.1 decline-band, architect 0557e1532] Prove the band derivation + the atomic-pair RED baseline:
// (1) a QA-Review checklist with QA Review UNTICKED + an OPEN processing-CR sub-step derives the BAND, not In Progress;
// (2) the SAME checklist WITHOUT the sub-step derives In Progress = the Tron-forbidden regress the atomic untick+sub-step
// pair prevents (the tester RED baseline); (3) a resolved (TICKED) sub-step clears the band → clean QA Review; (4) a Done
// task with a stray open sub-step stays Done (the band never silently reopens Done); (5) the band is NOT approvable
// (∉ APPROVE_STATUSES) → cannot manufacture Done; (6) current-able ordering (past In-Progress, below clean QA Review);
// (7) the 🔁 glyph. `task-status.ts --band-bite`.
export function runBandBite(): void {
  const asserts: { ok: boolean; msg: string }[] = [];
  const A = (ok: boolean, msg: string) => asserts.push({ ok, msg });
  const declined = '- [x] Planned\n- [x] In Progress\n- [ ] QA Review';           // QA Review UNTICKED (a decline)
  const withOpenCr = declined + '\n  - [ ] processing change requests';           // + OPEN processing-CR sub-step
  const withResolvedCr = '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n  - [x] processing change requests';
  const doneWithStray = '- [x] Planned\n- [x] In Progress\n- [x] QA Review\n- [x] Done\n  - [ ] processing change requests';
  A(deriveStatusEnum(withOpenCr) === 'QA-Review-with-open-CR', 'BAND: QA-Review unticked + an OPEN processing-CR sub-step ⇒ derives the band');
  A(deriveStatusEnum(declined) === 'In Progress', 'RED BASELINE (STUB-MUST-FAIL): the SAME untick WITHOUT the sub-step derives In Progress = the Tron-forbidden regress — the ATOMIC untick+sub-step pair is what prevents it');
  A(hasOpenCrSubstep(withOpenCr) && !hasOpenCrSubstep(declined) && !hasOpenCrSubstep(withResolvedCr), 'hasOpenCrSubstep: true ONLY for an OPEN [ ] sub-step; a resolved [x] one does NOT count');
  A(deriveStatusEnum(withResolvedCr) === 'QA Review', 'RESOLVE: a TICKED processing-CR sub-step clears the band → clean QA Review (approvable again)');
  A(deriveStatusEnum(doneWithStray) === 'Done', 'DONE TERMINAL: a Done task with a stray open sub-step stays Done (the band never silently reopens Done)');
  A(!(APPROVE_STATUSES as readonly string[]).includes('QA-Review-with-open-CR') && (APPROVE_STATUSES as readonly string[]).includes('QA Review'), 'DONE-GATE: the band is NOT approvable (∉ APPROVE_STATUSES) → cannot manufacture Done; clean QA Review is');
  const bandIdx = STATUS_ORDER.indexOf('QA-Review-with-open-CR');
  A(bandIdx > STATUS_ORDER.indexOf('In Progress') && bandIdx < STATUS_ORDER.indexOf('QA Review'), 'CURRENT-ABLE ordering: the band ranks past In-Progress and below clean QA Review (non-terminal ⇒ current-eligible)');
  A(statusSymbol(withOpenCr) === '🔁', 'GLYPH: the band renders 🔁 (not the In-Progress default)');
  const failed = asserts.filter((a) => !a.ok);
  for (const a of asserts) console.log(`  ${a.ok ? '✓' : '✗ FAIL'} ${a.msg}`);
  if (failed.length) { console.log(`\n✗ decline-band bite: ${failed.length}/${asserts.length} FAILED`); process.exit(1); }
  console.log(`\n✓ decline-band bite: ${asserts.length}/${asserts.length} — band derives (not In-Progress); untick-without-substep=In-Progress RED baseline; resolve clears; Done stays terminal; not approvable; current-able ordering; 🔁 glyph`);
}

// CLI (fold into ci:gates): lists every offender, FALSE-DONE subset first, exits 1 if any. Guarded so importing
// deriveStatusEnum (e.g. from the generator) never triggers the run.
if (process.argv[1] && process.argv[1].endsWith('task-status.ts')) {
  if (process.argv.includes('--rollup-bite')) { runRollupBite(); process.exit(0); } // R40.1 (d): prove the rollup + child-resolver bite
  if (process.argv.includes('--band-bite')) { runBandBite(); process.exit(0); } // R40.59: prove the decline-band derivation + RED baseline
  if (process.argv.includes('--bite')) { runStatusScopeBite(); process.exit(0); } // meta-bite: prove the UNVERIFIABLE exclusion did not blind the gate
  const idx = new ScenarioIndex(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scenario/index'));
  const offenders = assertStatusConsistent(idx);
  const falseDone = offenders.filter((o) => o.kind === 'FALSE-DONE');
  const malformed = offenders.filter((o) => o.kind === 'MALFORMED');
  const unverifiable = offenders.filter((o) => o.kind === 'UNVERIFIABLE');
  const drift = offenders.length - falseDone.length - malformed.length - unverifiable.length;
  console.log('\n=== Task status↔checklist consistency (R37.5 assertStatusConsistent) ===');
  console.log(`Offenders: ${offenders.length}  (FALSE-DONE: ${falseDone.length} · MALFORMED: ${malformed.length} · UNVERIFIABLE: ${unverifiable.length} · DRIFT: ${drift})`);
  for (const o of offenders) console.log(`  [${o.kind}] ${o.uuid.slice(0, 8)} "${o.name}" — status='${o.declared}' vs checklist-derived='${o.derived}'`);
  // REPORT-ONLY by default (delta-not-absolute, R27.2 precedent): the pre-existing offenders must NOT red the
  // whole team's CI. By construction (status = deriveStatusEnum(checklist)) new/edited tasks can't add drift, so
  // the count only goes DOWN → flip to BLOCKING with --strict once it reaches 0 (the one-line gate promotion).
  const strict = process.argv.includes('--strict');
  const blocking = offenders.filter(isBlockingStatusOffender);
  if (offenders.length) {
    console.log(`\n★ ${falseDone.length} FALSE-DONE + ${malformed.length} MALFORMED + ${drift} DRIFT = ${blocking.length} BLOCKING (checklist-having, evaluable against R37.5). ${unverifiable.length} UNVERIFIABLE (no checklist = frozen-legacy) = REPORT-ONLY named-debt (backlog R37.x), NOT a status-vs-checklist violation but LISTED (never silently clean). Owner resolves checklist↔status — NO auto-flip (INV-S5a). ${strict ? (blocking.length ? 'STRICT → failing on blocking.' : 'STRICT → 0 blocking → PASS (UNVERIFIABLE stay named-debt).') : 'REPORT-ONLY.'}`);
    process.exit(strict && blocking.length ? 1 : 0);
  }
  console.log('✓ all Task status == checklist-derived');
}
