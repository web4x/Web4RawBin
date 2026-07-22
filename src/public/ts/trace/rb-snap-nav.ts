// R31.5.3 — RbSnapNav (<rb-snap-nav>): data-driven bottom snap-nav for an rb-strip. Design PIECE 4
// (design-r31.5-build-decomposition.md). One button per COMPARTMENT segment of the bound strip; click → native
// scrollIntoView the compartment's snap point (NO JS scroll math). BARS are NOT buttons (compartments-only snap
// targets). Bottom-anchored. Depends on rb-strip (5.2, built). Net-new — added around, wired at the instance step.
import type { RbStrip } from './rb-strip.js';

export class RbSnapNav extends HTMLElement {
  private _strip: RbStrip | null = null;

  connectedCallback(): void { this.render(); }
  set strip(s: RbStrip | null) { this._strip = s; if (this.isConnected) this.render(); }
  get strip(): RbStrip | null { return this._strip; }

  // [impl:uuid:7c1f9a3e-5d84-42b6-a9e1-0f8c2b6d4e37] RbSnapNav.render (Method 4301b9cc, Class e0cead14)
  // R31.5.3 LOAD-BEARING: read the bound strip's COMPARTMENT segments → one button per compartment (label from the
  // descriptor label, fallback id); click → scrollIntoView that compartment's snap point (native CSS scroll-snap, NO
  // JS scroll math) + mark it active on the strip (focus-restore across landscape↔portrait flips). BARS are NOT
  // buttons. buildButton + wireClick are PRIVATE helpers.
  render(): void {
    this.innerHTML = '';
    const strip = this._strip;
    if (!strip) return;
    const compartments = Array.from(strip.querySelectorAll<HTMLElement>(':scope > .rb-seg-compartment'));
    for (const seg of compartments) this.appendChild(this.buildButton(seg, strip));
  }

  private buildButton(seg: HTMLElement, strip: RbStrip): HTMLButtonElement {
    const id = seg.dataset.id || '';
    const b = document.createElement('button');
    b.className = 'rb-snap-btn';
    b.textContent = seg.dataset.label || id;
    b.dataset.target = id;
    this.wireClick(b, seg, strip, id);
    return b;
  }

  private wireClick(b: HTMLButtonElement, seg: HTMLElement, strip: RbStrip, id: string): void {
    b.addEventListener('click', () => {
      seg.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' }); // native snap point — no JS scroll math
      strip.setActive(id); // focus-restore anchor across landscape↔portrait flips
    });
  }
}
customElements.define('rb-snap-nav', RbSnapNav);
