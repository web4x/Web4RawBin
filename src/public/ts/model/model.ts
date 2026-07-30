// R32.9 (D) Model-Driven Code Quality view (client bundle). Mounts the SHARED rb-trace-tree renderer and feeds it
// the server's /api/model/tree `roots` (R32.3 model-tree UX reused; R32.5 ISOLATED store). Membership-gated
// server-side (the /model route 403s non-members before this shell). Mirrors server-manager.ts / feature-manager.ts (DRY).
import '../trace/rb-trace-tree.js';
// R32.10 (PART A, INV-M1 ROOT FIX): mount the SHARED rb-detail-drawer (mirror scenario-view.ts:38-41 / trace-page) so
// selecting a model node OPENS the drawer (was: model.ts imported only rb-trace-tree → select opened nothing). The
// drawer self-wires via the global selection-changed event (selectionModel); rb-modelelement-detail (INV-M2) is the
// 'modelelement' tagMap detail, imported here so it's defined in the model bundle (kept out of /trace).
import '../trace/rb-detail-drawer.js';
import '../trace/rb-modelelement-detail.js';

type Root = { uuid: string; type: string; name: string; hasChildren?: boolean; childCount?: number; children?: Root[] };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('model-tree') as (HTMLElement & { items?: Root[] }) | null;

// Mount the drawer once, as a sibling of the tree panel (mirrors scenario-view's app.appendChild(drawer)).
if (!document.querySelector('rb-detail-drawer')) {
  const host = document.querySelector('.trace-page') || document.body;
  host.appendChild(document.createElement('rb-detail-drawer'));
}

async function load(): Promise<void> {
  if (!tree) return;
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/tree', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const roots: Root[] = d.roots || [];
    tree.items = roots;
    if (!roots.length && err) err.textContent = 'No model elements yet — drop a .ts file to generate.';
  } catch (e: unknown) {
    if (err) err.textContent = 'Failed to load model tree: ' + (e instanceof Error ? e.message : String(e));
  }
}

document.getElementById('refresh')?.addEventListener('click', () => void load());
void load();
