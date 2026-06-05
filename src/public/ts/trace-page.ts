/**
 * T108+T187 — Traceability browser page. Sprint→Task navigation roots (R18.8)
 * with mode=trace narrowing. Uses lazy-load seed tree (no full graph preload).
 *
 * [impl:uuid:108b7283-94a5-46b7-898e-b08080808108] R15.7+R18.8
 */
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

    // Fetch Sprint nav roots
    const sprintRes = await fetch('/api/trace/sprints');
    const sprints: { uuid: string; type: string; name: string; hasChildren: boolean }[] = await sprintRes.json();

    treeMount.innerHTML = '';

    // Build Sprint root nodes as seed trees with mode=trace
    for (const sprint of sprints) {
      const tree = document.createElement('rb-trace-tree') as HTMLElement & { setGraph(g: unknown, broken: string[]): void };
      tree.setAttribute('data-seed-ior', sprint.uuid);
      tree.setAttribute('data-mode', 'trace');
      treeMount.appendChild(tree);
      (tree as any).graph = graph;
    }

    // Detail drawer
    const drawer = document.createElement('rb-detail-drawer');
    const tracePage = document.querySelector('.trace-page');
    (tracePage || document.body).appendChild(drawer);

    const router = new TraceRouter(graph as never, viewRegistry(drawer), detailMount);
    router.start();
  } catch (e) {
    treeMount.innerHTML = `<div style="color:#888;padding:20px">Failed to load traceability graph</div>`;
    console.warn('trace load failed', e);
  }
}

load();
