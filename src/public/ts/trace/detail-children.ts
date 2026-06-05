/**
 * R18.9+R18.10+R18.11+R18.12 — Detail pane: scenario children + parent + source file link.
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
  sourceFile?: string;
  sourceLine?: number;
}

export async function fetchDetailData(uuid: string): Promise<DetailData> {
  try {
    const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}?mode=scenario`);
    if (!res.ok) return { children: [], parent: null };
    const data = await res.json();
    return { children: data.children || [], parent: data.parent || null, sourceFile: data.sourceFile, sourceLine: data.sourceLine };
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

export function renderSourceLink(sourceFile?: string, sourceLine?: number): string {
  if (!sourceFile) return '';
  const href = sourceLine ? `/edit/${sourceFile}#L${sourceLine}` : `/edit/${sourceFile}`;
  const label = sourceLine ? `${sourceFile}:${sourceLine}` : sourceFile;
  return `<div class="dv-source" style="margin-bottom:6px"><a href="${href}" style="color:#42a5f5;font-size:0.75rem;text-decoration:none;font-family:monospace">📂 ${esc(label)}</a></div>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
