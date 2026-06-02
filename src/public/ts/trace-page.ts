/**
 * T108 (relocated) — standalone Traceability browser page (docs top-nav choice, peer to
 * browser/App). Mounts rb-trace-tree + a detail pane off GET /api/trace. Reuses the whole
 * T103-T108 trace layer; no rebuild of components.
 *
 * [impl:uuid:108b7283-94a5-46b7-898e-b08080808108] R15.7 traceability browser (docs nav)
 */
import { TraceRouter, viewRegistry, deserialize } from './trace/index.js';
import './trace/rb-trace-tree.js';
import './trace/rb-detail-drawer.js';

const treeMount = document.getElementById('trace-tree');
const detailMount = document.getElementById('trace-detail');

async function load(): Promise<void> {
  if (!treeMount || !detailMount) return;
  try {
    const res = await fetch('/api/trace');
    if (!res.ok) throw new Error(`/api/trace ${res.status}`);
    const data = await res.json();
    const graph = deserialize(data.objects || []);
    const tree = document.createElement('rb-trace-tree') as HTMLElement & { setGraph(g: unknown, broken: string[]): void };
    treeMount.innerHTML = '';
    treeMount.appendChild(tree);
    tree.setGraph(graph, data.broken || []);
    // T110+T167: detail drawer — inside .trace-page for desktop split layout
    const drawer = document.createElement('rb-detail-drawer');
    const tracePage = document.querySelector('.trace-page');
    (tracePage || document.body).appendChild(drawer);

    // node click → navigate → DetailView renders inside the drawer
    const router = new TraceRouter(graph as never, viewRegistry(drawer), detailMount);
    router.start();
  } catch (e) {
    treeMount.innerHTML = `<div style="color:#888;padding:20px">Failed to load traceability graph</div>`;
    console.warn('trace load failed', e);
  }
}

load();
