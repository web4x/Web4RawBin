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

  // [impl:uuid:7e147ad8-aa69-4f02-9844-8652691add0a] RbModelElementDetail.render (Method c2da9192, Class 7788ebe0, off UC 4fad0415 modelElement.inspect) — R32.10 PART B
  private async render(): Promise<void> {
    const ref = this.getAttribute('ref') || '';
    if (ref.startsWith('puml-src:')) { await this.renderPumlSource(ref.slice('puml-src:'.length)); return; } // R33.6 item-4 (A): existing-source .puml FOLDER node
    const uuid = stripRef(ref);
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
      if (dref) {
        html += `<div class="dv-link" data-ref="${dref}" style="margin-top:12px"><span class="dv-link-title">📐 Open diagram</span></div>`;
        // R32.11 COMPLEMENT (PO): selecting a class auto-shows its view in the diagram via the SAME add-view path
        // (server dedups → idempotent; additive to the drag, not replacing it). Fire-and-forget; no coords → server auto-grid.
        void fetch('/api/model/diagram/add-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid: dref.slice('diagram:'.length), elementUuid: uuid }) }).catch(() => { /* noop */ });
      }
    } else {
      // method / attribute / property → signature
      const sig = `${esc(name)}${kind === 'method' ? '()' : ''}${m.returns || m.type ? ': ' + esc(String(m.returns || m.type)) : ''}`;
      html += this.sec('Signature') + `<div style="font-family:monospace;color:#9cdcfe;font-size:0.85rem">${sig}</div>`;
      if (m.memberOf) html += this.sec('Member of') + this.link(`modelelement:${stripRef(String(m.memberOf))}`, 'memberOf', 'owner');
      html += await relSection();
    }
    // T36.5 "Where used" — the R36.2 usedIn side-index [{kind,ref}] (diagrams/folders referencing this element),
    // already merged onto the model at /api/ior. Reuses sec()/link(); each row drills via the existing .dv-link
    // handler below (kind-prefixed ref → selectionModel.replaceWith). Empty → "Not used". All element kinds (both
    // render branches merge here).
    const usedIn = Array.isArray(m.usedIn) ? (m.usedIn as { kind: string; ref: string }[]) : [];
    html += this.sec('Where used', usedIn.length);
    if (!usedIn.length) html += '<div class="dv-empty">Not used</div>';
    else html += (await Promise.all(usedIn.map(async (u) => {
      const rid = stripRef(u.ref);
      const drill = u.kind === 'diagram' ? `diagram:${rid}` : `puml-src:${u.ref}`;
      const title = u.kind === 'diagram' ? String((await this.fetchModel(rid))?.name || 'Diagram') : (u.ref.split('/').pop() || u.ref);
      return this.link(drill, u.kind, title);
    }))).join('');
    this.innerHTML = html;
    this.querySelectorAll('.dv-link').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); const ref = (el as HTMLElement).getAttribute('data-ref'); if (ref) selectionModel.replaceWith(ref); }));
  }

  // [impl:uuid:b0c0d27d-ff30-4021-a085-1d8945fd389d] RbModelElementDetail.renderPumlSource (Method 3a433a45) — R33.6
  // item-4 (A, existing-source): a puml-src:<relpath> FOLDER itemview renders the EXISTING authored .puml as SVG. Fetch
  // the raw source READ-ONLY (GET /md/scrum.pmo/sprints/<relpath>, INV-P1.3) → POST it to /api/puml-render (the SAME
  // renderer rb-preview.renderPuml + the /md preview use → INV-P1.2 no-fork). Existing-source ONLY, never modelToPuml (INV-P1.1).
  private async renderPumlSource(relPath: string): Promise<void> {
    const name = relPath.split('/').pop() || relPath;
    this.innerHTML = `<h3 style="color:white;margin:0 0 4px;font-size:0.95rem">${esc(name)}</h3>`
      + `<div class="dv-rel" style="margin:0 0 8px">&laquo;puml&raquo; &middot; ${esc(relPath)}</div>`
      + `<div class="dv-puml" style="overflow:auto"><div class="dv-empty">Rendering PlantUML&hellip;</div></div>`;
    const host = this.querySelector('.dv-puml'); if (!host) return;
    try {
      const srcRes = await fetch(`/md/scrum.pmo/sprints/${encodeURI(relPath)}`); // read-only raw .puml (server /md/*.puml)
      if (!srcRes.ok) throw new Error(`source HTTP ${srcRes.status}`);
      const puml = await srcRes.text();
      const svgRes = await fetch('/api/puml-render', { method: 'POST', body: puml }); // SAME render path as rb-preview.renderPuml
      if (!svgRes.ok) throw new Error(`render HTTP ${svgRes.status}`);
      host.innerHTML = await svgRes.text();
    } catch (e) {
      host.innerHTML = `<div class="dv-empty">Could not render PUML: ${esc(e instanceof Error ? e.message : String(e))}</div>`;
    }
  }
}
if (!customElements.get('rb-modelelement-detail')) customElements.define('rb-modelelement-detail', RbModelElementDetail);
