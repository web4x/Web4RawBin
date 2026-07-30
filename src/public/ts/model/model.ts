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
import '../trace/rb-strip.js'; // R33.3 AC4: REUSE the S31 rb-strip primitive for the action bar (no fork)

type Root = { uuid: string; type: string; name: string; hasChildren?: boolean; childCount?: number; children?: Root[] };

const err = document.getElementById('err') as HTMLElement | null;
const tree = document.getElementById('model-tree') as (HTMLElement & { items?: Root[] }) | null;
tree?.removeAttribute('data-always-expanded'); // R33.2/S33-P2b (INV-P2b-1): mirror server-manager.ts:28 — the /model shell attr eager-exploded ALL layers (1195-node flood @390); drop it → collapsed-initial + lazy-expand per layer via /api/trace/children.

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

// S33-P2a: explicit owner-action → generate the bounded RawBin M1 model (src/ts/scenario) then reload the tree.
document.getElementById('gen-rawbin')?.addEventListener('click', () => {
  const btn = document.getElementById('gen-rawbin') as HTMLButtonElement | null;
  if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
  if (err) err.textContent = '';
  fetch('/api/model/generate-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: '{}' })
    .then((r) => r.json())
    .then((d) => { if (err) err.textContent = d && d.ok ? `Generated ${d.files} files → ${d.roots} classes (store-only).` : `Generate failed: ${d && d.error ? d.error : 'unknown'}`; return load(); })
    .catch((e: unknown) => { if (err) err.textContent = 'Generate failed: ' + (e instanceof Error ? e.message : String(e)); })
    .finally(() => { if (btn) { btn.disabled = false; btn.textContent = 'Generate RawBin'; } });
});

// R33.3 AC4 (markerPending — req IMPL-mints): mount a NAMED action bar on the /model view, REUSING rb-strip
// (S31 CONCEPT primitive, no fork). 'Add Diagram' → POST /create (new empty Diagram under diagrams/, appears in
// the tree ready to drop onto); Import-PUML / Compile-PUML→SVG → POST /import-puml (R32.7 engine → model + SVG diagram).
function mountActionBar(): void {
  if (document.querySelector('rb-strip.model-actions')) return;
  const host = document.querySelector('.trace-page') || document.body;
  const strip = document.createElement('rb-strip') as HTMLElement & { items?: { id: string; kind: string; content: string; label?: string }[] };
  strip.className = 'model-actions';
  const btn = (verb: string, label: string): string => `<button data-verb="${verb}" style="background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:6px 12px;font:13px system-ui;cursor:pointer;white-space:nowrap">${label}</button>`;
  const bar = `<div style="display:flex;gap:8px;padding:8px 10px;flex-wrap:wrap;background:#161b22;border-bottom:1px solid #30363d">${btn('add-diagram', '＋ Add Diagram')}${btn('compile-puml', '⚙ Compile PUML → SVG')}${btn('import-puml', '⇩ Import PUML')}</div>`;
  strip.items = [{ id: 'model-actions', kind: 'bar', content: bar, label: 'Actions' }];
  host.insertBefore(strip, host.firstChild);
  strip.addEventListener('click', (e) => {
    const verb = (e.target as HTMLElement).closest('button[data-verb]')?.getAttribute('data-verb');
    if (verb === 'add-diagram') void addDiagram();
    else if (verb === 'import-puml' || verb === 'compile-puml') void importPuml();
  });
}

async function addDiagram(): Promise<void> {
  const name = (prompt('New diagram name:', 'Model diagram') || '').trim();
  if (!name) return;
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/diagram/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    await load(); // the new empty Diagram appears under diagrams/ — a reachable droppable canvas (AC-reachable)
  } catch (e: unknown) { if (err) err.textContent = 'Add Diagram failed: ' + (e instanceof Error ? e.message : String(e)); }
}

async function importPuml(): Promise<void> {
  const text = (prompt('Paste PlantUML (@startuml … @enduml) → compile to a model + SVG diagram:') || '').trim();
  if (!text) return;
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/import-puml', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    if (err) err.textContent = `Imported ${d.elements} classes, ${d.relations} relations → diagram.`;
    await load();
  } catch (e: unknown) { if (err) err.textContent = 'Import PUML failed: ' + (e instanceof Error ? e.message : String(e)); }
}

mountActionBar();
void load();
