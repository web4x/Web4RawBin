/**
 * R18.9+R18.10 — Detail pane: scenario children + parent link.
 */

export interface DetailChild {
  uuid: string;
  type: string;
  name: string;
  hasChildren: boolean;
}

export interface DetailParent {
  uuid: string;
  type: string;
  name: string;
}

export interface DetailData {
  children: DetailChild[];
  parent: DetailParent | null;
}

export async function fetchDetailData(uuid: string): Promise<DetailData> {
  try {
    const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}?mode=scenario`);
    if (!res.ok) return { children: [], parent: null };
    const data = await res.json();
    return { children: data.children || [], parent: data.parent || null };
  } catch { return { children: [], parent: null }; }
}

export async function fetchDetailChildren(uuid: string): Promise<DetailChild[]> {
  const data = await fetchDetailData(uuid);
  return data.children;
}

export function renderParentLink(parent: DetailParent | null): string {
  if (!parent) return '';
  return `<div class="dv-parent" style="margin-bottom:8px"><span style="color:rgba(255,255,255,0.4);font-size:0.7rem">Parent:</span> <a href="#" class="dv-parent-link" data-uuid="${parent.uuid}" data-type="${parent.type}" style="color:#ff9800;font-size:0.8rem;text-decoration:none">${esc(parent.type)}: ${esc(parent.name)}</a></div>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
