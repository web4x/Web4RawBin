/**
 * R40.4 — the shared SPRINT-NUMBER rendering atom (single-source of the ONE thing that could drift: how a sprint
 * number is written). Number is NOT stored in name (name stays theme-only, no data migration); it is supplied by the
 * caller — client surfaces pass unit.model.number; server surfaces pass the R-C1 sprintNumOf(unit). Passing it in keeps
 * this module CLIENT-SAFE (sprint-pin-resolver, home of sprintNumOf, imports node:fs at module-top → not browser-safe).
 *
 * SHARE THE ATOM, NOT THE STRING (PO 2026-08-08): sprintPrefix is the one home of the 'Sprint N' format; two legitimately
 * DIFFERENT headings compose it per-purpose (NOT duplication of one fact):
 *   - display label      = sprintPrefix(num) + ' — ' + name        (tree row, detail header)
 *   - requirements heading = sprintPrefix(num) + ' Requirements — ' + name  (generator — wording UNCHANGED, byte-stable)
 * If the prefix ever becomes 'S40' / 'Sprint #40', it changes in exactly ONE place.
 */
export function sprintPrefix(num: number | null | undefined): string {
  return 'Sprint ' + (num ? num : '?'); // '?' matches the generator's prior `m.number || '?'` → byte-stable output
}

/** Display label for a sprint (tree row / detail header): 'Sprint N — name'; name alone when there is no number. */
// [impl:uuid:e7fb7e65-1ca2-4d1a-a0ad-071d9d1cd809] SprintLabel.sprintLabel (Method 90e4014a, off UC d6cb7ddd sprintView.renderLabel)
export function sprintLabel(name: string, num: number | null | undefined): string {
  const nm = name || '(untitled)';
  return num ? `${sprintPrefix(num)} — ${nm}` : nm; // no number → name alone (never fabricate)
}
