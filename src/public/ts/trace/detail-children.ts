/**
 * R18.9 — Detail pane fetches ?mode=scenario for full object children.
 * Tree stays ?mode=trace (narrowed). Detail shows ALL children.
 */

export interface DetailChild {
  uuid: string;
  type: string;
  name: string;
  hasChildren: boolean;
}

export async function fetchDetailChildren(uuid: string): Promise<DetailChild[]> {
  try {
    const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}?mode=scenario`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.children || [];
  } catch { return []; }
}

export function renderDetailChildren(children: DetailChild[], navigate: (type: string, verb: string, params: Record<string, string>) => void): string {
  if (children.length === 0) return '<div class="dv-empty">no children</div>';
  return children.map(c =>
    `<div class="dv-link" data-ref="${c.type.toLowerCase()}:${c.uuid}" data-uuid="${c.uuid}" data-type="${c.type}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${esc(c.name)}</span></div>`
  ).join('');
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
