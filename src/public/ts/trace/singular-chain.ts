/**
 * R19.34 — Singular chain walker for detail views.
 * Walks the traceability chain: Req→UC[0]→Class→Method→Impl[0]→Test[0]
 * Returns ordered array of {uuid, type, name, ref} steps.
 *
 * [impl:uuid:21f689fb-44bc-4285-a73a-551aabfcf009] RbDetailDrawer.narrowChain
 */
import { TraceGraph, refUuid, type TraceObject } from '../../../ts/shared/TraceModel.js';

export interface ChainStep {
  uuid: string;
  type: string;
  name: string;
  ref: string;
}

const SINGULAR_FORWARD: Record<string, string> = {
  requirement: 'useCases',
  usecase: 'classes',
  class: 'methods',
  method: 'implementations',
  implementation: 'tests',
};

// [impl:uuid:b4f6b903-bbb5-4450-9aad-ddce522bd725] RbDetailDrawer.singularChain
export function singularChain(graph: TraceGraph, startUuid: string): ChainStep[] {
  const steps: ChainStep[] = [];
  const visited = new Set<string>();
  let current: TraceObject | undefined = graph.get(startUuid);

  while (current && !visited.has(current.uuid)) {
    visited.add(current.uuid);
    steps.push({ uuid: current.uuid, type: current.type, name: current.title, ref: current.ref() });

    const fwdKey = SINGULAR_FORWARD[current.type];
    if (!fwdKey) break;

    const links = current.toJSON().links;
    const refs = links[fwdKey];
    if (!refs || refs.length === 0) break;

    const nextUuid = refUuid(refs[0]);
    current = graph.get(nextUuid);
  }

  return steps;
}

const CHAIN_TYPES = new Set(['requirement', 'usecase', 'class', 'method', 'implementation', 'test', 'bug', 'changerequest']);

// [impl:uuid:15682c8a-45ad-455e-b3e2-2dccb61d1d25] BUG1 chainExcludesSelf
export function renderSingularChain(steps: ChainStep[], selfUuid?: string): string {
  const filtered = steps.filter(s => s.uuid !== selfUuid && CHAIN_TYPES.has(s.type.toLowerCase()));
  if (filtered.length === 0) return '<div class="dv-empty">No chain</div>';
  return filtered.map((s, i) => {
    const arrow = i < filtered.length - 1 ? '<div class="sc-arrow">↓</div>' : '';
    return `<div class="sc-step dv-link" data-ref="${s.type.toLowerCase()}:${s.uuid}"><span class="dv-rel">${s.type}</span><span class="dv-link-title">${esc(s.name)}</span></div>${arrow}`;
  }).join('');
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
