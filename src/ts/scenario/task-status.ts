// R37.5 — TaskStatus (Class abd7dac9): make Task.status a DERIVED value of Task.statusChecklist (the single source
// of truth) so status + checklist cannot disagree BY CONSTRUCTION, plus a fail-loud CI detector for the existing
// disagreements. ★ INV-S5a (no-status-invention): the detector NEVER auto-flips — it detects + lists; the OWNER
// resolves each checklist↔status conflict. Scripts/CI-only module (no server import → no restart).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from './index-store.js';

export type TaskStatusEnum = 'Planned' | 'In Progress' | 'QA Review' | 'Done';
const STATUS_ORDER: TaskStatusEnum[] = ['Planned', 'In Progress', 'QA Review', 'Done'];

// [impl:uuid:8a032c42-abf6-4678-9ce2-9834141a0e6e] TaskStatus.deriveStatusEnum (Method f0f9eaa4) — PURE: the
// derived status = the HIGHEST-order CHECKED top-level checkbox (Planned < In Progress < QA Review < Done);
// indented sub-steps are ignored (top-level only); a malformed/non-string checklist is handled safely (→ 'Planned',
// never throws). This is THE single-source derivation — a Task writer sets model.status = deriveStatusEnum(checklist).
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
  return STATUS_ORDER[best];
}

// TaskStatus.statusSymbol — the SINGLE at-a-glance status glyph for a task. ★ It CALLS deriveStatusEnum for the
// status enum (NO independent status re-derivation — the two-source disease is killed by delegating, PO hard-condition
// 2026-08-12); it only REFINES the In-Progress substate glyph on top, reading the indented sub-steps that
// deriveStatusEnum deliberately ignores. NO stored status field, NO second symbol vocabulary anywhere. SKILL.md legend
// (law#100 regression fix, Tron #1 2026-08-12 — planning.md rendered a Done-only checkbox so QA-Review advances were
// invisible): ⏳ Planned · 📝 designed(refinement done) · 🔧 implementing · ✅ impl-shipped · 🧪 QA-Review(testing) ·
// 🏁 Done. BOTH the sprint-board generator (planning.md) AND the verdict-surface import THIS one function — the
// no-2nd-source grep-lint (scripts/check-status-symbol-single-source) enforces that the glyphs live only here.
export const STATUS_GLYPHS = ['⏳', '📝', '🔧', '✅', '🧪', '🏁'] as const;
export function statusSymbol(checklist: string): string {
  switch (deriveStatusEnum(checklist)) {
    case 'Done': return '🏁';
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

// CLI (fold into ci:gates): lists every offender, FALSE-DONE subset first, exits 1 if any. Guarded so importing
// deriveStatusEnum (e.g. from the generator) never triggers the run.
if (process.argv[1] && process.argv[1].endsWith('task-status.ts')) {
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
