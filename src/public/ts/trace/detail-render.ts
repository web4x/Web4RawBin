/**
 * R37.12 (B) — the ONE idempotent section-insert primitive for ALL detail views (live-MVC render contract).
 *
 * ROOT of the duplication bug (Tron @390, v0.8.121): every *-detail render() sets a base innerHTML then its ASYNC
 * fetch tail did insertAdjacentHTML/appendChild to APPEND sections (Parent, Status, source, children, CRs …). A live
 * re-render (or a superseded async tail landing after a newer render repainted the base) STACKED the appends →
 * Parent×2 / Status×3. There was NO shared base and NO guard.
 *
 * THE CONTRACT: every detail section insert goes through upsertSection with a STABLE marker class. upsertSection
 * removes any prior element carrying that marker (within the host) BEFORE inserting the fresh one → each section is
 * ASSIGN-ONCE (idempotent by construction). A re-render or a stale async tail REPLACES its section instead of stacking,
 * so live-rendered DOM == fresh-loaded DOM with no reload and no generation token. This is the SOLE sanctioned async
 * append in a detail body — scripts/check-detail-idempotent-render.ts fails the build (RED) on any raw insertAdjacentHTML/
 * appendChild in a detail render, or any raw-uuid ViewBus.subscribe (both discovered by pattern, not a hand-list).
 */

// upsertSection STAMPS `marker` onto the inserted root itself (string content is parsed to its root element first), so
// the caller's content need NOT declare the class — the primitive GUARANTEES the section is findable+replaceable. That
// makes the marker-class contract by-construction (delegation), not something each call site is trusted to satisfy.
// Returns the inserted section element (for listener wiring), or null when content is empty (prior just cleared).
export function upsertSection(
  root: HTMLElement,
  marker: string,
  content: string | HTMLElement | null,
  anchor?: Element | null,
  position: InsertPosition = 'beforeend',
): HTMLElement | null {
  root.querySelectorAll('.' + marker).forEach((el) => el.remove()); // idempotent: drop any prior instance of THIS section first
  if (!content) return null; // empty (e.g. no parent / no source) → the prior is cleared, nothing to insert
  const target = anchor || root;
  const pos: InsertPosition = anchor ? position : 'beforeend';
  let el: HTMLElement | null;
  if (typeof content === 'string') {
    const tpl = document.createElement('template'); tpl.innerHTML = content;
    el = tpl.content.firstElementChild as HTMLElement | null; // detail sections are single-root; whitespace/empty → null
    if (!el) return null;
  } else {
    el = content; // element form (shared helpers build a secEl)
  }
  // ★ DELEGATION (not inspection): the PRIMITIVE stamps the marker on the inserted root for BOTH string and element
  // content. The contract "the section is findable + replaceable by its marker on the next render" is GUARANTEED HERE,
  // independent of whatever classes the caller's content declared — so no call site or wrapper can break it, ever (a
  // renderParentLink/renderSourceLink edit that dropped .dv-parent/.dv-source cannot re-enable Tron's silent re-append).
  el.classList.add(marker);
  target.insertAdjacentElement(pos, el);
  return el;
}
