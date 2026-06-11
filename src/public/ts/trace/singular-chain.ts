/**
 * R19.34 — Singular chain walker for detail views.
 * Walks the champagne path: Req→UC[0]→Class→Method→Impl[0]→Test[0]
 * Returns ordered array of {uuid, type, name, ref} steps.
 *
 * [impl:uuid:19f0d4e0-d1e2-4f3a-8b4c-5d6e7f8a9b0c] RbDetailDrawer.narrowChain
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

export function renderSingularChain(steps: ChainStep[]): string {
  if (steps.length === 0) return '<div class="dv-empty">No chain</div>';
  return steps.map((s, i) => {
    const arrow = i < steps.length - 1 ? '<div class="sc-arrow">↓</div>' : '';
    return `<div class="sc-step dv-link" data-ref="${s.type.toLowerCase()}:${s.uuid}"><span class="dv-rel">${s.type}</span><span class="dv-link-title">${esc(s.name)}</span></div>${arrow}`;
  }).join('');
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
