// R32.9 (D) Model-Driven Code Quality view (client bundle). Mounts the SHARED rb-trace-tree renderer and feeds it
// the server's /api/model/tree `roots` (R32.3 model-tree UX reused; R32.5 ISOLATED store). Membership-gated
// server-side (the /model route 403s non-members before this shell). Mirrors server-manager.ts / feature-manager.ts (DRY).
import '../trace/rb-trace-tree.js';

type Root = { uuid: string; type: string; name: string; hasChildren?: boolean; childCount?: number; children?: Root[] };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('model-tree') as (HTMLElement & { items?: Root[] }) | null;

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
