/**
 * T103 — trace seam wiring: default verb handlers + flat-JSON serialize/deserialize wrappers.
 * T105-T108 consume this (TraceRouter + VerbRegistry + ViewBus + rb-trace-view).
 *
 * [impl:uuid:103c2d3e-4f50-4162-8839-c03030303103] AC1-AC5 seam
 */
import {
  TraceGraph, type FlatObject, type ObjectType, refUuid,
} from '../../../ts/shared/TraceModel.js';
import { VerbRegistry, type VerbContext, type VerbHandler } from './VerbRegistry.js';
import { ViewBus } from './ViewBus.js';
import './rb-trace-view.js';

export { TraceRouter, parseHash, buildHash } from './TraceRouter.js';
export { VerbRegistry } from './VerbRegistry.js';
export { ViewBus } from './ViewBus.js';
export { RbTraceView } from './rb-trace-view.js';
export { RbObjectItem } from './rb-object-item.js';
export { RbListOverview, LocalSearch, type SearchProvider } from './rb-list-overview.js';
export { RbDetailView } from './rb-detail-view.js';
export { RbOverview } from './rb-overview.js';
export { RbTraceTree } from './rb-trace-tree.js';
export { RbDetailDrawer } from './rb-detail-drawer.js';
export { RbTaskDetail } from './rb-task-detail.js';
export { RbRequirementDetail } from './rb-requirement-detail.js';
export { RbUseCaseDetail } from './rb-usecase-detail.js';
export { RbClassDetail } from './rb-class-detail.js';
export { RbMethodDetail } from './rb-method-detail.js';
export { RbTestDetail } from './rb-test-detail.js';
export { RbImplementationDetail } from './rb-implementation-detail.js';
export { TRACE_ICONS } from './icons.js';
export { navigate, setActiveRouter } from './nav.js';
import './rb-object-item.js';
import './rb-list-overview.js';
import './rb-detail-view.js';
import './rb-overview.js';
import './rb-trace-tree.js';
import './rb-detail-drawer.js';
import './rb-task-detail.js';
import './rb-requirement-detail.js';
import './rb-usecase-detail.js';
import './rb-class-detail.js';
import './rb-method-detail.js';
import './rb-test-detail.js';
import './rb-implementation-detail.js';

export const TRACE_TYPES: ObjectType[] = [
  'requirement', 'task', 'usecase', 'class', 'method', 'implementation', 'test',
];

/** AC4: flat-JSON state with route-like refs (reuses T101 graph.toJSON — no protocol). */
export function serialize(graph: TraceGraph): FlatObject[] {
  return graph.toJSON();
}

/** AC5: rebuild the typed graph + relink from flat JSON (reuses T101 fromJSON). */
export function deserialize(records: FlatObject[]): TraceGraph {
  return TraceGraph.fromJSON(records);
}

/** show: render the object's View (attrs from the object; the component self-subscribes to ViewBus). */
function showHandler(ctx: VerbContext): void {
  const { obj, mount } = ctx;
  if (!obj) { mount.innerHTML = '<div class="trace-notfound">object not found</div>'; return; }
  const el = document.createElement('rb-trace-view');
  el.setAttribute('uuid', obj.uuid);
  el.setAttribute('type', obj.type);
  el.setAttribute('title', obj.title);
  el.setAttribute('ref', obj.ref());
  mount.innerHTML = '';
  mount.appendChild(el);
}

/** list: render one View per object of the type. */
function listHandler(type: ObjectType): (ctx: VerbContext) => void {
  return ({ graph, mount }) => {
    mount.innerHTML = '';
    for (const obj of graph.ofType(type)) {
      const el = document.createElement('rb-trace-view');
      el.setAttribute('uuid', obj.uuid);
      el.setAttribute('type', obj.type);
      el.setAttribute('title', obj.title);
      el.setAttribute('ref', obj.ref());
      mount.appendChild(el);
    }
  };
}

/**
 * link: generic mutation verb — `#<type>.link?uuid=…&to=<type:uuid>&relation=…&inverse=…`.
 * Mutates the graph then ViewBus.notify(obj.ref()) → subscribed Views re-render (AC3, no reload).
 */
function linkHandler(ctx: VerbContext): void {
  const { graph, obj, params } = ctx;
  if (!obj || !params.to || !params.relation || !params.inverse) return;
  const target = graph.get(refUuid(params.to));
  if (!target) return;
  graph.link(obj, params.relation, target, params.inverse);
  ViewBus.notify(obj.ref());
  ViewBus.notify(target.ref());
}

/** A registry with show/list/link wired for all 7 object types (T103 minimal seam proof). */
export function defaultRegistry(): VerbRegistry {
  const reg = new VerbRegistry();
  for (const type of TRACE_TYPES) {
    reg.register(type, 'show', showHandler);
    reg.register(type, 'list', listHandler(type));
    reg.register(type, 'link', linkHandler);
  }
  return reg;
}

/** T111: type → specialized Web Component tag. Unlisted types fall back to rb-detail-view. */
const DETAIL_TAG: Partial<Record<ObjectType, string>> = {
  task: 'rb-task-detail',
  requirement: 'rb-requirement-detail',
  usecase: 'rb-usecase-detail',
  class: 'rb-class-detail',
  method: 'rb-method-detail',
  test: 'rb-test-detail',
  implementation: 'rb-implementation-detail',
};

/** T107 production wiring: show → rb-detail-view, task.list/planning.overview → rb-overview,
 *  <type>.list → rb-list-overview. This is the registry the browser (T108) uses.
 *  T110: optional drawer — when provided, show verb renders inside the drawer instead of mount.
 *  T111: specialized DetailViews per type (task/requirement/usecase), generic fallback for rest. */
export function viewRegistry(drawer?: HTMLElement): VerbRegistry {
  const reg = new VerbRegistry();
  const allTypes = [...TRACE_TYPES, 'sprint' as ObjectType];
  for (const type of allTypes) {
    const tag = DETAIL_TAG[type] || 'rb-detail-view';
    reg.register(type, 'show', drawer ? drawerShowHandler(drawer, tag) : mountShowHandler(tag));
    reg.register(type, 'list', listOverviewHandler(type));
    reg.register(type, 'link', linkHandler);
  }
  reg.register('task', 'list', overviewHandler);
  reg.register('planning', 'overview', overviewHandler);
  return reg;
}

/** Non-drawer fallback: render a DetailView into the mount element. */
function mountShowHandler(tagName: string): VerbHandler {
  return (ctx: VerbContext) => {
    const { obj, graph, mount } = ctx;
    if (!obj) { mount.innerHTML = '<div class="trace-notfound">object not found</div>'; return; }
    const el = document.createElement(tagName) as HTMLElement & { graph: TraceGraph };
    el.graph = graph;
    el.setAttribute('ref', obj.ref());
    mount.innerHTML = '';
    mount.appendChild(el);
  };
}

/** T110+T111: render a typed DetailView inside the drawer; set drawer ref to open it. */
function drawerShowHandler(drawer: HTMLElement, tagName: string): VerbHandler {
  return (ctx: VerbContext) => {
    const { obj, graph, params } = ctx;
    const uuid = params.uuid || '';
    const ref = obj ? obj.ref() : `${params.uuid ? 'unknown:' + params.uuid : ''}`;
    if (!obj && !uuid) { drawer.removeAttribute('ref'); return; }
    for (const child of [...drawer.children]) {
      if (!child.classList.contains('drawer-handle')) child.remove();
    }
    const el = document.createElement(tagName) as HTMLElement & { graph: TraceGraph };
    el.graph = graph;
    el.setAttribute('ref', obj ? obj.ref() : `unknown:${uuid}`);
    if (uuid) el.setAttribute('uuid', uuid);
    drawer.appendChild(el);
    drawer.setAttribute('ref', obj ? obj.ref() : `unknown:${uuid}`);
  };
}

function overviewHandler(ctx: VerbContext): void {
  const el = document.createElement('rb-overview') as HTMLElement & { graph: TraceGraph };
  el.graph = ctx.graph;
  ctx.mount.innerHTML = '';
  ctx.mount.appendChild(el);
}

function listOverviewHandler(type: ObjectType): (ctx: VerbContext) => void {
  return ({ graph, mount }) => {
    const el = document.createElement('rb-list-overview') as HTMLElement & { graph: TraceGraph; setItems(refs: string[]): void };
    el.graph = graph;
    mount.innerHTML = '';
    mount.appendChild(el);
    el.setItems(graph.ofType(type).map(o => o.ref()));
  };
}
