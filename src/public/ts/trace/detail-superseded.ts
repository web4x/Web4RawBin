/**
 * R20.5 — Shared detail section helpers consumed by ALL detail views.
 * renderSupersededLinks + renderAllChildrenSection.
 */
import { navigate } from './nav.js';
import { renderSourceLink } from './detail-children.js';
import { upsertSection } from './detail-render.js'; // R37.12 (B): the ONE idempotent section insert — these shared helpers append-once, never stack

function toArr(v: unknown): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [String(v)];
}

// [impl:uuid:45cfa001-a50a-4554-9f6a-3b641a9174aa] renderSupersededSection
export function renderSupersededSection(container: HTMLElement, uuid: string): void {
  fetch(`/api/ior/ior:instance:${uuid}`).then(r => r.json()).then(iorData => {
    const model = iorData.unit?.model || {};
    const supersededBy = [...toArr(model.supersededBy), ...toArr(model.refinementOf)];
    const supersedes = toArr(model.supersedes);
    if (supersededBy.length === 0 && supersedes.length === 0) return;
    const secEl = document.createElement('div');
    secEl.style.cssText = 'border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px';
    const lines: string[] = [];
    if (supersededBy.length > 0) lines.push(`<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">Superseded by / Refines</h4>` + supersededBy.map(ref => { const id = ref.replace('ior:instance:', ''); return `<div class="dv-link dv-sup-link" data-ref="requirement:${id}"><span class="dv-rel">refines</span><span class="dv-link-title">${id.slice(0,8)}</span></div>`; }).join(''));
    if (supersedes.length > 0) lines.push(`<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">Supersedes</h4>` + supersedes.map(ref => { const id = ref.replace('ior:instance:', ''); return `<div class="dv-link dv-sup-link" data-ref="requirement:${id}"><span class="dv-rel">supersedes</span><span class="dv-link-title">${id.slice(0,8)}</span></div>`; }).join(''));
    secEl.innerHTML = lines.join('');
    upsertSection(container, 'dv-superseded-section', secEl); // R37.12 (B): replace any prior superseded section, never stack
    secEl.querySelectorAll('.dv-sup-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        navigate(lref.split(':')[0], 'show', { uuid: lref.split(':')[1] || lref });
      });
    });
  }).catch(() => {});
}

// [impl:uuid:63d58e0f-b1a2-4c3d-8e4f-5a6b7c8d9e0f] R20.30 renderChainPathSection — depth-first single path
// [impl:uuid:ef1c4bcd-9f1f-4800-80ce-deccbde02323] R20.30 RbDetailView.renderChainPathSection
// [impl:uuid:bd8e5d6f-d289-494b-891f-3572f62ce3c7] R22.3 RbDetailView.renderChainPathSection (node source link)
export function renderChainPathSection(container: HTMLElement, uuid: string): void {
  const secEl = document.createElement('div');
  secEl.className = 'dv-chain-path';
  secEl.style.cssText = 'border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px';
  secEl.innerHTML = '<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">Traceability Chain</h4><div class="dv-chain-walk" style="color:rgba(255,255,255,0.4);font-size:0.75rem">Loading chain...</div>';
  upsertSection(container, 'dv-chain-path', secEl); // R37.12 (B): replace any prior chain section (marker already = its className), never stack

  async function walkChain(nodeUuid: string, depth: number): Promise<string> {
    if (depth > 6) return '';
    try {
      const res = await fetch(`/api/trace/children/${encodeURIComponent(nodeUuid)}?mode=trace`);
      if (!res.ok) return '';
      const data = await res.json();
      const children = data.children || [];
      if (children.length === 0) return '';
      const first = children[0];
      const indent = '  '.repeat(depth);
      const rest = await walkChain(first.uuid, depth + 1);
      // R22.3: per-hop source link (Class→.puml, Method/Impl→.ts:line) on its OWN line so it doesn't hijack the row's navigate click
      const srcLink = first.sourceFile ? `<div style="padding-left:${depth * 12 + 16}px">${renderSourceLink(first.sourceFile, first.sourceLine)}</div>` : '';
      return `<div class="dv-link dv-chain-link" data-ref="${first.type.toLowerCase()}:${first.uuid}" style="padding-left:${depth * 12}px"><span class="dv-rel">${first.type}</span><span class="dv-link-title">${esc(first.name)}</span></div>${srcLink}${rest}`;
    } catch { return ''; }
  }

  walkChain(uuid, 0).then(html => {
    const target = secEl.querySelector('.dv-chain-walk');
    if (!target) return;
    if (!html) { target.textContent = 'no chain path'; return; }
    target.outerHTML = html;
    secEl.querySelectorAll('.dv-chain-link').forEach(row => {
      row.addEventListener('click', () => {
        const r = (row as HTMLElement).dataset.ref!;
        navigate(r.split(':')[0], 'show', { uuid: r.split(':')[1] || '' });
      });
    });
  });
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

// [impl:uuid:308008bf-70eb-4b87-82ef-d76c97590c07] renderAllChildrenSection
export function renderAllChildrenSection(container: HTMLElement, children: { uuid: string; type: string; name: string }[]): void {
  if (children.length === 0) return;
  const secEl = document.createElement('div');
  secEl.style.cssText = 'border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px';
  secEl.innerHTML = `<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">All Children</h4>` +
    children.map(c => `<div class="dv-link dv-child-link" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('');
  upsertSection(container, 'dv-children-section', secEl); // R37.12 (B): replace any prior children section, never stack
  secEl.querySelectorAll('.dv-child-link').forEach(row => {
    row.addEventListener('click', () => {
      const lref = (row as HTMLElement).dataset.ref!;
      navigate(lref.split(':')[0], 'show', { uuid: lref.split(':')[1] || lref });
    });
  });
}
