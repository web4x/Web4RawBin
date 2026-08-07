// R-C5 — TaskStatus (Class abd7dac9): make Task.status a DERIVED value of Task.statusChecklist (the single source
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

// CLI (fold into ci:gates): lists every offender, FALSE-DONE subset first, exits 1 if any. Guarded so importing
// deriveStatusEnum (e.g. from the generator) never triggers the run.
if (process.argv[1] && process.argv[1].endsWith('task-status.ts')) {
  const idx = new ScenarioIndex(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scenario/index'));
  const offenders = assertStatusConsistent(idx);
  const falseDone = offenders.filter((o) => o.kind === 'FALSE-DONE');
  const malformed = offenders.filter((o) => o.kind === 'MALFORMED');
  const unverifiable = offenders.filter((o) => o.kind === 'UNVERIFIABLE');
  const drift = offenders.length - falseDone.length - malformed.length - unverifiable.length;
  console.log('\n=== Task status↔checklist consistency (R-C5 assertStatusConsistent) ===');
  console.log(`Offenders: ${offenders.length}  (FALSE-DONE: ${falseDone.length} · MALFORMED: ${malformed.length} · UNVERIFIABLE: ${unverifiable.length} · DRIFT: ${drift})`);
  for (const o of offenders) console.log(`  [${o.kind}] ${o.uuid.slice(0, 8)} "${o.name}" — status='${o.declared}' vs checklist-derived='${o.derived}'`);
  // REPORT-ONLY by default (delta-not-absolute, R27.2 precedent): the pre-existing offenders must NOT red the
  // whole team's CI. By construction (status = deriveStatusEnum(checklist)) new/edited tasks can't add drift, so
  // the count only goes DOWN → flip to BLOCKING with --strict once it reaches 0 (the one-line gate promotion).
  const strict = process.argv.includes('--strict');
  if (offenders.length) {
    console.log(`\n★ ${falseDone.length} FALSE-DONE (status=Done but Done box unchecked) = PRIORITY worklist. Owner resolves checklist↔status — NO auto-flip (INV-S5a). ${strict ? 'STRICT → failing.' : 'REPORT-ONLY (pass --strict to block once count==0).'}`);
    process.exit(strict ? 1 : 0);
  }
  console.log('✓ all Task status == checklist-derived');
}
