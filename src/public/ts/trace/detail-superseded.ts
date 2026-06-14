/**
 * R20.5 — Shared detail section helpers consumed by ALL detail views.
 * renderSupersededLinks + renderAllChildrenSection.
 */
import { navigate } from './nav.js';

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
    container.appendChild(secEl);
    secEl.querySelectorAll('.dv-sup-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        navigate(lref.split(':')[0], 'show', { uuid: lref.split(':')[1] || lref });
      });
    });
  }).catch(() => {});
}

// [impl:uuid:308008bf-70eb-4b87-82ef-d76c97590c07] renderAllChildrenSection
export function renderAllChildrenSection(container: HTMLElement, children: { uuid: string; type: string; name: string }[]): void {
  if (children.length === 0) return;
  const secEl = document.createElement('div');
  secEl.style.cssText = 'border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px';
  secEl.innerHTML = `<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">All Children</h4>` +
    children.map(c => `<div class="dv-link dv-child-link" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('');
  container.appendChild(secEl);
  secEl.querySelectorAll('.dv-child-link').forEach(row => {
    row.addEventListener('click', () => {
      const lref = (row as HTMLElement).dataset.ref!;
      navigate(lref.split(':')[0], 'show', { uuid: lref.split(':')[1] || lref });
    });
  });
}
