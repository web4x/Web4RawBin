/**
 * T174 R-M3 — /scenario?ior=<uuid> single-instance focused tree view.
 * Seeds from ONE IOR with lazy-load children per LOCKED chain.
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
      // Fetch children for the seeded IOR
      const childRes = await fetch(`/api/trace/children/${encodeURIComponent(ior!)}`);
      if (!childRes.ok) throw new Error(`children ${childRes.status}`);
      const seedData = await childRes.json();

      // Build minimal graph from /api/trace (needed for TraceRouter + DetailViews)
      const traceRes = await fetch('/api/trace');
      const traceData = await traceRes.json();
      const graph = deserialize(traceData.objects || []);

      // Layout
      const treePanel = document.createElement('div');
      treePanel.className = 'trace-tree-panel';

      // Seed tree — shows only this instance + its children
      const tree = document.createElement('rb-trace-tree');
      tree.setAttribute('data-seed-ior', ior!);
      treePanel.appendChild(tree);

      const drawer = document.createElement('rb-detail-drawer');
      app!.innerHTML = '';
      app!.appendChild(treePanel);
      app!.appendChild(drawer);

      // Wire TraceRouter for click → DetailView (T110/T111 interactions)
      const detailMount = document.createElement('div');
      const router = new TraceRouter(graph as never, viewRegistry(drawer), detailMount);
      router.start();

      // R-M3d: auto-select the seeded node → opens its DetailView in drawer
      const type = (seedData.type || 'task').toLowerCase();
      setTimeout(() => {
        router.navigate(type, 'show', { uuid: ior! });
        // Scroll tree root into view
        const rootItem = tree.querySelector('rb-object-item');
        if (rootItem) rootItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (e) {
      app!.innerHTML = `<div style="color:#888;padding:20px">Failed to load scenario. <a href="/trace" style="color:#667eea">Open full trace</a></div>`;
    }
  }
  load();
}
