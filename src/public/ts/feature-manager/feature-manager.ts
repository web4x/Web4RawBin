// R31.8c — Feature Manager page (client bundle). NATIVE ITEMVIEW TREE: mount the SHARED rb-trace-tree fed by REAL
// Feature roots (GET /api/feature-manager → FeatureManager.featureRoots). Expanding a Feature lazy-loads its
// allowedUsers as granted-user child-nodes (/api/trace/children Feature-branch → allowedUsersChildren, composite refs).
// Selecting a Feature → rb-feature-detail (grant); selecting a granted user → rb-profile-detail (revoke) — both in the
// SHARED RbDetailDrawer via the standard selection path (tagMaps feature/profile). The detail elements are imported
// HERE (defined + kept out of /trace). Replaces the synthetic 'feature:manager' seed (which targeted no real feature).
import '../trace/rb-trace-tree.js';
import '../trace/rb-detail-drawer.js';
import '../trace/rb-feature-detail.js';
import '../trace/rb-profile-detail.js';
import { selectionModel } from '../trace/selection-model.js';

type Root = { uuid: string; type: string; name: string; icon?: string; hasChildren?: boolean };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('fm-tree') as (HTMLElement & { items?: Root[] }) | null;

if (!document.getElementById('fm-drawer')) {
  const d = document.createElement('rb-detail-drawer'); d.id = 'fm-drawer'; document.body.appendChild(d);
}

async function load(): Promise<void> {
  if (!tree) return;
  tree.removeAttribute('data-always-expanded'); // layer-by-layer: features collapsed, allowedUsers lazy on expand
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/feature-manager', { credentials: 'same-origin' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const roots: Root[] = (await r.json()).roots || [];
    tree.items = roots;
    if (!roots.length && err) err.textContent = 'No features.';
  } catch (e: any) {
    if (err) err.textContent = 'Failed to load features: ' + (e && e.message ? e.message : e);
  }
}

// Standard selection flow: a Feature node → rb-feature-detail (grant); a granted-user child → rb-profile-detail (revoke).
tree?.addEventListener('click', (e: Event) => {
  const item = (e.target as HTMLElement).closest('rb-object-item');
  if (!item) return;
  const ref = item.getAttribute('ref') || '';
  if (ref.startsWith('feature:') || ref.startsWith('profile:')) { selectionModel.clear(); selectionModel.select(ref); }
});

document.getElementById('refresh')?.addEventListener('click', () => void load());
void load();
