/**
 * R40.4 — the ONE shared sprint DISPLAY-label composer (single composition site, extracted). Every surface — the
 * Server-Manager/trace tree row, the detail header, and the generated MD — imports THIS, so 'Sprint N — name' is
 * built in exactly one place and cannot drift (grep-prove one caller of the template).
 *
 * The number is NOT stored in name (name stays theme-only, no data migration); it is supplied by the caller:
 *   - client surfaces have the unit and pass unit.model.number directly;
 *   - server surfaces that may lack the unit pass the R-C1 sprintNumOf(unit) result.
 * Passing the number IN (rather than importing sprintNumOf here) keeps this module CLIENT-SAFE — sprint-pin-resolver
 * imports node:fs at module-top and cannot be pulled into a browser bundle. Single-source stays intact: number
 * resolution lives once in sprintNumOf; the label TEMPLATE lives once here.
 */
export function sprintLabel(name: string, num: number | null | undefined): string {
  const nm = name || '(untitled)';
  return num != null ? `Sprint ${num} — ${nm}` : nm; // no number → name alone (never fabricate a number)
}
