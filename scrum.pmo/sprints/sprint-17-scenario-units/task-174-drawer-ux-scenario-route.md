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
| `src/public/ts/trace/rb-trace-tree.ts` | Close drawer if no handler (R-M1); `data-seed-ior` attribute (R-M3) | R-M1, R-M3 |
| `src/public/ts/trace/rb-detail-drawer.ts:54` | Expand swipe touch area to top 60px (R-M2) | R-M2 |
| `src/public/app.css` | Mobile handle enlargement (R-M2); drawer child width-cap (R-M4); notfound style (R-M1) | R-M1, R-M2, R-M4 |
| `src/public/scenario.html` | CREATE — STATIC_SHELL for /scenario route | R-M3 |
| `src/public/ts/scenario-view.ts` | CREATE — entry point, seeds tree from ?ior= | R-M3 |
| `src/ts/server/server.ts` | Add `/scenario` route handler | R-M3 |
| `src/public/sw.js` | Add `/scenario` to STATIC_SHELL + bump CACHE_NAME | R-M3 (c) |
| `package.json` | Bump version (rule-pair (a)) | All |
| esbuild config | Add `scenario-view.ts` entry point → `dist/scenario.js` | R-M3 |
| `src/ts/server/server.ts:626` + `templates.ts:65,72` | Change `/trace?ior=` → `/scenario?ior=` for .scenario.json clicks | R-M3 (updates T173) |

### AC (architect-proposed)
- [ ] R-M1: Drawer clears stale "No view for ?.?" on tree navigation; placeholder is actionable text (not cryptic)
- [ ] R-M2: Swipe-down works from top 60px of drawer on mobile (not just tiny handle); handle hidden on desktop split
- [ ] R-M3: `/scenario?ior=<uuid>` serves scenario.html; tree seeded from single instance; lazy-loads children per LOCKED chain; STATIC_SHELL entry in sw.js
- [ ] R-M3b: `.scenario.json` clicks (file-browser + /md/ 302) route to `/scenario?ior=` not `/trace?ior=`
- [ ] R-M4: All drawer child content width-capped at drawer width; no horizontal overflow on mobile
- [ ] Rule-pair (a)+(b)+(c): version bump + CACHE_NAME bump + STATIC_SHELL entry for /scenario

## Requirement UUIDs (planner — fresh v4 via uuidgen)

- **R-M1** `[requirement:uuid:5d34db40-d4d6-4dea-9513-4cbff01175c5]` — drawer stale "No view" placeholder cleanup
- **R-M2** `[requirement:uuid:c970f251-2e1f-405d-955c-218f7040a983]` — drawer swipe-dismiss touch area
- **R-M3** `[requirement:uuid:cc673ef3-9581-4143-a978-bd734589c594]` — new /scenario route, IOR-seeded lazy tree
- **R-M4** `[requirement:uuid:fa1bd28e-1960-4a42-bc5e-909c5f0ad1c1]` — drawer child width-cap on mobile

(req-eng owns formal Requirement scenario units anchored to verbatim Tron quotes from `acae0ffe`; planner pre-seeds these v4s so the chain is wireable.)

## Subtasks
None (atomic task — architect explicitly chose ONE consolidated task: "All 4 atoms touch the drawer/view layer and share the same commit surface. Splitting would create 4 version bumps for what is one coherent UX pass.")

## QA Audit & User Feedback
- 2026-06-03: req-eng `acae0ffe` captures Tron verbatim quotes for R-M1/M2/M3/M4 (compound source).
- 2026-06-03: PO directs stand-up T174 covering R-M1/M2/M3/M4 ("or split per planner's call").
- 2026-06-03: Architect `483d1587` ships consolidated design (R-M1 placeholder + R-M2 touch-area + R-M3 /scenario route + R-M4 width-cap). Recommends ONE task; shared drawer/view commit surface.
- 2026-06-03: Planner initial split scaffold ea88de12 (T174 + T175) RECONCILED — adopted architect's bundle per learning #20; my T174/T175 scaffolds removed; this file's fake-suffix uuid swapped for real v4; Subtasks + QA Audit + Requirement UUIDs sections added for audit compliance.
- Pending: expert impl (rule-pair (a)+(b)+(c) — STATIC_SHELL required for /scenario route per learning #16), tester verifies R-M1..R-M4 ACs, then Tron QA.

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
**Phase:** 30 — R-M (drawer UX + /scenario route)
**Owners (CMM4):** robbin-req `acae0ffe` (verbatim capture) → robbin-architect `483d1587` (design) → robbin-expert (impl; rule-pair (a)+(b)+(c)) → robbin-tester (verify R-M1..R-M4 ACs)
**Consolidated:** 4 atoms in 1 task (shared drawer/view commit surface — architect's call)
