// R32.10 (PART B, INV-M2) rb-modelelement-detail — the drawer detail for an ior:class:ModelElement (MDA M1 unit).
// R37.26-CONVERGENCE (Phase A, architect design 19c340d4f/f0999a5e1): NOW extends RbDetailBase — the render FUNNEL, the
// ONE model-source, and the fail-LOUD renderUnresolved live in the base. This element implements ONLY its ModelElement
// DOM via renderDetail(ctx). The base resolves BOTH ref shapes it receives: modelelement:<uuid> → the M1 unit model
// (ctx.model); puml-src:<relpath> → a PumlArtifact view unit (server ensureViewUnit, server.ts:1247) so the base does
// NOT fail-loud it — renderDetail branches on the ref and renders the authored .puml as SVG (an EXTRA artifact render
// via the supplemental boundary, degrades its own section inline). Deleted: own connectedCallback/attributeChangedCallback
// funnel, the PRIMARY fetch(/api/ior) + 'Model element not found' path (a genuine 404 is now the base's honest ⚠ unresolved).
// Secondary fetchModel() lookups (member/relation/usedIn names) STAY — they are supplemental enrichment, not the primary source.
import { selectionModel } from './selection-model.js';
import { stripRef } from './diagram-view-model.js'; // BUG B: THE ONE shared generic ref-parser (no per-module copy that can drift)
import { RbDetailBase, type DetailCtx } from './rb-detail-base.js'; // R37.24 inc2: the ONE detail primitive (funnel + one-source + fail-loud)

const esc = (s: string): string => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

class RbModelElementDetail extends RbDetailBase {
  // A SECONDARY lookup for member/relation/usedIn NAMES (not the primary source — that is the base's ctx.model). Mirrors
  // rb-diagram-detail; unions the isolated MODEL_STORE via /api/ior. Supplemental → tolerant (null on failure = a name falls back to the short uuid).
  private async fetchModel(uuid: string): Promise<Record<string, unknown> | null> {
    try { const r = await fetch(`/api/ior/ior:instance:${uuid}`); return (await r.json())?.unit?.model || null; } catch { return null; }
  }
  // The Diagram root of the current model (deterministic per source-file) — resolved via /api/model/tree so class → '📐 Open diagram' opens rb-diagram-detail.
  private async diagramRef(): Promise<string> {
    try { const r = await fetch('/api/model/tree'); const roots = ((await r.json())?.roots || []) as { uuid: string; type: string }[]; const d = roots.find((x) => x.type === 'diagram'); return d ? `diagram:${d.uuid}` : ''; } catch { return ''; }
  }

  private sec(label: string, n?: number): string { return `<h4 style="color:#8b949e;font-size:0.72rem;text-transform:uppercase;letter-spacing:.04em;margin:12px 0 4px">${esc(label)}${n === undefined ? '' : ` (${n})`}</h4>`; }
  private link(ref: string, rel: string, title: string): string { return `<div class="dv-link" data-ref="${ref}"><span class="dv-rel">${esc(rel)}</span><span class="dv-link-title">${esc(title)}</span></div>`; }

  // R37.24 inc2: the funnel + one-model-source + honest-empty-on-unresolved live in RbDetailBase. This element renders
  // ONLY its DOM from the resolved ctx — branching on the ref shape the base already resolved.
  // [impl:uuid:7e147ad8-aa69-4f02-9844-8652691add0a] RbModelElementDetail.renderDetail (Method c2da9192, Class 7788ebe0, off UC 4fad0415 modelElement.inspect) — R32.10 PART B (carried onto renderDetail — R37.26 convergence)
  protected renderDetail({ ref, uuid, model }: DetailCtx): void {
    if (ref.startsWith('puml-src:')) { void this.renderPumlSource(ref.slice('puml-src:'.length)); return; } // R33.6 item-4 (A): existing-source .puml FOLDER node (base resolved the PumlArtifact → no fail-loud)
    void this.renderElement(uuid, model || {});
  }

  private async renderElement(uuid: string, m: Record<string, unknown>): Promise<void> {
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
        // R32.11 COMPLEMENT (PO): selecting a class auto-shows its view in the diagram via the SAME add-view path (server dedups → idempotent). Fire-and-forget.
        void fetch('/api/model/diagram/add-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid: dref.slice('diagram:'.length), elementUuid: uuid }) }).catch(() => { /* noop */ });
      }
    } else {
      const sig = `${esc(name)}${kind === 'method' ? '()' : ''}${m.returns || m.type ? ': ' + esc(String(m.returns || m.type)) : ''}`;
      html += this.sec('Signature') + `<div style="font-family:monospace;color:#9cdcfe;font-size:0.85rem">${sig}</div>`;
      if (m.memberOf) html += this.sec('Member of') + this.link(`modelelement:${stripRef(String(m.memberOf))}`, 'memberOf', 'owner');
      html += await relSection();
    }
    // T36.5 "Where used" — the R36.2 usedIn side-index [{kind,ref}] merged onto the model at /api/ior. Empty → "Not used".
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
  // item-4 (A, existing-source): a puml-src:<relpath> node renders the EXISTING authored .puml as SVG. Fetch the raw
  // source READ-ONLY (GET /md/...) → POST to /api/puml-render (the SAME renderer /md preview uses). Existing-source ONLY.
  // Supplemental artifact render: degrades ITS OWN section inline on failure (never a silent whole-element blank).
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
