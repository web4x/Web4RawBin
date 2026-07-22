// R31.5.6 — RbWoda (<rb-woda>): the WODA layout W|[O][D]|A expressed as an rb-strip INSTANCE. Design PIECE 5
// (design-r31.5-build-decomposition.md). FRESH thin host. Pure descriptor wiring on rb-strip — proves
// one-model-two-instances alongside the 3-way editor (5.5). Net-new, added around (wired at the app step).
export class RbWoda extends HTMLElement {
  // [impl:uuid:5f9d2a7c-1e63-48b0-b4a7-9c3e0d6f251b] RbWoda.wodaStripDescriptor (Method 4e26dedb, Class 67852ca8)
  // R31.5.6 WODA-INSTANCE: express WODA as an rb-strip descriptor array [{bar:What (expandable)},{C:Overview},
  // {C:Details},{bar:Actions}] (nav {What,Overview,Details,Actions}). The What bar EXPANDS to a What compartment via
  // rb-compartment's presentation duality (bar↔compartment). PURE descriptor wiring — same infra as the editor
  // instance (5.5), zero new layout code → proves one-model-two-instances. Marker on this decl (#126).
  wodaStripDescriptor(): { id: string; kind: 'compartment' | 'bar'; label?: string }[] {
    return [
      { id: 'what', kind: 'bar', label: 'What' },
      { id: 'overview', kind: 'compartment', label: 'Overview' },
      { id: 'details', kind: 'compartment', label: 'Details' },
      { id: 'actions', kind: 'bar', label: 'Actions' },
    ];
  }
}
customElements.define('rb-woda', RbWoda);
