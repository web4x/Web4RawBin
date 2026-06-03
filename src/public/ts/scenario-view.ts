/**
 * T174 R-M3 — /scenario?ior=<uuid> single-instance focused tree view.
 * Seeds from ONE IOR. Children start collapsed, expand on click (lazy).
 * Wires full /trace interactions: collapse/expand (T115) + DetailView (T110/T111).
 *
 * [impl:uuid:7a5f0eb9-7a33-492b-991a-b13c431dc695] R-M3
 */
import { TraceRouter, viewRegistry, deserialize } from './trace/index.js';
import './trace/rb-trace-tree.js';
import './trace/rb-detail-drawer.js';

const params = new URLSearchParams(window.location.search);
const ior = params.get('ior');
const app = document.getElementById('scenario-app');

if (!ior || !app) {
  if (app) app.innerHTML = '<div style="color:#888;padding:20px">Missing ?ior= parameter. <a href="/trace" style="color:#667eea">Open full trace</a></div>';
} else {
  async function load(): Promise<void> {
    try {
      // Build graph from /api/trace (needed for TraceRouter + DetailViews)
      const traceRes = await fetch('/api/trace');
      const traceData = await traceRes.json();
      const graph = deserialize(traceData.objects || []);

      // Layout
      const treePanel = document.createElement('div');
      treePanel.className = 'trace-tree-panel';

      // Seed tree — shows this instance + children (collapsed start)
      const tree = document.createElement('rb-trace-tree');
      tree.setAttribute('data-seed-ior', ior!);
      treePanel.appendChild(tree);

      const drawer = document.createElement('rb-detail-drawer');
      app!.innerHTML = '';
      app!.appendChild(treePanel);
      app!.appendChild(drawer);

      // Wire TraceRouter for click → DetailView
      const detailMount = document.createElement('div');
      const router = new TraceRouter(graph as never, viewRegistry(drawer), detailMount);
      router.start();

      // R-M3d: wait for tree to render seed, then auto-open DetailView
      const waitForTree = (): Promise<void> => new Promise(resolve => {
        const check = () => {
          if (tree.querySelector('rb-object-item')) { resolve(); return; }
          requestAnimationFrame(check);
        };
        check();
      });
      await waitForTree();

      // Determine type from the graph object (reliable, not from /api/trace/children)
      const obj = graph.get(ior!);
      const type = obj ? obj.type : 'task';
      router.navigate(type, 'show', { uuid: ior! });

      const rootItem = tree.querySelector('rb-object-item');
      if (rootItem) rootItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      app!.innerHTML = `<div style="color:#888;padding:20px">Failed to load scenario. <a href="/trace" style="color:#667eea">Open full trace</a></div>`;
    }
  }
  load();
}
