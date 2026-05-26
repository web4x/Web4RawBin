/**
 * T103 — trace seam wiring: default verb handlers + flat-JSON serialize/deserialize wrappers.
 * T105-T108 consume this (TraceRouter + VerbRegistry + ViewBus + rb-trace-view).
 *
 * [impl:uuid:103c2d3e-4f50-4162-8839-c03030303103] AC1-AC5 seam
 */
import {
  TraceGraph, type FlatObject, type ObjectType, refUuid,
} from '../../../ts/shared/TraceModel.js';
import { VerbRegistry, type VerbContext } from './VerbRegistry.js';
import { ViewBus } from './ViewBus.js';
import './rb-trace-view.js';

export { TraceRouter, parseHash, buildHash } from './TraceRouter.js';
export { VerbRegistry } from './VerbRegistry.js';
export { ViewBus } from './ViewBus.js';
export { RbTraceView } from './rb-trace-view.js';

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

/** A registry with show/list/link wired for all 7 object types. */
export function defaultRegistry(): VerbRegistry {
  const reg = new VerbRegistry();
  for (const type of TRACE_TYPES) {
    reg.register(type, 'show', showHandler);
    reg.register(type, 'list', listHandler(type));
    reg.register(type, 'link', linkHandler);
  }
  return reg;
}
