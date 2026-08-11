/**
 * check-altid-canon — S37's consistency-by-construction thesis applied to ITSELF: task/requirement naming can never
 * drift back to a bespoke scheme. Fold into ci:gates (RED on any bespoke id).
 *
 * ★ COVERS BOTH FORMS (PO ruling 2026-08-11): a TASK carries NO altId — its identity lives in `model.name`
 * ("Task 37.1: …") + `model.slug` ("task-37.1-…"); a REQUIREMENT carries `model.altId` ("R37.1"). An altId-ONLY
 * check would pass every task no matter how it is named (half-blind), so we assert canon on task name+slug AND req altId.
 *
 * The bespoke scheme we killed (S37 was `C1..C8` / `R-C1..R-C10`) vs fleet canon `<sprint>.<index>`
 * (Task 37.1, R37.1, slug task-37.1-). This gate asserts the bespoke `C<n>` scheme is ABSENT on both surfaces —
 * so a planted `C9` altId or a `Task C9` / `task-c9-` name goes RED, and a weakened guard (the tester's meta-bite) goes RED.
 *
 * Determinism: read-only over the scenario index; sort violations by uuid; exit 1 iff any.
 */
import { allUnits } from './generate-sprint-md.js'; // reuse the ONE loader (keys by model.uuid)

const BESPOKE_TASK_NAME = /^Task C\d/;   // "Task C1:", "Task C4.1:"
const BESPOKE_TASK_SLUG = /^task-c\d/;   // "task-c1-…", "task-c4.1-…"
const BESPOKE_REQ_ALTID = /^R-C\d/;      // "R-C1", "R-C10"

export interface CanonViolation { uuid: string; ior: string; surface: 'name' | 'slug' | 'altId'; value: string; }

export function findAltIdCanonViolations(units = allUnits()): CanonViolation[] {
  const v: CanonViolation[] = [];
  for (const [uuid, u] of units) {
    const m = u.model as Record<string, unknown>;
    if (u.ior === 'ior:class:Task') {
      const name = String(m.name || ''), slug = String(m.slug || '');
      if (BESPOKE_TASK_NAME.test(name)) v.push({ uuid, ior: u.ior, surface: 'name', value: name.slice(0, 48) });
      if (BESPOKE_TASK_SLUG.test(slug)) v.push({ uuid, ior: u.ior, surface: 'slug', value: slug });
    } else if (u.ior === 'ior:class:Requirement') {
      const altId = String(m.altId || '');
      if (BESPOKE_REQ_ALTID.test(altId)) v.push({ uuid, ior: u.ior, surface: 'altId', value: altId });
    }
  }
  return v.sort((a, b) => a.uuid.localeCompare(b.uuid));
}

if (process.argv[1] && process.argv[1].endsWith('check-altid-canon.ts')) {
  const violations = findAltIdCanonViolations();
  console.log('=== check-altid-canon (bespoke C-scheme must be ABSENT — task name+slug AND req altId) ===');
  if (violations.length === 0) {
    console.log('✓ 0 bespoke-scheme ids — naming is canon by construction.');
    process.exit(0);
  }
  console.log(`✗ ${violations.length} bespoke-scheme id(s) — the consistency-by-construction sprint must not be inconsistent:`);
  for (const x of violations) console.log(`  ${x.ior.replace('ior:class:', '')} ${x.uuid.slice(0, 8)} ${x.surface} bespoke: "${x.value}"`);
  process.exit(1);
}
