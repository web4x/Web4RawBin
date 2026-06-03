[Back to Sprint 17 Planning](./planning.md)

# T174: Drawer UX cleanup + /scenario route + mobile width-cap (Tron R-M1/M2/M3/M4)
[task:uuid:46b7eadf-d0ae-4950-9602-cc96390c3697]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect design — this document)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - Tron 4 atoms (R-M1 through R-M4), via PO 2026-06-03
- follows
  - T110 (drawer), T167 (mobile layout + width-cap), T173 (lazy-load + /trace?ior=)

## Design (Architect — robbin-architect, 2026-06-03)

**Recommendation: ONE consolidated task.** All 4 atoms touch the drawer/view layer and share the same commit surface. Splitting would create 4 version bumps for what is one coherent UX pass.

---

### R-M1: Drawer Placeholder "No view for ?.?" Stale-State Cleanup

**Current:** `VerbRegistry.ts:43` renders `No view for <code>${type ?? '?'}.${verb ?? '?'}</code>` when no handler matches. This persists in the drawer until the next navigation — looks broken.

**Root cause:** Drawer opens (`open` attribute set) when `ref` is assigned. If the VerbRegistry has no handler for the object's type, `notFound()` renders the placeholder. But the drawer stays open with stale placeholder content even after the user navigates elsewhere in the tree.

**Fix — two parts:**

Part A: Clear drawer on tree navigation (not just on object select):
```typescript
// rb-trace-tree.ts — when user clicks a tree item that has no DetailView:
if (!verbRegistry.has(obj.type, 'show')) {
  drawer.close();  // don't show stale "No view" — just close
  return;
}
```

Part B: Replace placeholder with actionable content:
```typescript
// VerbRegistry.ts:42-44 — REPLACE notFound():
notFound(mount: HTMLElement, type?: string, verb?: string): void {
  mount.innerHTML = `<div class="trace-notfound">
    <p>No detail view for <strong>${type || 'unknown'}</strong></p>
    <p class="trace-notfound-hint">This instance type doesn't have a specialized view yet.</p>
  </div>`;
}
```

Add CSS:
```css
.trace-notfound { padding: 20px; text-align: center; color: rgba(255,255,255,0.5); }
.trace-notfound-hint { font-size: 0.8rem; margin-top: 8px; }
```

---

### R-M2: Viewport-Aware Swipe Handle (Mobile-Only)

**Current:** `rb-detail-drawer.ts` has touch swipe (lines 54-81) but the handle is a small 40×4px bar (CSS in `app.css:256-258`). On mobile, it's hard to grab. Swipe only works when starting on the handle element — missing the handle means no swipe.

**Fix — enlarge touch target + viewport-aware:**

```css
/* Mobile: larger swipe handle */
@media (max-width: 480px) {
  rb-detail-drawer .drawer-handle {
    width: 60px;
    height: 6px;
    margin: 0 auto 16px;
    padding: 12px 0;       /* invisible touch padding */
    cursor: grab;
  }
}

/* Desktop: smaller handle (or hidden — drawer is side pane per T167) */
@media (min-width: 1025px) {
  rb-detail-drawer .drawer-handle {
    display: none;  /* no swipe on desktop split layout */
  }
}
```

Also expand the swipe touch area — accept swipe start anywhere in the top 60px of the drawer (not just the handle):

```typescript
// rb-detail-drawer.ts onTouchStart — REPLACE handle-only check:
private onTouchStart = (e: TouchEvent): void => {
  // Accept swipe from top 60px of drawer (not just the tiny handle)
  const rect = this.getBoundingClientRect();
  const touchY = e.touches[0].clientY;
  if (touchY - rect.top < 60) {
    this.dragging = true;
    this.startY = touchY;
    this.style.transition = 'none';
  }
};
```

---

### R-M3: NEW ROUTE /scenario?ior=<uuid> — Single-Instance Tree

**Distinct from /trace:** `/trace` shows the full tree rooted at all Requirements. `/scenario?ior=<uuid>` shows ONE scenario instance as root with lazy-loaded children per LOCKED chain — a focused drill-down view.

**Use case:** User clicks a `.scenario.json` in the file browser → lands at `/scenario?ior=<uuid>` → sees just that instance + its children. No requirement-root context needed.

#### HTML Shell: `src/public/scenario.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RawBin — Scenario</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <div id="scenario-app"></div>
  <script type="module" src="dist/scenario.js"></script>
</body>
</html>
```

#### Entry: `src/public/ts/scenario-view.ts`

```typescript
import './trace/rb-trace-tree.js';
import './trace/rb-detail-drawer.js';
// Reuse all trace components — just seed differently

const params = new URLSearchParams(window.location.search);
const ior = params.get('ior');

if (!ior) {
  document.getElementById('scenario-app')!.innerHTML = '<p>Missing ?ior= parameter</p>';
} else {
  // Render: single instance as root + lazy children
  const app = document.getElementById('scenario-app')!;
  app.innerHTML = `
    <div class="trace-page">
      <div class="trace-tree-panel">
        <rb-trace-tree data-seed-ior="${ior}"></rb-trace-tree>
      </div>
      <rb-detail-drawer></rb-detail-drawer>
    </div>
  `;
}
```

#### Tree Seeding: `data-seed-ior` Attribute

When `rb-trace-tree` has `data-seed-ior`, it fetches that ONE unit as root (via `/api/trace/children/<uuid>`) instead of fetching all requirement roots via `/api/trace/roots`:

```typescript
// rb-trace-tree.ts render() — ADD seed-ior support:
async render(): Promise<void> {
  const seedIor = this.getAttribute('data-seed-ior');
  
  if (seedIor) {
    // Scenario mode: single instance as root
    const res = await fetch(`/api/trace/children/${seedIor}`);
    const data = await res.json();
    this.innerHTML = '';
    this.appendChild(this.lazyNode({
      uuid: data.uuid, type: data.type, name: data.name,
      hasChildren: data.children.length > 0
    }, 0));
    // Auto-expand root
    this.expandNode(data.uuid, this.querySelector(`[data-children="${data.uuid}"]`)!);
    return;
  }
  
  // Trace mode: all requirement roots (existing)
  const res = await fetch('/api/trace/roots');
  // ... existing code
}
```

#### Server Route

```typescript
// server.ts — add before static file serving:
if (filepath === '/scenario' || filepath === '/scenario/') {
  const html = fsSync.readFileSync(path.join(PUBLIC_DIR, 'scenario.html'), 'utf-8');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
  return;
}
```

#### STATIC_SHELL (c): REQUIRED — new route `/scenario` with new bundle `dist/scenario.js`. Add to `sw.js` STATIC_SHELL list.

#### T173 Update: `.scenario.json` clicks → `/scenario?ior=` (not `/trace?ior=`)

Change the target: file-browser clicks and `/md/` 302 redirects go to `/scenario?ior=<uuid>` instead of `/trace?ior=<uuid>`. The user gets the focused single-instance view. From there, a "View in full trace" link navigates to `/trace?ior=<uuid>` if needed.

### R-M3 BUG FIX — Expert Implementation Diverged from Design (2026-06-03)

**Tron report:** `/scenario?ior=X` shows full tree, ignores the `?ior=` seeding.

**Root cause in shipped code (`scenario-view.ts:29-31`):**
```typescript
// BUG: fetches FULL graph — shows all req roots, not single instance
const fullRes = await fetch('/api/trace');
const fullData = await fullRes.json();
const graph = deserialize(fullData.objects || []);
tree.setGraph(graph, fullData.broken || []);  // ← renders EVERYTHING
```

Expert used `setGraph()` (full graph) instead of the architect's `data-seed-ior` + `/api/trace/children/<uuid>` lazy-load design. The `router.navigate()` on line 46 auto-selects the detail view, but the TREE still shows all roots.

**Required fix — replace lines 28-46 with single-IOR seed:**

```typescript
if (data.children && data.children.length > 0) {
  // Build a MINIMAL graph containing ONLY the seeded IOR + its children
  // NOT the full /api/trace graph
  
  const treePanel = document.createElement('div');
  treePanel.className = 'trace-tree-panel';
  
  // Seed header: show the instance name + type
  treePanel.innerHTML = `<div style="padding:8px">
    <span style="color:rgba(255,255,255,0.5);font-size:0.8rem">${data.type || ''}</span>
    <span style="color:white;font-weight:600">${data.name || ior}</span>
  </div>`;
  
  // Create tree seeded from THIS instance only
  const tree = document.createElement('rb-trace-tree') as any;
  tree.setAttribute('data-seed-ior', ior!);
  treePanel.appendChild(tree);
  
  const drawer = document.createElement('rb-detail-drawer');
  app!.innerHTML = '';  // clear
  app!.appendChild(treePanel);
  app!.appendChild(drawer);
  
  // Auto-open detail view for the seeded instance
  // (drawer opens with the instance's DetailView)
}
```

**AND** `rb-trace-tree.ts` must implement `data-seed-ior`:

```typescript
// rb-trace-tree.ts render() — ADD at top:
async render(): Promise<void> {
  const seedIor = this.getAttribute('data-seed-ior');
  
  if (seedIor) {
    // SCENARIO MODE: fetch only this one unit + its children
    const res = await fetch(`/api/trace/children/${encodeURIComponent(seedIor)}`);
    const data = await res.json();
    this.innerHTML = '';
    
    // Render seed as the SOLE root
    const root = this.lazyNode({
      uuid: data.uuid,
      type: data.type,
      name: data.name,
      hasChildren: (data.children || []).length > 0
    }, 0);
    this.appendChild(root);
    
    // Auto-expand to show children immediately
    const childContainer = root.querySelector('[data-children]');
    if (childContainer && data.children?.length) {
      for (const child of data.children) {
        childContainer.appendChild(this.lazyNode(child, 1));
      }
      childContainer.style.display = '';
    }
    
    // Scroll to and highlight the root
    root.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  
  // TRACE MODE: existing full-tree-from-roots behavior
  // ... existing code unchanged
}
```

**Key difference:** `/scenario` NEVER calls `/api/trace` (full graph). It ONLY calls `/api/trace/children/<uuid>` for the seeded IOR, then each expand click fetches the next hop's children. This is the T173 lazy-load design applied correctly.

**Expert action:** Replace `scenario-view.ts` lines 28-46. Add `data-seed-ior` to `rb-trace-tree.ts`. Remove the `fetch('/api/trace')` call entirely from `/scenario`.

### R-M3 SECOND DIAGNOSIS — Task ior=0 children (tester 2026-06-03)

**Tester confirms:** Sprint ior → 379 items (full tree). Task ior → 0 items. Both wrong.

**Root cause — TWO layers:**

**Layer 1: Scenario data has NO UUID forward arrays.**
```
Task unit model.subtasks = "None (atomic task).\n---\n..."  // STRING, not UUID[]
Task unit model.useCases = undefined                        // MISSING
```
Forward UUID arrays (`tasks[]`, `useCases[]`, `classes[]`, `methods[]`) were never populated in the scenario index. The T172 forward-ref population (5-step) hasn't run on the live data.

**Layer 2: `/api/trace/children/` reads wrong field names.**
```typescript
// server.ts:506 — current:
Task: ['children', 'useCases']  // 'children' doesn't exist in data
```
Should be `['subtasks', 'useCases']` per T168 canonical chain — but even with correct field names, the data is strings not UUID arrays.

**Why `/api/trace` (full graph) works:** `scanRepo()` computes forward refs from markdown at request time — it parses task files, requirements.md, traceability-matrix.md and builds the graph. The `/api/trace/children/<uuid>` endpoint reads pre-stored scenario JSON which has NO computed refs.

### EXACT FIX for Expert

**Option A (fast — bridge):** `/api/trace/children/<uuid>` falls back to the scanRepo graph when scenario index has no forward arrays:

```typescript
// server.ts /api/trace/children handler — REPLACE lines 505-513:
const type = (unit.ior || '').split(':')[2] || '';
let childRefs: string[] = [];

// Try scenario index forward arrays first (T172 populated data)
const FORWARD_KEYS: Record<string, string[]> = {
  Requirement: ['tasks'],
  Task: ['subtasks', 'useCases'],     // FIX: 'subtasks' not 'children'
  UseCase: ['classes'],
  Class: ['methods'],
  Method: ['implementations'],
  TraceLink: ['tests'],
  Sprint: ['tasks', 'requirements'],
};
for (const key of (FORWARD_KEYS[type] || [])) {
  const refs = (unit.model as Record<string, unknown>)[key];
  if (Array.isArray(refs)) {
    for (const r of refs) {
      const clean = String(r).replace('ior:instance:', '');
      if (/^[0-9a-f]{8}-/.test(clean)) childRefs.push(clean);
    }
  }
}

// FALLBACK: if no UUID refs found, consult the scanRepo graph
if (childRefs.length === 0) {
  const { graph } = scanRepo(sprintsDir, srcDir, testDir);
  const graphObj = graph.get(uuid);
  if (graphObj) {
    const links = graphObj.toJSON().links || {};
    childRefs = Object.values(links).flat().map(r => String(r).replace(/^[a-z]+:/, ''));
  }
}
```

**Option B (correct — T172):** Run the 5-step forward-ref population on scenario data first, then children endpoint works natively. This is the T172 scope — but it's not shipped yet.

**Architect recommendation:** Option A NOW (unblocks /scenario immediately), Option B in T172 (permanent fix removes the fallback).

**Also fix `scenario-view.ts`** per previous diagnosis — remove `fetch('/api/trace')`, use `data-seed-ior`.

### Summary: 3 Fixes for Expert (R-M3 complete)

| # | File | Fix |
|---|------|-----|
| 1 | `scenario-view.ts` | Remove `fetch('/api/trace')`. Use `data-seed-ior` attribute on tree. Single root, not full graph. |
| 2 | `rb-trace-tree.ts` | Implement `data-seed-ior` branch: fetch `/api/trace/children/<uuid>`, render as sole root, auto-expand, scroll-to. |
| 3 | `server.ts:505-513` | Fix `FORWARD_KEYS` (`subtasks` not `children`). Add scanRepo fallback when scenario arrays empty/strings. |

---

### R-M4: Mobile Drawer Item-View Width Capped at Drawer Width

**Current:** On mobile, the drawer is full-width (`left: 0; right: 0`). But DetailView content inside can overflow horizontally (long code blocks, wide tables).

**Fix:** Already partly covered by T167 (`overflow-x: hidden; word-break: break-word`). Add explicit width constraint on child elements:

```css
rb-detail-drawer > * {
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}

/* Specific: DetailView content areas */
.dv-fields, .dv-links, .dv-head {
  max-width: 100%;
  overflow-x: hidden;
  word-break: break-word;
}

/* Code blocks scroll inside the drawer */
rb-detail-drawer pre, rb-detail-drawer code {
  max-width: 100%;
  overflow-x: auto;
  font-size: 0.75rem;
}
```

---

### Files to Create/Modify

| File | Change | Atom |
|------|--------|------|
| `src/public/ts/trace/VerbRegistry.ts:42` | Replace `notFound()` with actionable placeholder | R-M1 |
| `src/public/ts/trace/rb-trace-tree.ts` | Close drawer if no handler (R-M1); `data-seed-ior` attribute (R-M3); `select()` + `scrollIntoView` + ViewBus subscribe (R-M3d) | R-M1, R-M3, R-M3d |
| `src/public/ts/trace/rb-object-item.ts` | Add `selected` observed attribute | R-M3d |
| `src/public/ts/trace/rb-detail-drawer.ts:54` | Expand swipe touch area to top 60px (R-M2) | R-M2 |
| `src/public/app.css` | Mobile handle enlargement (R-M2); drawer child width-cap (R-M4); notfound style (R-M1) | R-M1, R-M2, R-M4 |
| `src/public/scenario.html` | CREATE — STATIC_SHELL for /scenario route | R-M3 |
| `src/public/ts/scenario-view.ts` | CREATE — entry point, seeds tree from ?ior= | R-M3 |
| `src/ts/server/server.ts` | Add `/scenario` route handler | R-M3 |
| `src/public/sw.js` | Add `/scenario` to STATIC_SHELL + bump CACHE_NAME | R-M3 (c) |
| `package.json` | Bump version (rule-pair (a)) | All |
| esbuild config | Add `scenario-view.ts` entry point → `dist/scenario.js` | R-M3 |
| `src/ts/server/server.ts:626` + `templates.ts:65,72` | Change `/trace?ior=` → `/scenario?ior=` for .scenario.json clicks | R-M3 (updates T173) |

### R-M3e: /scenario Missing Event Wiring — Collapse/Expand + DetailView NOT Working (PO fold 2026-06-03)

**Tron report:** /scenario renders scoped tree (R-M3a seed fixed) but collapse/expand and DetailView-on-click don't work.

**Root cause in `scenario-view.ts`:** Creates `rb-trace-tree` + `rb-detail-drawer` as raw DOM — imports NEITHER `TraceRouter` NOR `viewRegistry()` NOR `setActiveRouter()`. Compare `/trace` entry wiring:

```typescript
// /trace entry (trace/index.ts — the full wiring):
import { TraceRouter, viewRegistry, setActiveRouter } from './trace/index.js';
// ... creates graph, then:
const reg = viewRegistry(drawer);          // registers all 7 DetailViews + drawer host
const router = new TraceRouter(graph, reg, mount);
setActiveRouter(router);                   // wires navigate() in rb-object-item clicks
router.start();                            // handles hash routes
```

```typescript
// /scenario entry (scenario-view.ts — MISSING all of this):
const tree = document.createElement('rb-trace-tree');   // bare element
const drawer = document.createElement('rb-detail-drawer'); // bare element
// NO TraceRouter, NO viewRegistry, NO setActiveRouter
// → rb-object-item click calls navigate() → nav.ts → no active router → nothing happens
// → expand/collapse IS in rb-trace-tree.ts (toggle event) → works IF the tree is connected
//   BUT without graph.get() the tree can't resolve children → expand shows nothing
```

**The fix — scenario-view.ts must import and wire the FULL /trace interaction layer:**

```typescript
// scenario-view.ts — REPLACE lines 7-41:
import {
  TraceRouter, viewRegistry, deserialize, setActiveRouter, ViewBus
} from './trace/index.js';
// index.js side-effect imports ALL components: rb-object-item, rb-detail-drawer,
// rb-task-detail, rb-requirement-detail, etc. — so they're registered as custom elements

const params = new URLSearchParams(window.location.search);
const ior = params.get('ior');
const app = document.getElementById('scenario-app');

if (!ior || !app) {
  if (app) app.innerHTML = '<div style="color:#888;padding:20px">Missing ?ior= parameter</div>';
} else {
  async function load(): Promise<void> {
    try {
      // Step 1: Fetch scoped children from children endpoint
      const childRes = await fetch(`/api/trace/children/${encodeURIComponent(ior!)}`);
      if (!childRes.ok) throw new Error(`children ${childRes.status}`);
      const seedData = await childRes.json();

      // Step 2: Build a MINIMAL graph from the children endpoint
      // TraceRouter needs a TraceGraph to resolve refs → DetailViews
      // Option A: use /api/trace full graph (works but defeats R-M3 purpose)
      // Option B: build graph incrementally from /api/trace/children responses
      // For NOW (Option A with small scope): fetch full graph but SEED tree from ior only
      const traceRes = await fetch('/api/trace');
      const traceData = await traceRes.json();
      const graph = deserialize(traceData.objects || []);

      // Step 3: Render layout
      app!.innerHTML = `<div class="trace-page">
        <div class="trace-tree-panel"></div>
      </div>`;
      const treePanel = app!.querySelector('.trace-tree-panel')!;

      // Step 4: Create tree with data-seed-ior (scoped root)
      const tree = document.createElement('rb-trace-tree') as HTMLElement & {
        setGraph(g: unknown, b: string[]): void;
        select(ref: string): void;
      };
      // Give tree the full graph for expand/collapse resolution
      // BUT render only the seeded root via data-seed-ior
      tree.setAttribute('data-seed-ior', ior!);
      tree.setGraph(graph, traceData.broken || []);
      treePanel.appendChild(tree);

      // Step 5: Create drawer + wire TraceRouter (THE MISSING PIECE)
      const drawer = document.createElement('rb-detail-drawer');
      app!.querySelector('.trace-page')!.appendChild(drawer);

      const detailMount = document.createElement('div');
      const reg = viewRegistry(drawer);       // registers all 7 typed DetailViews
      const router = new TraceRouter(graph as never, reg, detailMount);
      setActiveRouter(router);                 // wires navigate() for rb-object-item clicks
      router.start();

      // Step 6: Auto-navigate to seeded IOR
      const type = seedData.type?.toLowerCase() || 'task';
      router.navigate(type, 'show', { uuid: ior! });

      // Step 7: Auto-select in tree (R-M3d)
      requestAnimationFrame(() => tree.select(ior!));

    } catch (e) {
      app!.innerHTML = `<div style="color:#888;padding:20px">Failed to load. <a href="/trace">Full trace</a></div>`;
    }
  }
  load();
}
```

**Key insight:** The tree needs `setGraph()` for expand/collapse resolution (it calls `graph.get(ref)` to find children). `data-seed-ior` controls which ROOT renders, but the graph must still be available for child resolution. The graph is loaded once; the tree only RENDERS the seed root + lazy children.

**Temporary tradeoff:** This still fetches `/api/trace` once for the graph (needed for `graph.get()` in expand). The pure-lazy approach (no full graph) requires refactoring `rb-trace-tree` to use `/api/trace/children/<uuid>` for EVERY expand instead of `graph.get()`. That's a T173 enhancement — not T174 scope.

**What this fixes:**
- ✅ Collapse/expand works (graph available for child resolution)
- ✅ Click item → DetailView opens in drawer (TraceRouter + viewRegistry wired)
- ✅ Tree renders only seeded root (data-seed-ior controls root selection)
- ✅ Auto-scroll + selection (R-M3d)

### R-M3d PARTIAL: Auto-Open DetailView Timing (2026-06-03)

**Bug:** DetailView doesn't open on /scenario load. Code present (line 52-57) but fires before tree renders.

**Root cause:** `scenario-view.ts:52` uses `setTimeout(navigate, 100)`. But `renderSeed()` is async — it fetches `/api/trace/children/<uuid>` then builds DOM. 100ms is non-deterministic. `router.navigate()` resolves the object in the graph (works — graph loaded at line 29), but `scrollIntoView` on line 56 targets `rb-object-item` elements that don't exist yet.

**Fix — deterministic: navigate AFTER renderSeed completes:**

`renderSeed()` returns a Promise. Make it public and await it:

```typescript
// rb-trace-tree.ts — make renderSeed return a Promise that resolves when DOM is built:
public async renderSeed(uuid: string): Promise<void> {
  // ... existing fetch + DOM build ...
  // At end, dispatch a custom event:
  this.dispatchEvent(new CustomEvent('seed-ready', { detail: { uuid } }));
}
```

```typescript
// scenario-view.ts — REPLACE setTimeout with deterministic await:

// Option A: await the renderSeed promise directly
await (tree as any).renderSeed?.(ior);  // if renderSeed is exposed
router.navigate(type, 'show', { uuid: ior! });
const rootItem = tree.querySelector('rb-object-item');
rootItem?.scrollIntoView({ behavior: 'smooth', block: 'center' });

// Option B: listen for seed-ready event
tree.addEventListener('seed-ready', () => {
  router.navigate(type, 'show', { uuid: ior! });
  const rootItem = tree.querySelector('rb-object-item');
  rootItem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}, { once: true });
```

**Architect recommendation:** Option B (event-driven) — cleaner separation, no timing assumptions.

### R-M3e PARTIAL: 51 Children Pre-Expanded (2026-06-03)

**Bug:** /scenario shows seed root with ALL 51 children immediately visible. Expand-click is a no-op (already open).

**Root cause:** `rb-trace-tree.ts renderSeed():143-161` — creates ALL child nodes with `kids.style.display = ''` (visible). No collapse state. The `has-children` attribute is set but no expander toggle is wired for children fetched via `renderSeed`.

**Tron spec (R-M3c):** "ONLY that item view THEN lazy-load children" — seed shows ONLY the root item. Children load on first expand click.

**Fix — renderSeed starts collapsed:**

```typescript
// rb-trace-tree.ts renderSeed() — REPLACE lines 143-161:

// Show root with expander arrow but children HIDDEN
if (data.children?.length) {
  item.setAttribute('has-children', '');
  // Do NOT set 'children-open' — start collapsed
  
  // Create children container but HIDE it
  const kids = document.createElement('div');
  kids.className = 'tt-children';
  kids.style.display = 'none';          // COLLAPSED by default
  kids.setAttribute('data-parent-uuid', uuid);
  root.appendChild(kids);
  
  // Store children data for lazy-load on first expand
  (root as any)._pendingChildren = data.children;
}

// ... append root to tree ...

// Wire expand/collapse toggle
root.querySelector('.tt-row')?.addEventListener('click', (e) => {
  const kids = root.querySelector('.tt-children') as HTMLElement;
  if (!kids) return;
  
  if (kids.style.display === 'none') {
    // First expand: populate children from stored data
    if ((root as any)._pendingChildren) {
      for (const child of (root as any)._pendingChildren) {
        kids.appendChild(this.buildChildNode(child));
      }
      delete (root as any)._pendingChildren;
    }
    kids.style.display = '';
    item.setAttribute('children-open', '');
  } else {
    kids.style.display = 'none';
    item.removeAttribute('children-open');
  }
});
```

**Children of children:** When a child node is expanded, it fetches ITS children via `/api/trace/children/<child-uuid>`. This is the cascading lazy-load per LOCKED chain. `buildChildNode()` creates a node with the same expand/collapse pattern:

```typescript
private buildChildNode(child: { uuid: string; type: string; name: string; hasChildren: boolean }): HTMLElement {
  const cnode = document.createElement('div');
  cnode.className = 'tt-node';
  const crow = document.createElement('div');
  crow.className = 'tt-row';
  const citem = document.createElement('rb-object-item');
  citem.setAttribute('ref', `${child.type.toLowerCase()}:${child.uuid}`);
  citem.setAttribute('type', child.type.toLowerCase());
  citem.setAttribute('title', child.name || child.uuid);
  
  if (child.hasChildren) {
    citem.setAttribute('has-children', '');
    const ckids = document.createElement('div');
    ckids.className = 'tt-children';
    ckids.style.display = 'none';  // collapsed
    
    // Lazy-load on expand
    crow.addEventListener('click', async () => {
      if (ckids.style.display === 'none' && ckids.children.length === 0) {
        // First expand: fetch children
        const res = await fetch(`/api/trace/children/${encodeURIComponent(child.uuid)}`);
        const data = await res.json();
        for (const grandchild of (data.children || [])) {
          ckids.appendChild(this.buildChildNode(grandchild));
        }
      }
      ckids.style.display = ckids.style.display === 'none' ? '' : 'none';
      citem.toggleAttribute('children-open');
    });
    
    cnode.appendChild(crow.appendChild(citem) && crow);
    cnode.appendChild(ckids);
  } else {
    crow.appendChild(citem);
    cnode.appendChild(crow);
  }
  
  return cnode;
}
```

### Summary: 2 Fixes for Expert (R-M3d + R-M3e)

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| R-M3d | DetailView doesn't auto-open | setTimeout(100) races renderSeed async | Event-driven: `seed-ready` event, navigate after |
| R-M3e | 51 children pre-expanded | renderSeed shows all children visible | Start collapsed; lazy-load on first expand click; cascading buildChildNode for deeper levels |

### R-M3d: Detail-View Navigation → Tree Auto-Scroll + Selection State (PO fold 2026-06-03)

**Current:** Tree has NO concept of "selected node." When a DetailView opens (via click or `/scenario?ior=`), the tree doesn't highlight or scroll to the corresponding item. User loses context between tree and detail.

**Applies to BOTH `/trace` and `/scenario`.**

#### Selection State on `rb-object-item`

Add `selected` attribute + CSS:

```typescript
// rb-object-item.ts — add to observedAttributes:
static get observedAttributes() { return ['ref', 'type', 'title', 'name', 'description', 'status', 'selected']; }
```

```css
/* app.css — selected tree item */
rb-object-item[selected] {
  background: rgba(102, 126, 234, 0.15);
  border-left: 3px solid #667eea;
  padding-left: 5px;
}
```

#### Tree Tracks Selected Node

```typescript
// rb-trace-tree.ts — add selection tracking:
private selectedRef: string | null = null;

/** Select a node: highlight it, scroll into view, deselect previous */
select(ref: string): void {
  // Deselect previous
  if (this.selectedRef) {
    const prev = this.querySelector(`rb-object-item[ref="${this.selectedRef}"]`);
    prev?.removeAttribute('selected');
  }
  
  // Select new
  this.selectedRef = ref;
  const item = this.querySelector(`rb-object-item[ref="${ref}"]`);
  if (item) {
    item.setAttribute('selected', '');
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
```

#### Wire to Navigation Events

When a DetailView opens (via `navigate()` → VerbRegistry handler → drawer shows), notify the tree:

```typescript
// trace/index.ts or TraceRouter — after navigate resolves:
const tree = document.querySelector('rb-trace-tree') as RbTraceTree;
if (tree && params.uuid) {
  tree.select(params.uuid);
}
```

Also wire for `/scenario?ior=` initial load:

```typescript
// scenario-view.ts — after data-seed-ior tree renders:
requestAnimationFrame(() => {
  const tree = document.querySelector('rb-trace-tree') as any;
  tree?.select(ior);
});
```

#### ViewBus Integration (existing pattern)

Subscribe the tree to ViewBus `navigate` events so selection stays in sync when user clicks chain-links inside DetailViews:

```typescript
// rb-trace-tree.ts connectedCallback — ADD:
this.unsub = ViewBus.subscribe('navigate', (data: { ref: string }) => {
  if (data.ref) this.select(refUuid(data.ref));
});
```

### AC (architect-proposed — updated with R-M3d)
- [ ] R-M1: Drawer clears stale "No view for ?.?" on tree navigation; placeholder is actionable text (not cryptic)
- [ ] R-M2: Swipe-down works from top 60px of drawer on mobile (not just tiny handle); handle hidden on desktop split
- [ ] R-M3: `/scenario?ior=<uuid>` serves scenario.html; tree seeded from single instance; lazy-loads children per LOCKED chain; STATIC_SHELL entry in sw.js
- [ ] R-M3b: `.scenario.json` clicks (file-browser + /md/ 302) route to `/scenario?ior=` not `/trace?ior=`
- [ ] **R-M3d: Tree auto-scrolls + highlights selected node on detail-view navigation (both /trace and /scenario)**
- [ ] R-M4: All drawer child content width-capped at drawer width; no horizontal overflow on mobile
- [ ] Rule-pair (a)+(b)+(c): version bump + CACHE_NAME bump + STATIC_SHELL entry for /scenario

## Requirement UUIDs (planner — fresh v4 via uuidgen)

- **R-M1** `[requirement:uuid:5d34db40-d4d6-4dea-9513-4cbff01175c5]` — drawer stale "No view" placeholder cleanup
- **R-M2** `[requirement:uuid:c970f251-2e1f-405d-955c-218f7040a983]` — drawer swipe-dismiss touch area
- **R-M3** `[requirement:uuid:cc673ef3-9581-4143-a978-bd734589c594]` — new /scenario route, IOR-seeded lazy tree
- **R-M4** `[requirement:uuid:fa1bd28e-1960-4a42-bc5e-909c5f0ad1c1]` — drawer child width-cap on mobile
- **R-M3d** `[requirement:uuid:8832a890-ca92-4cfc-97c9-c81dff3ea1b1]` — drawer nav must scroll tree to selected element (folded into T174 per PO 2026-06-03; req-eng captured in `f12ccec0`)
- **R-M3e** `[requirement:uuid:a591c117-3b62-42bb-bfef-8dc49b83e868]` — /scenario interactions must match /trace parity (event wiring); folded into T174 per PO 2026-06-03 (R-M3d precedent); req-eng captured in `6f7614eb`, architect designed in `54ab4f35`

(req-eng owns formal Requirement scenario units anchored to verbatim Tron quotes from `acae0ffe` + `f12ccec0`; planner pre-seeds these v4s so the chain is wireable.)

## Subtasks
None (atomic task — architect explicitly chose ONE consolidated task: "All 4 atoms touch the drawer/view layer and share the same commit surface. Splitting would create 4 version bumps for what is one coherent UX pass.")

## QA Audit & User Feedback
- 2026-06-03: req-eng `acae0ffe` captures Tron verbatim quotes for R-M1/M2/M3/M4 (compound source).
- 2026-06-03: PO directs stand-up T174 covering R-M1/M2/M3/M4 ("or split per planner's call").
- 2026-06-03: Architect `483d1587` ships consolidated design (R-M1 placeholder + R-M2 touch-area + R-M3 /scenario route + R-M4 width-cap). Recommends ONE task; shared drawer/view commit surface.
- 2026-06-03: Planner initial split scaffold ea88de12 (T174 + T175) RECONCILED — adopted architect's bundle per learning #20; my T174/T175 scaffolds removed; this file's fake-suffix uuid swapped for real v4; Subtasks + QA Audit + Requirement UUIDs sections added for audit compliance.
- 2026-06-03: Expert `2eb4dab1` ships v0.5.71 (R-M1+M2+M3+M4). Rule-pair (a)+(b)+(c) verified ✓ ((c) STATIC_SHELL: /scenario + dist/scenario-view-5CKNEWVS.js added).
- 2026-06-03: Tron caught R-M3 bug — `/scenario?ior=X` shows full tree, ignores `?ior=`. Architect diagnosed `4845bd8b` then `da163dc3` (2-layer root: Task ior=0 children). req-eng `f12ccec0` captured **R-M3d** new atom: drawer navigation must scroll tree to selected element.
- 2026-06-03: PO direction — **R-M3d FOLDS into T174** (architect bundle pattern: same drawer/view surface, one fix-cycle). Expert ships single-IOR-seed + Task-children + R-M3d scroll-into-view together; tester re-verifies all in one pass. R-M3d req:uuid `8832a890-…` added.
- 2026-06-03: Expert `d0796bf4` v0.5.72 ships fix-cycle PART 1: scenario-view.ts removes /api/trace full-graph fetch + uses data-seed-ior; rb-trace-tree.ts renderSeed() fetches /api/trace/children/<uuid>; scanRepo fallback for empty/string index arrays (bridges until T172 forward-ref data complete); 834/834. Rule-pair (a)+(b)+(c) ✓ verified (STATIC_SHELL trace-page-RA6MM7J4 + scenario-view-TOZZ2MDV).
- 2026-06-03: ⚠️ Planner grep-verified — **R-M3d scroll-into-view NOT in v0.5.72** (no `scrollIntoView`/`select()` in shipped rb-trace-tree.ts/rb-object-item.ts). PO direction was "ship together"; expert shipped IOR-seed + Task-children but R-M3d still pending. Honest board: T174 ✅ shipped (v0.5.72), R-M3d open.
- 2026-06-03: Tron caught ANOTHER atom — **R-M3e**: /scenario interactions dead (event wiring missing). req-eng captured `6f7614eb` (must match /trace parity); architect designed fix `54ab4f35`.
- 2026-06-03: PO direction CONFIRMED — **R-M3e FOLDS into T174** (R-M3d precedent; same drawer/view surface). T174 NOT done until BOTH R-M3d (scroll-into-view) + R-M3e (interaction parity) ship + verify. T174 stays open. R-M3e req:uuid `a591c117-3b62-42bb-bfef-8dc49b83e868` planner-pre-seeded.
- Pending: expert R-M3d scroll-into-view + R-M3e event-wiring fix commits (rule-pair (a)+(b); (c) likely exempt — fixes existing /scenario surface). Tester one-pass re-verify R-M1..R-M4 + R-M3d + R-M3e ACs. Then Tron QA.

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
**Phase:** 30 — R-M (drawer UX + /scenario route)
**Owners (CMM4):** robbin-req `acae0ffe` (verbatim capture) → robbin-architect `483d1587` (design) → robbin-expert (impl; rule-pair (a)+(b)+(c)) → robbin-tester (verify R-M1..R-M4 ACs)
**Consolidated:** 4 atoms in 1 task (shared drawer/view commit surface — architect's call)
