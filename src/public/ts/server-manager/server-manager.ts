// R31 — Server Manager itemView tree + interactive terminal (client bundle).
// Tree: the SHARED rb-trace-tree renderer fed by /tree `roots` (otmuxSession→otmuxWindow→otmuxPane, TRACE_ICONS),
//   N-level layer-by-layer (R31.3).
// Terminal: selecting an otmuxPane routes through the STANDARD drawer selection flow (selectionModel.select →
//   selection-changed → drawer renderDetailForRef → rb-terminal-detail) — scroll/grab-bar/expand IDENTICAL to /trace
//   by construction (R31.4 DRAWER-DRY, retires the showElement fork). Owner-gate is server-side (R31.2 choke-point
//   + ws upgrade 403 non-owners before this shell / before the socket opens).
import '../trace/rb-trace-tree.js';
import '../trace/rb-detail-drawer.js';
import '../trace/rb-terminal-detail.js'; // defines <rb-terminal-detail> (drawer tagMap otmuxpane→it) + bundles xterm HERE (kept out of /trace)
import { selectionModel } from '../trace/selection-model.js';

type Root = { uuid: string; type: string; name: string; hasChildren?: boolean; children?: Root[] };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('sm-tree') as (HTMLElement & { items?: Root[] }) | null;

// R31.4 DRY: the shared default drawer renders the selected pane's terminal via the standard detail path. Created
// here (client-only, no page-shell edit) so it's in the DOM to listen for selection-changed + render rb-terminal-detail.
if (!document.getElementById('sm-drawer')) {
  const d = document.createElement('rb-detail-drawer'); d.id = 'sm-drawer'; document.body.appendChild(d);
}

async function load(): Promise<void> {
  if (!tree) return;
  tree.removeAttribute('data-always-expanded'); // R31.3: layer-by-layer collapsed-initial (the page-shell attr exploded all 3 levels at once) — client-only
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/server-manager/tree', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const roots: Root[] = d.roots || [];
    tree.items = roots;
    if (!roots.length && err) err.textContent = 'No tmux sessions.';
  } catch (e: any) {
    if (err) err.textContent = 'Failed to load tree: ' + (e && e.message ? e.message : e);
  }
}

// R31.4 DRY: pane-node click → STANDARD single-selection (clear+select) → selection-changed → drawer renders
// rb-terminal-detail. Session/window rows own the expand chevron; panes have no children, so a pane click = select
// = open its terminal. No preventDefault/capture fork — the exact path /trace uses.
tree?.addEventListener('click', (e: Event) => {
  const item = (e.target as HTMLElement).closest('rb-object-item');
  if (!item) return;
  const ref = item.getAttribute('ref') || '';
  if (ref.startsWith('otmuxpane:')) { selectionModel.clear(); selectionModel.select(ref); }
});

document.getElementById('refresh')?.addEventListener('click', () => void load());
void load();
