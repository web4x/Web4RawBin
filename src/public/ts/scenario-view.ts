/**
 * T174 R-M3 — /scenario?ior=<uuid> single-instance focused tree view.
 * Seeds from ONE IOR with lazy-load children per LOCKED chain.
 * NEVER fetches /api/trace (full graph). Uses /api/trace/children/<uuid> only.
 *
 * [impl:uuid:7a5f0eb9-7a33-492b-991a-b13c431dc695] R-M3
 */
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
      const res = await fetch(`/api/trace/children/${encodeURIComponent(ior!)}`);
      if (!res.ok) throw new Error(`/api/trace/children ${res.status}`);
      const data = await res.json();

      const treePanel = document.createElement('div');
      treePanel.className = 'trace-tree-panel';
      treePanel.innerHTML = `<div style="padding:8px"><span style="color:rgba(255,255,255,0.5);font-size:0.8rem">${data.type || ''}</span> <span style="color:white;font-weight:600">${data.name || ior}</span></div>`;

      const tree = document.createElement('rb-trace-tree');
      tree.setAttribute('data-seed-ior', ior!);
      treePanel.appendChild(tree);

      const drawer = document.createElement('rb-detail-drawer');
      app!.innerHTML = '';
      app!.appendChild(treePanel);
      app!.appendChild(drawer);
    } catch (e) {
      app!.innerHTML = `<div style="color:#888;padding:20px">Failed to load scenario. <a href="/trace" style="color:#667eea">Open full trace</a></div>`;
    }
  }
  load();
}
