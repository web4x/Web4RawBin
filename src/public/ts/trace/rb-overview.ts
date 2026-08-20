/**
 * T107 — rb-overview: planning rollup across Task objects, COMPUTED FROM THE LIVE GRAPH.
 *
 * Always-consistent invariant (R15.6): the overview is derived from the TraceGraph on EVERY
 * render — never a cached snapshot, never a hand-maintained table. Subscribes to the graph-level
 * ViewBus topic ('graph') so any task add/remove/status-change recomputes. Drift is structurally
 * impossible — there is no second copy to drift from.
 *
 * Groups Task objects by `sprint`, shows per-status counts, and a row per task (T105 item).
 *
 * [impl:uuid:8d98abfd-9970-4951-8344-b82828b7dac4] R15.6 Overview (always-consistent)
 */
import './rb-object-item.js';
import { TraceGraph } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';

const STATUSES = ['Planned', 'In Progress', 'QA Review', 'Done'];

export class RbOverview extends HTMLElement {
  graph: TraceGraph | null = null;
  private unsub: (() => void) | null = null;

  connectedCallback(): void {
    this.classList.add('overview');
    this.render();
    this.unsub = ViewBus.subscribe('graph', () => this.render()); // recompute on any graph change
  }
  disconnectedCallback(): void { this.unsub?.(); this.unsub = null; }

  /** Re-derive the rollup from the live graph (no cached snapshot). */
  render(): void {
    if (!this.graph) { this.innerHTML = '<div class="ov-empty">no graph</div>'; return; }
    const tasks = this.graph.ofType('task');
    const bySprint = new Map<string, typeof tasks>();
    for (const t of tasks) {
      const key = t.sprint || '(unsorted)';
      const arr = bySprint.get(key) ?? [];
      arr.push(t);
      bySprint.set(key, arr);
    }
    const groups: string[] = [];
    for (const [sprint, group] of [...bySprint.entries()].sort((a, b) => b[0].localeCompare(a[0], undefined, { numeric: true }))) { // R40.50: DESCENDING (Sprint 40 on top) — a<->b flipped
      const counts: Record<string, number> = {};
      for (const s of STATUSES) counts[s] = 0;
      for (const t of group) if (t.status && counts[t.status] !== undefined) counts[t.status]++;
      const chips = STATUSES.map(s => `<span class="ov-count" data-status="${s}">${s}: ${counts[s]}</span>`).join('');
      const rows = group.map(t => `<rb-object-item ref="${t.ref()}" type="task" title="${esc(t.title)}"${t.status ? ` status="${esc(t.status)}"` : ''}></rb-object-item>`).join('');
      groups.push(`<div class="ov-group" data-sprint="${esc(sprint)}"><h4 class="ov-sprint">${esc(sprint)}</h4><div class="ov-counts">${chips}</div><div class="ov-rows">${rows}</div></div>`);
    }
    this.innerHTML = groups.join('') || '<div class="ov-empty">no tasks</div>';
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-overview')) {
  customElements.define('rb-overview', RbOverview);
}
