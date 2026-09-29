// R1 AC1 refinement (PO ruling 2026-09-29): the ONE canonical identity resolver — follow the .redirectTo chain to the
// true PRIMARY, MULTI-HOP and CYCLE-SAFE. Consolidation can chain (a primary later consolidated into another primary →
// tok→mid→owner, 3+ hops), so a single-hop resolve silently loses the owner's own room again. This collapses the three
// prior variants (Room.resolveToken single-hop, redirectTombstoneToPrimary single-hop, the guard's inline while-loop)
// into one — ask the resolver that is right, everywhere. PURE (takes a `redirectOf` lookup) → directly testable.
//
// CYCLE-SAFE by construction: a `seen` set terminates A→B→A and self-loops A→A (returns the last token before the
// repeat). PLUS a BOUNDED-DEPTH backstop that THROWS a named error past a sane depth — an INDEPENDENT guard (fails
// LOUD + FAST, never by hanging a request path) so a malformed/uncapped chain can never wedge the server even if `seen`
// regressed. A redirect chain deeper than this is malformed data, not a legitimate identity.
export const MAX_REDIRECT_DEPTH = 32;

export function resolveRedirectChain(token: string, redirectOf: (t: string) => string | undefined): string {
  let c = token;
  const seen = new Set<string>();
  let hops = 0;
  while (redirectOf(c) && !seen.has(c)) {
    if (++hops > MAX_REDIRECT_DEPTH) throw new Error(`resolveRedirectChain: redirect chain exceeded ${MAX_REDIRECT_DEPTH} hops from "${token}" — malformed redirect data; aborting LOUD rather than hanging the request path.`);
    seen.add(c);
    c = redirectOf(c)!;
  }
  return c;
}
