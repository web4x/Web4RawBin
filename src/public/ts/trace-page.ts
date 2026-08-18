/**
 * T108+T187 — Traceability browser page. Sprint→Task navigation roots (R18.8)
 * with mode=trace narrowing. Uses lazy-load seed tree (no full graph preload).
 *
 * [impl:uuid:f2dbefd1-c76d-48cc-b397-b6d66ddbba4d] R15.7+R18.8
 */
import { bootstrapPage } from './page-bootstrap.js';
bootstrapPage(); // R40.45: shared bootstrap opens the transport→bus bridge by DEFAULT — /trace was socket-less (never received a unit-changed) → now live
import { TraceRouter, viewRegistry, deserialize } from './trace/index.js';
import './trace/rb-trace-tree.js';
import './trace/rb-detail-drawer.js';

const treeMount = document.getElementById('trace-tree');
const detailMount = document.getElementById('trace-detail');

async function load(): Promise<void> {
  if (!treeMount || !detailMount) return;
  try {
    // Fetch graph for DetailViews + router
    const traceRes = await fetch('/api/trace');
    const traceData = await traceRes.json();
    const graph = deserialize(traceData.objects || []);

    treeMount.innerHTML = '';

    // T30.1: ONE eager-lazy tree = exactly TWO top-level nodes — "CurrentSprint: Sprint N" (3 eager slots) +
    // "Sprints 01-N" COLLAPSED collection (eager sprint-nodes, each sprint's tasks LAZY on expand via the shared
    // R26.1 loader). [impl marker on RbTraceTree.renderCurrentSprintEagerLazy.]
    const tree = document.createElement('rb-trace-tree') as any;
    tree.setAttribute('data-mode', 'trace');
    tree.setAttribute('data-eager-lazy', '');
    tree.graph = graph;
    treeMount.appendChild(tree);
    // R40.17: the eager-lazy tree now self-subscribes to the CurrentSprint singleton ref on the graph-bus (rb-trace-tree
    // connectedCallback) — the old bespoke 'current-sprint-changed' DOM event was DEAD (nothing dispatched it), which was
    // the live-pin gap. No bespoke channel; the same ViewBus that designate now notifies drives the re-fetch.

    // Detail drawer
    const drawer = document.createElement('rb-detail-drawer');
    const tracePage = document.querySelector('.trace-page');
    (tracePage || document.body).appendChild(drawer);
    (drawer as any).graph = graph;

    const router = new TraceRouter(graph as never, viewRegistry(drawer), detailMount);
    router.start();
  } catch (e) {
    treeMount.innerHTML = `<div style="color:#888;padding:20px">Failed to load traceability graph</div>`;
    console.warn('trace load failed', e);
  }
}

load();
