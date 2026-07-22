// R31.5.1 — RbCompartment (<rb-compartment>): the bar↔compartment PRESENTATION duality on ONE component.
// Design: design-r31.5-build-decomposition.md PIECE 2 (Tron BUILD-authorized). presentation='expanded'|'bar' branches
// ONLY the presentation layer (CSS + which subset is shown); the hosted content (light-DOM children, moved once into
// .rbc-content) + its behavior stay FIXED — NOT two components. AC-INV-PRESENTATION (5.8): the SAME instance, both
// modes, passes the SAME functional tests. Bar-render (icons/verb-buttons from the same content) is a PRIVATE helper.
export class RbCompartment extends HTMLElement {
  static get observedAttributes() { return ['presentation']; }
  private _bar: HTMLElement | null = null;

  connectedCallback(): void {
    if (!this.querySelector(':scope > .rbc-content')) this.wrap();
    this.applyPresentation((this.getAttribute('presentation') as 'expanded' | 'bar') || 'expanded');
  }
  attributeChangedCallback(name: string): void {
    if (name === 'presentation') this.applyPresentation((this.getAttribute('presentation') as 'expanded' | 'bar') || 'expanded');
  }

  // Move the author's children into a .rbc-content wrapper ONCE (content DOM + its listeners preserved) so a
  // presentation flip only hides/shows — never reparents (which would drop behavior).
  private wrap(): void {
    const content = document.createElement('div');
    content.className = 'rbc-content';
    while (this.firstChild) content.appendChild(this.firstChild);
    this.appendChild(content);
  }

  // [impl:uuid:4d7e2a91-6b3c-4f8a-9e1d-2c5b7a0f3e64] RbCompartment.applyPresentation (Method 7e611ee4, Class eea850ba)
  // R31.5.1 LOAD-BEARING: expanded = full content []; bar = collapsed strip | of icons/verb-buttons from the SAME
  // content. Branches ONLY presentation (data 'presentation' attr → app.css) + builds/hides the bar strip; the
  // .rbc-content children stay in the DOM (behavior fixed). Bar-render = the private renderBar helper.
  applyPresentation(mode: 'expanded' | 'bar'): void {
    if (this.getAttribute('presentation') !== mode) this.setAttribute('presentation', mode);
    if (mode === 'bar') this.ensureBar();
    else if (this._bar) this._bar.hidden = true;
  }

  private ensureBar(): void {
    if (!this._bar) { this._bar = document.createElement('div'); this._bar.className = 'rbc-bar'; this.appendChild(this._bar); }
    this.renderBar(this._bar);
    this._bar.hidden = false;
  }

  // PRIVATE helper (not a chain Method): derive the collapsed strip from the SAME content — each descendant carrying
  // data-icon / data-verb / data-label becomes an icon or verb-button proxy that RE-DISPATCHES to its source element,
  // so the bar shares the content's behavior (no forked handlers → the invariant holds).
  private renderBar(bar: HTMLElement): void {
    bar.innerHTML = '';
    const content = this.querySelector(':scope > .rbc-content');
    const items = content ? Array.from(content.querySelectorAll<HTMLElement>('[data-icon],[data-verb],[data-label]')) : [];
    for (const el of items) {
      const b = document.createElement('button');
      b.className = 'rbc-bar-item';
      b.textContent = el.dataset.icon || el.dataset.verb || el.dataset.label || '•';
      if (el.dataset.verb) b.title = el.dataset.verb;
      b.addEventListener('click', () => el.click()); // proxy → same behavior (content fixed)
      bar.appendChild(b);
    }
  }
}
customElements.define('rb-compartment', RbCompartment);
