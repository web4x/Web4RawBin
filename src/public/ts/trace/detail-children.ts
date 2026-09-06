/**
 * R18.9+R18.10+R18.11+R18.12 — Detail pane: scenario children + parent + source file link.
 */
import { upsertSection } from './detail-render.js';
import { navigate } from './nav.js';

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
// [impl:uuid:459d3aef-fa07-4968-a5d2-82185a1caf65] R25.6 RbDetailView.scenarioFileHref (scenarioLinkHref)
// [impl:uuid:1bd129e0-4d2b-4791-b11c-c5271dc3603c] R25.6 detail-children.scenarioFileHref (S21-25 audit — missing marker restored)
export function scenarioFileHref(uuid: string): string {
  if (!uuid) return '';
  const hex = uuid.replace(/-/g, '');
  if (hex.length < 5) return '';
  return `/md/scenario/index/${hex[0]}/${hex[1]}/${hex[2]}/${hex[3]}/${hex[4]}/${uuid}.scenario.json`;
}
// v0.7.0 (3): editor deep-link for a unit — /edit/scenario/index/<shard>/<uuid>.scenario.json (existing editor route)
export function scenarioEditorHref(uuid: string, storeDir = 'scenario/index'): string {
  if (!uuid) return '';
  const hex = uuid.replace(/-/g, '');
  if (hex.length < 5) return '';
  // R35.2 NAV-RESOLVE: this builds a store-relative Edit path for a PROD scenario/index unit (default storeDir). A MODEL
  // unit must NOT hardcode data/model-store/index (R40.81 Slice-3, architect 03eed6cc7: a client-named store is the same
  // split-brain hole as the 6 coupled sites) — use modelUnitEditorHref() below, whose store the SERVER resolves via ModelStoreLocator.
  return `/edit/${storeDir}/${hex[0]}/${hex[1]}/${hex[2]}/${hex[3]}/${hex[4]}/${uuid}.scenario.json`;
}

// [impl:uuid:PENDING-req-mint] modelUnitEditorHref (R40.81 Slice-3) — Edit href for a MODEL unit that names NO store: the
// server (/api/files model-unit/ branch) resolves the physical store via the ONE ModelStoreLocator so the edit READ+WRITE
// track the same store reads use (coupled; correct pre- AND post-flip). The client must NEVER name data/model-store/index.
export function modelUnitEditorHref(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  if (hex.length < 5) return '';
  return `/edit/model-unit/${uuid}.scenario.json`;
}
// R26.2 was: EVERY detail view renders a 📄 Scenario / ✏️ Edit link in its BODY (source of truth).
// ★ SUPERSEDED by R-A A1 (T37.21, Tron 2026-09-01): the shared drawer now composes the UNIVERSAL default
// [◆ Scenario, ✎ Edit] bar for EVERY detail (rb-detail-drawer.ts:479), so the body pair was REDUNDANT — Tron:
// "we already have std action bar buttons for scenario and edit so we see redundant links in the details."
// Body = DATA, bar = action surface. This extends T37.26 (same removal on the task view) to ALL views at the ONE
// shared source. Returns '' now (call sites harmless) and the function + R25.6 marker are KEPT so the chain stays
// intact — the affordance lives in the bar; req may re-point/retire the marker (flagged).
// [impl:uuid:2179d235-be01-4f0b-a1cb-bcfda316a5b4] R25.6 RbDetailView.scenarioBrowserLinkFromIor (renderScenarioLink) — now bar-superseded (T37.21)
export function scenarioBrowserLinkFromIor(_uuid: string): string {
  return ''; // superseded by the universal A1 ◆ Scenario / ✎ Edit bar; the detail body renders DATA only (T37.21)
}

export function renderSourceLink(sourceFile?: string, sourceLine?: number, markIfEmpty = false): string {
  // T36.3 (R40.71): a Method/Class with no derivable source used to render a BLANK — indistinguishable from a bug.
  // When markIfEmpty (method/class detail), show an explicit muted "source not available" so a user gets a DEFINITE
  // answer (the system knows there is nothing to show) instead of a broken-looking empty space.
  if (!sourceFile) return markIfEmpty
    ? '<div class="dv-source" style="margin-bottom:6px;color:rgba(255,255,255,0.35);font-size:0.75rem;font-style:italic">source not available</div>'
    : '';
  const parts = sourceFile.split('/');
  const fileName = parts.pop() || sourceFile;
  const dirPath = parts.join('/');
  const lineParam = sourceLine ? `&line=${sourceLine}` : '';
  const browseHref = `/md/${dirPath}/?highlight=${encodeURIComponent(fileName)}${lineParam}`;
  const label = sourceLine ? `${sourceFile}:${sourceLine}` : sourceFile;
  return `<div class="dv-source" style="margin-bottom:6px"><a href="${browseHref}" style="color:#42a5f5;font-size:0.75rem;text-decoration:none;font-family:monospace">📂 ${esc(label)}</a></div>`;
}

// R37.12 (B) idempotent inserts — the ONE way every detail view renders its Source + Parent sections. Each routes through
// upsertSection (assign-once per marker: '.dv-source' / '.dv-parent'), so a live re-render or a superseded async tail
// REPLACES the section instead of stacking (killed Tron's Parent×2 / source-link duplication). No exceptions — the lint
// makes a raw insertAdjacentHTML in a detail render RED.
export function upsertSourceLink(host: HTMLElement, sourceFile?: string, sourceLine?: number, markIfEmpty = false): void {
  upsertSection(host, 'dv-source', renderSourceLink(sourceFile, sourceLine, markIfEmpty), host.querySelector('.dv-head'), 'beforeend');
}
export function upsertParentLink(host: HTMLElement, parent: DetailParent | null, onClick?: (p: DetailParent) => void): void {
  const el = upsertSection(host, 'dv-parent', renderParentLink(parent), host.querySelector('.dv-head'), 'afterend');
  if (parent && el) el.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); if (onClick) onClick(parent); else navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid }); });
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
