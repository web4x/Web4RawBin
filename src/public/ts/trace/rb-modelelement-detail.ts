// R32.10 (PART B, INV-M2) rb-modelelement-detail — the drawer detail for an ior:class:ModelElement (MDA M1 unit).
// Registered in the rb-detail-drawer tagMap under 'modelelement'. Fetches the unit via /api/ior (unions the isolated
// MODEL_STORE, like rb-diagram-detail) and renders KIND-DRIVEN: class/interface → «kind» + members (each drills to
// its signature) + relations + a '📐 Open diagram' link (→ the Diagram root, reuses the existing rb-diagram-detail);
// method/attribute/property → its signature. Self-contained fetch (no graph dep); navigation via the SHARED
// selectionModel.replaceWith (standard selection flow → the drawer re-renders the target). Reuse, no fork.
import { selectionModel } from './selection-model.js';

const stripRef = (r: string): string => r.replace(/^[a-z]+:/i, '').replace(/^ior:instance:/, '');
const esc = (s: string): string => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

class RbModelElementDetail extends HTMLElement {
  graph: unknown = null; // set by the drawer (unused — this view fetches its own model, mirrors rb-diagram-detail)
  static get observedAttributes(): string[] { return ['ref']; }
  connectedCallback(): void { void this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) void this.render(); }

  private async fetchModel(uuid: string): Promise<Record<string, unknown> | null> {
    try { const r = await fetch(`/api/ior/ior:instance:${uuid}`); return (await r.json())?.unit?.model || null; } catch { return null; }
  }
  // The Diagram root of the current model (deterministic per source-file; classes don't back-ref it) — resolved via
  // the /api/model/tree Diagram root so the class → '📐 Open diagram' link opens the existing rb-diagram-detail.
  private async diagramRef(): Promise<string> {
    try { const r = await fetch('/api/model/tree'); const roots = ((await r.json())?.roots || []) as { uuid: string; type: string }[]; const d = roots.find((x) => x.type === 'diagram'); return d ? `diagram:${d.uuid}` : ''; } catch { return ''; }
  }

  private sec(label: string, n?: number): string { return `<h4 style="color:#8b949e;font-size:0.72rem;text-transform:uppercase;letter-spacing:.04em;margin:12px 0 4px">${esc(label)}${n === undefined ? '' : ` (${n})`}</h4>`; }
  private link(ref: string, rel: string, title: string): string { return `<div class="dv-link" data-ref="${ref}"><span class="dv-rel">${esc(rel)}</span><span class="dv-link-title">${esc(title)}</span></div>`; }

  private async render(): Promise<void> {
    const uuid = stripRef(this.getAttribute('ref') || '');
    if (!uuid) return;
    const m = await this.fetchModel(uuid);
    if (!m) { this.innerHTML = '<div class="dv-empty">Model element not found</div>'; return; }
    const kind = String(m.kind || 'element');
    const name = String(m.name || uuid.slice(0, 8));
    const relRefs = Array.isArray(m.relatesTo) ? (m.relatesTo as string[]) : [];
    const relSection = async (): Promise<string> => {
      if (!relRefs.length) return '';
      const rows = await Promise.all(relRefs.map(async (ref) => { const ru = stripRef(ref); const rm = await this.fetchModel(ru); return this.link(`modelelement:${ru}`, 'relatesTo', String(rm?.name || ru.slice(0, 8))); }));
      return this.sec('Relations', relRefs.length) + rows.join('');
    };

    let html = `<h3 style="color:white;margin:0 0 4px;font-size:0.95rem">${esc(name)}</h3>` +
      `<div class="dv-rel" style="margin:0 0 6px">&laquo;${esc(kind)}&raquo;${m.sourceFile ? ' · ' + esc(String(m.sourceFile)) : ''}</div>`;

    if (kind === 'class' || kind === 'interface') {
      const memberRefs = Array.isArray(m.members) ? (m.members as string[]) : [];
      html += this.sec('Members', memberRefs.length);
      if (!memberRefs.length) html += '<div class="dv-empty">None</div>';
      else html += (await Promise.all(memberRefs.map(async (ref) => { const mu = stripRef(ref); const mm = await this.fetchModel(mu); return this.link(`modelelement:${mu}`, String(mm?.kind || 'member'), String(mm?.name || mu.slice(0, 8))); }))).join('');
      html += await relSection();
      const dref = await this.diagramRef();
      if (dref) html += `<div class="dv-link" data-ref="${dref}" style="margin-top:12px"><span class="dv-link-title">📐 Open diagram</span></div>`;
    } else {
      // method / attribute / property → signature
      const sig = `${esc(name)}${kind === 'method' ? '()' : ''}${m.returns || m.type ? ': ' + esc(String(m.returns || m.type)) : ''}`;
      html += this.sec('Signature') + `<div style="font-family:monospace;color:#9cdcfe;font-size:0.85rem">${sig}</div>`;
      if (m.memberOf) html += this.sec('Member of') + this.link(`modelelement:${stripRef(String(m.memberOf))}`, 'memberOf', 'owner');
      html += await relSection();
    }
    this.innerHTML = html;
    this.querySelectorAll('.dv-link').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); const ref = (el as HTMLElement).getAttribute('data-ref'); if (ref) selectionModel.replaceWith(ref); }));
  }
}
if (!customElements.get('rb-modelelement-detail')) customElements.define('rb-modelelement-detail', RbModelElementDetail);
