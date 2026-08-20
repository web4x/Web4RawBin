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

// The inserted `content` MUST carry `marker` as (or on) its root element so a later upsert can find + replace it.
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
  if (typeof content === 'string') {
    target.insertAdjacentHTML(pos, content);
  } else {
    content.classList.add(marker); // element form (shared helpers build a secEl) — stamp the marker so it is replaceable
    if (anchor && (pos === 'afterend' || pos === 'beforebegin' || pos === 'afterbegin')) anchor.insertAdjacentElement(pos, content);
    else target.appendChild(content);
  }
  return root.querySelector('.' + marker) as HTMLElement | null; // exactly one now (priors removed) → the fresh section
}
