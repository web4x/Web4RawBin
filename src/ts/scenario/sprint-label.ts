/**
 * R40.4 — the shared SPRINT-NUMBER rendering atom (single-source of the ONE thing that could drift: how a sprint
 * number is written). Number is NOT stored in name (name stays theme-only, no data migration); it is supplied by the
 * caller — client surfaces pass unit.model.number; server surfaces pass the R37.1 sprintNumOf(unit). Passing it in keeps
 * this module CLIENT-SAFE (sprint-pin-resolver, home of sprintNumOf, imports node:fs at module-top → not browser-safe).
 *
 * SHARE THE ATOM, NOT THE STRING (PO 2026-08-08): sprintPrefix is the one home of the 'Sprint N' format; per-purpose
 * callers compose it (display label = sprintPrefix + ' — ' + name; generator headings = sprintPrefix + ' Planning/
 * Requirements — ' + name, wording unchanged/byte-stable). If the prefix ever becomes 'S40'/'Sprint #40' it changes here only.
 * ★ ENFORCED, not merely claimed: scripts/check-sprint-label.ts (ci:gates) FAILS the build if any src/scripts site
 *   composes 'Sprint <number>' outside this file — so this single-source invariant cannot silently drift (a client-scoped
 *   grep once missed 3 bypass sites; the gate is global). DRY-enforced, not DRY-claimed.
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

// R40.4-PHASE-2 (S37, architect design-s37-sprint-name-single-source, Tron literal "Sprint <n>: <title>"): the ONE
// display-name renderer. DEFENSIVE STRIP is the key — strip any leading (possibly REPEATED, e.g. the "Sprint 33 — Sprint
// 33 — …" doubling) "Sprint N<sep>" prefix from the stored name BEFORE composing from the attribute → the display is
// consistent REGARDLESS of stored-name state (embedded S28-33 don't double, bare S34-40 gain the number), so the renderer
// ALONE fixes Tron's view and the name-strip migration becomes pure later DRY cleanup. Separator = COLON (Tron's spec),
// decided ONLY here — no surface hardcodes it. Enforced by check-sprint-label.ts (no display composed outside this atom).
const SPRINT_PREFIX_RE = /^(?:Sprint\s*\d+\s*[—:\-]+\s*)+/i; // leading, one-or-more, any separator (em-dash/colon/hyphen)
export function stripSprintPrefix(name: string): string { return String(name || '').replace(SPRINT_PREFIX_RE, '').trim(); }

// [impl:uuid:a778793d-0f8e-4c1a-9d5e-2b6f4a1c7e90] SprintView.sprintDisplayName (R40.4 UC a778793d — designed+minted, now IMPLEMENTED)
export function sprintDisplayName(name: string, num: number | null | undefined): string {
  const title = stripSprintPrefix(name) || '(untitled)';
  return num ? `${sprintPrefix(num)}: ${title}` : title; // 'Sprint N: title'; no number → stripped title alone (never fabricate)
}

// Task display name: 'Task <n>.<m>: <title>'. Sole number attribute per the DRY thesis = sprint carries model.number,
// task carries a taskIndex — but tasks carry NO taskIndex yet (phased migration), so INTERIM the number is taken from the
// embedded "Task n.m" in the name (display-only, never stored) and re-composed with the canonical colon; when `num` is
// supplied (post-migration: parent.sprintNumber + taskIndex) it WINS. Defensive strip → lossless, no double, consistent.
const TASK_PREFIX_RE = /^Task\s*(\d+(?:\.\d+)?)\s*[—:\-]+\s*/i;
export function taskDisplayName(name: string, num?: string | null): string {
  const raw = String(name || '');
  const m = raw.match(TASK_PREFIX_RE);
  const n = (num != null && num !== '') ? num : (m ? m[1] : '');
  const title = (m ? raw.slice(m[0].length) : raw).trim() || '(untitled)';
  return n ? `Task ${n}: ${title}` : title;
}
