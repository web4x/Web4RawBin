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

// [impl:uuid:ed71d42a-8b9c-4831-963a-973ff28d0819] R19.70 scenarioBrowserLinkFromIor
/** R20.30 — shared /md scenario-browser URL for a unit uuid (DRY: forward-link rows + Scenario field). */
export function scenarioBrowserHref(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  const shard = `${hex[0]}/${hex[1]}/${hex[2]}/${hex[3]}/${hex[4]}`;
  return `/md/scenario/index/${shard}/?highlight=${encodeURIComponent(uuid + '.scenario.json')}`;
}
// R26.2: direct link to the scenario unit ON DISK (source of truth): /md/scenario/index/<shard>/<uuid>.scenario.json
export function scenarioFileHref(uuid: string): string {
  if (!uuid) return '';
  const hex = uuid.replace(/-/g, '');
  if (hex.length < 5) return '';
  return `/md/scenario/index/${hex[0]}/${hex[1]}/${hex[2]}/${hex[3]}/${hex[4]}/${uuid}.scenario.json`;
}
// R26.2: EVERY detail view renders this 📄 Scenario link — no view may lack it (source of truth).
// [impl:uuid:2179d235-be01-4f0b-a1cb-bcfda316a5b4] R25.6 RbDetailView.scenarioBrowserLinkFromIor (renderScenarioLink)
export function scenarioBrowserLinkFromIor(uuid: string): string {
  if (!uuid) return '';
  return `<div class="dv-field"><a href="${scenarioFileHref(uuid)}" style="color:#ff9800;font-size:0.75rem;text-decoration:none" title="Scenario unit on disk (source of truth)">📄 Scenario</a></div>`;
}

export function renderSourceLink(sourceFile?: string, sourceLine?: number): string {
  if (!sourceFile) return '';
  const parts = sourceFile.split('/');
  const fileName = parts.pop() || sourceFile;
  const dirPath = parts.join('/');
  const lineParam = sourceLine ? `&line=${sourceLine}` : '';
  const browseHref = `/md/${dirPath}/?highlight=${encodeURIComponent(fileName)}${lineParam}`;
  const label = sourceLine ? `${sourceFile}:${sourceLine}` : sourceFile;
  return `<div class="dv-source" style="margin-bottom:6px"><a href="${browseHref}" style="color:#42a5f5;font-size:0.75rem;text-decoration:none;font-family:monospace">📂 ${esc(label)}</a></div>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
