/**
 * T108+T187 — Traceability browser page. Sprint→Task navigation roots (R18.8)
 * with mode=trace narrowing. Uses lazy-load seed tree (no full graph preload).
 *
 * [impl:uuid:f2dbefd1-c76d-48cc-b397-b6d66ddbba4d] R15.7+R18.8
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

    // [impl:uuid:062b6920-e2a6-4774-b369-afac243dc46d] R20.12+R20.22 renderThreeSlots
    const CURRENT_SPRINT_UUID = 'current-sprint-singleton-0000-000000000001';
    const renderSlots = async () => {
      const existing = treeMount.querySelector('.three-slots');
      if (existing) existing.remove();
      try {
        const ctRes = await fetch(`/api/ior/ior:instance:${CURRENT_SPRINT_UUID}`, { cache: 'no-store' });
        const ctData = await ctRes.json();
        if (!ctData.unit?.model) return;
        const ct = ctData.unit.model;
        const slots = ct.slots || {};
        const container = document.createElement('div');
        container.className = 'three-slots';

        const labels = [
          { slot: slots.current, label: '📌 Current', css: 'slot-current' },
          { slot: slots.lastCompleted, label: '✅ Last Completed', css: 'slot-completed' },
          { slot: slots.nextBacklog, label: '📋 Next Backlog', css: 'slot-backlog' },
        ];

        for (const { slot, label, css } of labels) {
          const section = document.createElement('div');
          section.className = `slot-section ${css}`;
          const hdr = document.createElement('div');
          hdr.className = 'slot-header';
          if (slot) {
            hdr.innerHTML = `<span class="slot-label">${label}</span><span class="slot-name">${(slot.taskName || '').replace(/[<>]/g, '')}</span>`;
            const tree = document.createElement('rb-trace-tree') as any;
            tree.setAttribute('data-seed-ior', slot.reqUuid || '');
            tree.setAttribute('data-mode', 'trace');
            tree.setAttribute('data-always-expanded', '');
            section.appendChild(hdr);
            section.appendChild(tree);
            tree.graph = graph;
          } else {
            hdr.innerHTML = `<span class="slot-label">${label}</span><span class="slot-empty">— none —</span>`;
            section.appendChild(hdr);
          }
          container.appendChild(section);
        }

        treeMount.insertBefore(container, treeMount.firstChild);
      } catch {}
    };
    await renderSlots();
    document.addEventListener('current-sprint-changed', () => renderSlots());

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
    (drawer as any).graph = graph;

    const router = new TraceRouter(graph as never, viewRegistry(drawer), detailMount);
    router.start();
  } catch (e) {
    treeMount.innerHTML = `<div style="color:#888;padding:20px">Failed to load traceability graph</div>`;
    console.warn('trace load failed', e);
  }
}

load();
