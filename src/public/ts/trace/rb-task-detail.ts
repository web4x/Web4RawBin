/**
 * T111 — rb-task-detail: specialized DetailView for Task objects.
 *
 * Shows status badge, sprint, owner, and traceability chain links.
 * Renders inside rb-detail-drawer (T110). Self-registers as custom element.
 *
 * [impl:uuid:e1ad6c89-269b-47d2-96b5-1fa356cbc226] R16.2 TaskDetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus, viewBusKey } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
// [impl:uuid:1ff4d2bb-3af9-4517-8cde-8e6fc498e887] RbTaskDetail.render impl
// [impl:uuid:a495b735-6836-4dba-84b2-b279f2da17df] RbTaskDetail.render
import { renderSupersededSection, renderAllChildrenSection, renderChainPathSection } from './detail-superseded.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserHref } from './detail-children.js'; // T37.26: inline Scenario/Edit link removed from the body — the bar (◆ Scenario / ✎ Edit) is the ONE action surface

export class RbTaskDetail extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref']; }
  private unsubs: Array<() => void> = [];

  connectedCallback(): void { this.render(); }
  disconnectedCallback(): void { this.clearSubs(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  private clearSubs(): void { for (const u of this.unsubs) u(); this.unsubs = []; }

  render(): void {
    this.clearSubs();
    const ref = this.getAttribute('ref') || '';
    const obj = this.graph?.get(refUuid(ref));
    if (!obj) { this.innerHTML = '<div class="dv-empty">Task not found</div>'; return; }

    const links = forwardOnly(obj);
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge dv-type-task">Task</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
      </div>
      <div class="dv-fields">
        <div class="dv-field"><label>Status</label>
          <span class="dv-status-badge">${esc(obj.status || 'PLANNED')}</span></div>
        ${obj.sprint ? `<div class="dv-field"><label>Sprint</label><span>${esc(obj.sprint)}</span></div>` : ''}
      </div>
      <!-- T37.26: inline 📄 Scenario / ✏️ Edit removed — duplicated the bar's ◆ Scenario / ✎ Edit (bar = action surface, body = DATA) -->
      <div class="dv-links">
        <h4>Forward Links</h4>
        ${renderLinks(this.graph, links)}
      </div>`;

    this.unsubs.push(ViewBus.subscribe(viewBusKey(ref), () => this.render()));
    this.loadDetailData(obj.uuid);
  }

  private loadDetailData(uuid: string): void {
    Promise.all([
      fetchDetailData(uuid),
      fetch(`/api/ior/ior:instance:${uuid}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(async ([{ children, parent, sourceFile, sourceLine }, iorData]) => {
      // v0.7.6: visual statusChecklist from the full scenario model. T37.26: the 📄 Task file link moved to the bar's
      // Open-Task-file ACTION (server-computed model.taskMdHref) — the body no longer renders it (bar = the action surface).
      const model = (iorData?.unit?.model || {}) as Record<string, any>;
      // R40.31(b) FIX (architect 624f5eba3): FRESH-WINS on the status BADGE too (mirror the action-bar precedence fix).
      // render() paints .dv-status-badge from the possibly-STALE cached graph obj.status; the /api/ior model.status fetched
      // here is fresh (attachTaskStatus derives it at the read boundary), so overwrite the badge → a live status change (e.g.
      // Set-as-Current Planned→In-Progress, remote approve) flips the BADGE and the CONTROLS together, not just the controls.
      const badge = this.querySelector('.dv-status-badge');
      if (badge && model.status) badge.textContent = String(model.status);
      const fields = this.querySelector('.dv-fields');
      if (fields) {
        if (model.statusChecklist) fields.insertAdjacentHTML('beforeend', renderStatusChecklist(String(model.statusChecklist)));
      }
      if (sourceFile) { const sh = this.querySelector('.dv-head'); if (sh) sh.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine)); }
      if (parent) {
        const head = this.querySelector('.dv-head');
        if (head) { head.insertAdjacentHTML('afterend', renderParentLink(parent)); this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid }); }); }
      }
      renderChainPathSection(this, uuid);
      renderAllChildrenSection(this, children);
      renderSupersededSection(this, uuid);
      await this.renderChangeRequests(model);
    });
  }

  // R40.10 BUG A — render the task's decline-minted ChangeRequests as CHILD itemViews, OUTSIDE the forwardOnly chain
  // (render-only: the edge ALREADY exists via CR.ownerIor→task + the task.changeRequests mirror; NO new link written,
  // the chain stays byte-identical). Each CR → an rb-object-item itemView (name + badge + click-through to its reason).
  // [impl:uuid:e080ef45-f2ae-4640-a2ee-6677040f9aa2] RbTaskDetail.renderChangeRequests (R40.10 BUG A)
  private async renderChangeRequests(model: Record<string, any>): Promise<void> {
    const crRefs: string[] = Array.isArray(model.changeRequests) ? model.changeRequests : [];
    if (!crRefs.length || !this.isConnected) return;
    const items = await Promise.all(crRefs.map((r) => String(r).replace('ior:instance:', '')).map(async (u) => {
      const cm = await fetch(`/api/ior/ior:instance:${u}`).then(x => x.ok ? x.json() : null).catch(() => null);
      const nm = String(cm?.unit?.model?.name || 'Change Request');
      const st = String(cm?.unit?.model?.status || '');
      return `<rb-object-item ref="changerequest:${u}" type="changerequest" name="${esc(nm)}"${st ? ` status="${esc(st)}"` : ''}></rb-object-item>`;
    }));
    this.querySelector('.dv-links')?.insertAdjacentHTML('afterend', `<div class="dv-links dv-change-requests"><h4>Change Requests</h4>${items.join('')}</div>`);
  }
}

// v0.7.6: sprint dir = slugified sprint name ("Sprint 26 — RawBin Federation" → "sprint-26-rawbin-federation").
function slugifySprint(name: string): string {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
// R27.3: link to the task's OWN MD file. IGNORE sourceFile=planning.md (that collapses every task to the
// shared planning view → 404 on the real per-task file). Use the sprint's PINNED slug for the dir (drift-proof,
// matches the generator) — NOT slugify(sprintName), which drifted from the actual sprint dir.
// [impl:uuid:d6b29c09-132b-4828-b9c6-d59c9929ccb8] R22.1 RbTaskDetail.taskMdHref (Forward-Links → MD-file link)
function taskMdHref(model: Record<string, any>, sprintSlug: string): string {
  const sf = String(model.sourceFile || '').replace(/^ior:file:/, '');
  if (sf && !/(^|\/)planning\.md$/.test(sf)) return `/md/${sf}`;
  const slug = String(model.slug || '');
  return (slug && sprintSlug) ? `/md/scrum.pmo/sprints/${sprintSlug}/${slug}.md` : '';
}
// v0.7.6: render the markdown statusChecklist ("- [x] Planned\n- [ ] In Progress\n  - [x] refinement…")
// as a hierarchical visual checklist (☑/☐ + indentation).
// [impl:uuid:31f420b0-e99e-458f-9c29-df4152940f77] R27.1 RbTaskDetail.renderStatusChecklist
function renderStatusChecklist(md: string): string {
  const rows = md.split('\n').filter(l => /^\s*-\s*\[[ xX]\]/.test(l)).map(l => {
    const indent = (l.match(/^\s*/)?.[0].length || 0);
    const done = /\[[xX]\]/.test(l);
    const label = l.replace(/^\s*-\s*\[[ xX]\]\s*/, '').trim();
    return `<div style="padding-left:${indent * 12}px;color:${done ? '#8bc34a' : 'rgba(255,255,255,0.55)'}">${done ? '☑' : '☐'} ${esc(label)}</div>`;
  });
  return rows.length ? `<div class="dv-field" style="display:block"><label>Status</label><div style="margin-top:4px;font-size:0.82rem;line-height:1.7">${rows.join('')}</div></div>` : '';
}

const CHAIN_TYPES = new Set(['requirement', 'usecase', 'class', 'method', 'implementation', 'test', 'bug', 'changerequest']);
function renderLinks(graph: TraceGraph | null, links: Record<string, string[]>): string {
  const rows: string[] = [];
  for (const [relation, refs] of Object.entries(links)) {
    for (const lref of refs) {
      const lobj = graph?.get(refUuid(lref));
      const ltype = lref.split(':')[0];
      if (!CHAIN_TYPES.has(ltype)) continue;
      rows.push(`<a class="dv-link" href="${scenarioBrowserHref(refUuid(lref))}" style="display:block;color:#ff9800;text-decoration:none"><span class="dv-rel">${relation}</span><span class="dv-link-title">${esc(lobj?.title || lref)}</span></a>`);
    }
  }
  return rows.join('') || '<div class="dv-empty">no links</div>';
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-task-detail')) {
  customElements.define('rb-task-detail', RbTaskDetail);
}
