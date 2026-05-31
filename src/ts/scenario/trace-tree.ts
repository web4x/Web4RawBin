/**
 * T143 — Trace tree: multi-parent/multi-child tree from TraceLink graph.
 * buildTraceTree, walkUp, walkDown, renderTraceTreeHtml/Md.
 *
 * [impl:uuid:c3143b01-d402-4e03-bf04-a05f06b07c12] R17.26-R17.29
 */
import { type ScenarioUnit } from './types.js';

export interface TraceNode {
  uuid: string;
  type: string;
  name: string;
  slug: string;
  relation: string;
  children: TraceNode[];
}

export function buildTraceTree(rootUuid: string, allLinks: ScenarioUnit[], allUnits: Map<string, ScenarioUnit>): TraceNode {
  const unit = allUnits.get(rootUuid);
  const root: TraceNode = {
    uuid: rootUuid,
    type: unit?.ior.replace('ior:class:', '').toLowerCase() || 'unknown',
    name: (unit?.model.name as string) || rootUuid.slice(0, 8),
    slug: (unit?.model.slug as string) || speakSlug((unit?.model.name as string) || rootUuid),
    relation: '',
    children: walkDown(rootUuid, allLinks, allUnits),
  };
  return root;
}

export function walkDown(uuid: string, allLinks: ScenarioUnit[], allUnits: Map<string, ScenarioUnit>, visited = new Set<string>()): TraceNode[] {
  if (visited.has(uuid)) return [];
  visited.add(uuid);
  const children: TraceNode[] = [];
  for (const link of allLinks) {
    const m = link.model as Record<string, unknown>;
    const fromUuid = String(m.from || '').replace('ior:instance:', '');
    if (fromUuid !== uuid) continue;
    const toUuid = String(m.to || '').replace('ior:instance:', '');
    if (!toUuid || visited.has(toUuid)) continue;
    const target = allUnits.get(toUuid);
    children.push({
      uuid: toUuid,
      type: target?.ior.replace('ior:class:', '').toLowerCase() || 'unknown',
      name: (target?.model.name as string) || toUuid.slice(0, 8),
      slug: (target?.model.slug as string) || speakSlug((target?.model.name as string) || toUuid),
      relation: String(m.relation || ''),
      children: walkDown(toUuid, allLinks, allUnits, visited),
    });
  }
  return children;
}

export function walkUp(uuid: string, allLinks: ScenarioUnit[], allUnits: Map<string, ScenarioUnit>, visited = new Set<string>()): TraceNode[] {
  if (visited.has(uuid)) return [];
  visited.add(uuid);
  const parents: TraceNode[] = [];
  for (const link of allLinks) {
    const m = link.model as Record<string, unknown>;
    const toUuid = String(m.to || '').replace('ior:instance:', '');
    if (toUuid !== uuid) continue;
    const fromUuid = String(m.from || '').replace('ior:instance:', '');
    if (!fromUuid || visited.has(fromUuid)) continue;
    const source = allUnits.get(fromUuid);
    parents.push({
      uuid: fromUuid,
      type: source?.ior.replace('ior:class:', '').toLowerCase() || 'unknown',
      name: (source?.model.name as string) || fromUuid.slice(0, 8),
      slug: (source?.model.slug as string) || speakSlug((source?.model.name as string) || fromUuid),
      relation: String(m.relation || ''),
      children: walkUp(fromUuid, allLinks, allUnits, visited),
    });
  }
  return parents;
}

function speakSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function renderNodeHtml(n: TraceNode): string {
  const href = `/md/scenario/sprints.md/${n.type}/${n.slug}.md`;
  const link = `<a href="${href}" class="chain-link">🔗 ${esc(n.name)}</a>`;
  const rel = n.relation ? `<span class="sv-relation">${esc(n.relation)}</span> ` : '';
  if (!n.children.length) return `<li>${rel}${link}</li>`;
  return `<li>${rel}${link}<ul>${n.children.map(renderNodeHtml).join('')}</ul></li>`;
}

function renderNodeMd(n: TraceNode, depth = 0): string {
  const indent = '  '.repeat(depth);
  const rel = n.relation ? `${n.relation}: ` : '';
  const line = `${indent}- ${rel}[🔗 ${n.name}](../sprints.md/${n.type}/${n.slug}.md)`;
  const childLines = n.children.map(c => renderNodeMd(c, depth + 1));
  return [line, ...childLines].join('\n');
}

export function renderTraceTreeHtml(nodes: TraceNode[]): string {
  if (!nodes.length) return '';
  return `<div class="sv-section sv-trace-tree"><h3>Traceability</h3><ul class="sv-tree">${nodes.map(renderNodeHtml).join('')}</ul></div>`;
}

export function renderTraceTreeMd(nodes: TraceNode[]): string {
  if (!nodes.length) return '';
  return `## Traceability\n\n${nodes.map(n => renderNodeMd(n)).join('\n')}`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
