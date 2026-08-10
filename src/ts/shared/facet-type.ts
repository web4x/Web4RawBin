// R32.11-B2 / Tron BUG D — THE ONE ior-class → facet-type derivation. Single source imported by BOTH the server
// add-view handler (derives+stores view.viewKind) AND the client diagram renderer (renderFacet/facetW/facetH
// fallback), so there is NO second type-map to drift from renderFacet's routing (renderFacet stays the one lens
// router; this only feeds it). Targets are renderFacet's exact keys (UmlUseCase / UmlMethod / UmlFunction /
// tsClass=class-family). Returns null for an unknown/unresolvable element → the caller MUST fail-closed (refuse /
// no silent 'class' — a silent 'class' default is the exact defect this fixes: a dropped UseCase rendered as a box).
// [impl:uuid:b3a996f0-708e-4724-84d8-788ef2755930] FacetType.deriveViewKind (BUG D / R32.11)
export function deriveViewKind(ior: string | undefined, model: Record<string, unknown> | undefined): string | null {
  const cls = String(ior || '').replace(/^ior:(class|instance):/, ''); // 'UseCase' | 'Method' | 'Class' | 'ModelElement' | …
  switch (cls) {
    case 'UseCase': return 'UmlUseCase';                                                  // ellipse lens
    case 'Method': return (model && (model as { parentClass?: unknown }).parentClass) ? 'UmlMethod' : 'UmlFunction'; // R36.3: no parent Class ⇒ function
    case 'Class': return 'tsClass';                                                       // class-family box
    case 'ModelElement': { const k = model && String((model as { kind?: unknown }).kind || ''); return k || null; } // ModelElements carry their own kind
    default: return null;                                                                 // unknown / unresolvable → FAIL-CLOSED (never silent 'class')
  }
}
