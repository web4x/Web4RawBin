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
import type { ActionDecl } from '../trace/action-applicability.js'; // R40.37: model action DECLARATIONS fed to the shared-bar resolver
import { MODEL_DECLS } from './model-action-decls.js'; // R40.37: the REAL decls in a pure, node-testable module (test-the-code-not-a-replica)

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
// R33.6.5 items 5+6: the action bar now lives IN the drawer (RbDetailDrawer.setActions), SELECTION-DRIVEN. The
// /model HOST owns the type→actions map + verb-dispatch (the shared drawer stays generic, INV-3). Page-top
// mountActionBar RETIRED. /trace + /scenario bundles never call this → their drawers register no actions → bar hidden.
// R40.37: MODEL_DECLS moved to the pure model-action-decls.ts (imported above) so a node gate imports the REAL decls.
// [impl:uuid:a1a5be99-a715-4a85-a0bf-89964c9c3949] ModelView.actionsForContext — R40.37 SUPERSEDED-BY
// universalActions.applicableActionsFor (4018e773), POINTER-ONLY: the per-type RESOLVING is now done ONCE in the shared
// drawer bar by applicableActionsFor; this retains its historical credit + Tests (honorSupersededBy, R30.11) and is now
// simply the model DECLARATION SOURCE. R33.9 membership (diagram-open) became the when:hasActiveDiagram predicate above.
function actionsForContext(): ActionDecl[] { return MODEL_DECLS; }

// [impl:uuid:613bfb4a-7214-4cf6-b2fa-d32f96559d18] ModelView.wireDrawerActions (host) — listen rb-drawer-detail-shown{type,ref}
// + rb-active-diagram{uuid} → setActions(actionsForContext); dispatch rb-drawer-action{verb} to the handlers. No fork.
function wireDrawerActions(): void {
  const drawer = (): (HTMLElement & { registerActionDecls?: (fn: () => ActionDecl[]) => void; refreshActions?: () => void }) | null => document.querySelector('rb-detail-drawer');
  let shownRef = '';
  let activeDiagramUuid: string | null = null; // R33.9: the OPEN diagram (rb-active-diagram) — explicit membership target
  // R34.7/R-E: register model's context verbs as a PROVIDER on the shared drawer (replaces the isolated setActions);
  // the drawer's universalActionBar composes the A1 default [Scenario,Edit] + this on ALL usages. actionsForContext (R33.9)
  // reused verbatim. Idempotent (registered flag) + lazy (re-tried on detail-shown) so it survives a late-mounted drawer.
  let registered = false;
  const ensureProvider = (): void => { if (registered) return; const dr = drawer(); if (dr?.registerActionDecls) { dr.registerActionDecls(actionsForContext); registered = true; } }; // R40.37: SUPPLY decls; the shared bar resolves once (membership via when:hasActiveDiagram in the bar's ctx)
  ensureProvider();
  document.addEventListener('rb-drawer-detail-shown', (e) => {
    shownRef = (e as CustomEvent<{ ref?: string }>).detail?.ref || '';
    ensureProvider();
  });
  document.addEventListener('rb-active-diagram', (e) => { // R33.9: a diagram opened/closed → recompute membership verbs
    activeDiagramUuid = (e as CustomEvent<{ uuid?: string | null }>).detail?.uuid || null;
    drawer()?.refreshActions?.();
  });
  document.addEventListener('rb-drawer-action', (e) => {
    const verb = (e as CustomEvent<{ verb?: string }>).detail?.verb || '';
    if (verb === 'add-diagram') void addDiagram();
    else if (verb === 'add-folder') void addFolder(shownRef); // R34.3 (R-B): mint a Folder unit under the selected parent
    else if (verb === 'import-puml' || verb === 'compile-puml') void importPuml();
    else if (verb === 're-sync') document.dispatchEvent(new CustomEvent('rb-model-resync-request', { bubbles: true })); // rb-diagram-detail.onResyncRequest
    else if (verb === 'discover') void discoverRelated(shownRef, activeDiagramUuid); // R33.9: explicit active-diagram target (no last-diagram scan)
    else if (verb === 'remove-from-diagram') void removeFromDiagram(shownRef, activeDiagramUuid);
    else if (verb === 'add-to-diagram') void addToDiagram(shownRef, activeDiagramUuid);
    else if (verb === 'new-element') void newElementAction(shownRef); // R33.9 unit verbs → element CRUD endpoints
    else if (verb === 'rename-element') void renameElementAction(shownRef);
    else if (verb === 'delete-element') void deleteElementAction(shownRef);
  });
}

// [impl:uuid:ffdd9347-34db-4923-9cee-b6d00dd8ec9c] ModelView.addDiagram (Method 85a36ec2, re-point per req note:
// built as the module fn `addDiagram`, NOT a new addDiagramRefresh) — R33.5 item1: on /create ok, refresh the tree
// AND reveal the diagrams/ path so the NEW empty diagram SHOWS (was: full reload collapsed it out of view).
async function addDiagram(): Promise<void> {
  const name = (prompt('New diagram name:', 'Model diagram') || '').trim();
  if (!name) return;
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/diagram/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    await load();
    // item1: reveal the path so the new empty Diagram is VISIBLE under diagrams/ (reachable droppable canvas), not buried collapsed.
    await (tree as (HTMLElement & { expandPath?: (r: string[]) => Promise<void> }) | null)?.expandPath?.(['mof-m1', 'project:RawBin', 'rawbin:diagram']);
  } catch (e: unknown) { if (err) err.textContent = 'Add Diagram failed: ' + (e instanceof Error ? e.message : String(e)); }
}

// [impl:uuid:2f65a342-2f5c-4c4f-8671-c29934f0f9cc] ModelView.addFolder (Method 1b559bf6, Class 35759641) — R34.3 (R-B):
// mint a Folder unit under the selected parent (POST /api/model/folder/create, store-only) → refresh + best-effort reveal.
// Full tree placement of Folder units lands with R-A (A2 File/Folder in mofChildren). The 'add-folder' verb listing rides a1a5be99.
async function addFolder(ref: string): Promise<void> {
  const name = (prompt('New folder name:', 'New folder') || '').trim();
  if (!name) return;
  if (err) err.textContent = '';
  try {
    const parent = ref.split(':').pop() || '';
    const r = await fetch('/api/model/folder/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name, parent }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    await load(); // refresh; the Folder unit shows under the model tree once R-A enumerates File/Folder in mofChildren
    if (d.uuid) document.dispatchEvent(new CustomEvent('rb-tree-reveal', { detail: { ref: `folder:${d.uuid}` }, bubbles: true })); // best-effort reveal (R33.7.4)
  } catch (e: unknown) { if (err) err.textContent = 'Add folder failed: ' + (e instanceof Error ? e.message : String(e)); }
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

// [impl:uuid:8e8c1d75-c4a4-4067-88fa-cb2b10521f84] ModelView.discoverRelated (Method e6cc8e85) — R33.7.2 UC2:
// 1-LEVEL graph expand from the selected model element. Resolve the open diagram (the /api/model/tree diagram root,
// same heuristic as rb-modelelement-detail.diagramRef), fetch the element (/api/ior) → its DIRECT neighbors =
// relatesTo (out: base/extends, nav/target) ∪ relatedFrom (in: subclasses/implementers) → add-view each (reuse the
// R32.11 /add-view endpoint, server auto-grid + dedup, INV-DA2 no fork). NO transitive walk (INV-DA1 exactly 1 level);
// buildEdges (UC1) wires the edges on re-render. Model-derived only, never fabricated (INV-AR1).
async function discoverRelated(ref: string, diagramUuid: string | null): Promise<void> {
  const uuid = (ref.split(':').pop() || '').trim();
  if (!uuid) return;
  if (!diagramUuid) { if (err) err.textContent = 'Open a diagram first, then Discover.'; return; } // R33.9: EXPLICIT active-diagram target (no /api/model/tree last-diagram scan)
  if (err) err.textContent = '';
  try {
    const m = (await (await fetch(`/api/ior/ior:instance:${uuid}`)).json())?.unit?.model || null;
    if (!m) return;
    const refs = [...(Array.isArray(m.relatesTo) ? m.relatesTo : []), ...(Array.isArray(m.relatedFrom) ? m.relatedFrom : [])].map((x: string) => (String(x).split(':').pop() || ''));
    const neighbors = Array.from(new Set(refs)).filter((u) => u && u !== uuid); // INV-DA1: direct neighbors only, dedup, exclude self
    for (const n of neighbors) await fetch('/api/model/diagram/add-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid, elementUuid: n }) }).catch(() => { /* dedup/idempotent */ });
    document.dispatchEvent(new CustomEvent('rb-diagram-refresh', { bubbles: true })); // → rb-diagram-detail re-renders → buildEdges (UC1) wires the discovered edges
    if (err) err.textContent = `Discovered ${neighbors.length} related element(s).`;
  } catch (e: unknown) { if (err) err.textContent = 'Discover failed: ' + (e instanceof Error ? e.message : String(e)); }
}

// [impl:uuid:4c9c3969-cb16-4c9b-b75d-e2d0d1818b51] ModelView.removeFromDiagram (Method 167fe16f) — R33.8 (INVERSE of
// add-view): drop the selected element's VIEW-LINK from the open diagram. Resolve the diagram (the /api/model/tree
// diagram root, same heuristic as discoverRelated) → POST /api/model/diagram/remove-view {diagramUuid, elementUuid} →
// on ok dispatch rb-diagram-refresh → the diagram re-renders (buildEdges drops the box + its edges, no dangling). The
// ModelElement unit is UNTOUCHED (store-only view-removal, re-addable) — INV-RM1 no delete, INV-RM3 reuse-no-fork.
async function removeFromDiagram(ref: string, diagramUuid: string | null): Promise<void> {
  const uuid = (ref.split(':').pop() || '').trim();
  if (!uuid) return;
  if (!diagramUuid) { if (err) err.textContent = 'Open a diagram first, then Remove.'; return; } // R33.9: EXPLICIT active-diagram target (no last-diagram scan)
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/diagram/remove-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid, elementUuid: uuid }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    document.dispatchEvent(new CustomEvent('rb-diagram-refresh', { bubbles: true })); // → rb-diagram-detail re-renders → buildEdges drops the removed box + its edges
    if (err) err.textContent = d.removed ? 'Removed from diagram.' : 'Not on the diagram.';
  } catch (e: unknown) { if (err) err.textContent = 'Remove failed: ' + (e instanceof Error ? e.message : String(e)); }
}

// R33.9 add-member (rides the R32.11 add-view endpoint, re-pointed to the EXPLICIT active diagram — no last-diagram scan).
async function addToDiagram(ref: string, diagramUuid: string | null): Promise<void> {
  const uuid = (ref.split(':').pop() || '').trim();
  if (!uuid) return;
  if (!diagramUuid) { if (err) err.textContent = 'Open a diagram first, then Add.'; return; }
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/diagram/add-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid, elementUuid: uuid }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    document.dispatchEvent(new CustomEvent('rb-diagram-refresh', { bubbles: true })); // → re-render → buildEdges wires the added element's edges (R33.7.2 UC1)
    if (err) err.textContent = d.added ? 'Added to diagram.' : 'Already on the diagram.';
  } catch (e: unknown) { if (err) err.textContent = 'Add failed: ' + (e instanceof Error ? e.message : String(e)); }
}

// R33.9 UNIT verbs → element CRUD server endpoints (mint/rename/delete the M1 unit in MODEL_STORE; NOT a view op).
async function newElementAction(ref: string): Promise<void> {
  const name = (prompt('New class name:', 'NewClass') || '').trim();
  if (!name) return;
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/element/new', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, kind: 'class', near: ref.split(':').pop() || '' }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    await load();
  } catch (e: unknown) { if (err) err.textContent = 'New class failed: ' + (e instanceof Error ? e.message : String(e)); }
}
async function renameElementAction(ref: string): Promise<void> {
  const uuid = (ref.split(':').pop() || '').trim();
  if (!uuid) return;
  const name = (prompt('Rename class to:') || '').trim();
  if (!name) return;
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/element/rename', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ elementUuid: uuid, name }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    await load();
  } catch (e: unknown) { if (err) err.textContent = 'Rename failed: ' + (e instanceof Error ? e.message : String(e)); }
}
async function deleteElementAction(ref: string): Promise<void> {
  const uuid = (ref.split(':').pop() || '').trim();
  if (!uuid) return;
  if (!confirm('Delete this class UNIT from the model? (This is NOT the same as remove-from-diagram — it deletes the element.)')) return; // guarded (destructive)
  if (err) err.textContent = '';
  try {
    const r = await fetch('/api/model/element/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ elementUuid: uuid }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || ('HTTP ' + r.status));
    await load();
  } catch (e: unknown) { if (err) err.textContent = 'Delete failed: ' + (e instanceof Error ? e.message : String(e)); }
}

// R33.5 item4: click a SOURCE .puml tree node (ref carries 'puml-src:<relpath>') → Import it (R32.7 pumlToModel) →
// reveal the resulting interactive diagram under diagrams/. (Reuses the /import-puml endpoint's new srcPath mode.)
document.addEventListener('selection-changed', (e) => {
  const sel = (e as CustomEvent<{ selected?: string[] }>).detail?.selected || [];
  if (sel.length !== 1) return;
  const i = sel[0].indexOf('puml-src:');
  if (i >= 0) void importPumlSrc(sel[0].slice(i + 'puml-src:'.length));
});

async function importPumlSrc(srcPath: string): Promise<void> {
  if (err) err.textContent = `Importing ${srcPath}…`;
  try {
    const r = await fetch('/api/model/import-puml', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ srcPath }) });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || d.reason || ('HTTP ' + r.status));
    if (err) err.textContent = `Imported ${srcPath.split('/').pop()} → ${d.elements} classes → diagram.`;
    await load();
    await (tree as (HTMLElement & { expandPath?: (r: string[]) => Promise<void> }) | null)?.expandPath?.(['mof-m1', 'project:RawBin', 'rawbin:diagram']);
  } catch (e: unknown) { if (err) err.textContent = 'Import PUML failed: ' + (e instanceof Error ? e.message : String(e)); }
}

wireDrawerActions();
void load();
