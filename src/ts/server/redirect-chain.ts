// R1 AC1 refinement (PO ruling 2026-09-29): the ONE canonical identity resolver — follow the .redirectTo chain to the
// true PRIMARY, MULTI-HOP and CYCLE-SAFE. Consolidation can chain (a primary later consolidated into another primary →
// tok→mid→owner, 3+ hops), so a single-hop resolve silently loses the owner's own room again. This collapses the three
// prior variants (Room.resolveToken single-hop, redirectTombstoneToPrimary single-hop, the guard's inline while-loop)
// into one — ask the resolver that is right, everywhere. PURE (takes a `redirectOf` lookup) → directly testable.
//
// CYCLE-SAFE by construction: a `seen` set terminates A→B→A and self-loops A→A (returns the last token before the
// repeat) — proven by a seeded-cycle gate, not by inspection.
export function resolveRedirectChain(token: string, redirectOf: (t: string) => string | undefined): string {
  let c = token;
  const seen = new Set<string>();
  while (redirectOf(c) && !seen.has(c)) {
    seen.add(c);
    c = redirectOf(c)!;
  }
  return c;
}
