[Back to Sprint 17 Planning](./planning.md)

# T173: .scenario.json click → /trace tree + lazy-load (consolidates R-K1 + R-L; covers R-K2 + R-K3)
[task:uuid:7a5f0eb9-7a33-492b-991a-b13c431dc695]

> **PO direction 2026-06-03:** Consolidate R-K1 + R-L into this single task — they
> share root cause (json-click-to-navigate logic in `server.ts:626 jsonHref()`).
> One fix; dual AC; do NOT split. R-K2 + R-K3 are covered by the same design.

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect design — this document)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) — R-K1, R-K2, R-K3, R-L (Tron verbatim, captured by robbin-req)
  - **R-K1** `[requirement:uuid:bd2670a9-e7c2-4dd8-87c5-f349807c1d95]` — clicking a .scenario.json must not be a dead end
  - **R-K2** `[requirement:uuid:a78c8c41-7883-4628-8eb5-36a426e331f2]` — clicking opens it as that instance in the /trace tree
  - **R-K3** `[requirement:uuid:4c621af1-0081-4e8a-ac45-92e49577cfdb]` — lazy-load children cascading down the LOCKED chain
  - **R-L**  `[requirement:uuid:7034b7ee-d2da-45f4-9f54-bdb606d7df2a]` — generated views must never emit dead links (shares root cause with R-K1)
- follows
  - T165 (7-class tree), T166 (Class+Method overlay), T158 (DetailViews), T168 (LOCKED chain)
- down
  - None (atomic task)

## Design (Architect — robbin-architect, 2026-06-03)

### User Flow

```
User in /edit file-browser
  → clicks scenario/index/a/b/c/d/e/<uuid>.scenario.json
    → browser navigates to /trace?ior=<uuid>
      → trace tree expands to that instance
        → detail pane shows its DetailView
          → user clicks a child → lazy-loads that child's children
```

### Part 1: File-Browser Intercept

`src/public/ts/components/rb-file-tree.ts` line 62-65 dispatches `file-select` with `detail.path`. The listener (in the /edit page controller) opens the file in Monaco editor.

**Intercept:** Before opening in editor, check if the file is a `.scenario.json`:

```typescript
// In the file-select listener (edit page controller):
document.addEventListener('file-select', (e: CustomEvent) => {
  const path = e.detail.path;
  
  // T173: .scenario.json click → navigate to /trace
  if (path.endsWith('.scenario.json')) {
    // Extract UUID from filename: <uuid>.scenario.json
    const uuid = path.split('/').pop()?.replace('.scenario.json', '') || '';
    if (uuid && /^[0-9a-f]{8}-/.test(uuid)) {
      window.location.href = `/trace?ior=${encodeURIComponent(uuid)}`;
      return;  // don't open in editor
    }
  }
  
  // Normal: open in editor
  openInEditor(path);
});
```

### Part 2: /trace?ior= Query Param → Tree Expand

`src/public/ts/trace/index.ts` reads the `ior` query param on page load:

```typescript
// trace/index.ts — on mount:
const params = new URLSearchParams(window.location.search);
const targetIor = params.get('ior');

if (targetIor) {
  // 1. Fetch the target unit to know its type
  const res = await fetch(`/api/ior/${encodeURIComponent(targetIor)}`);
  const unit = await res.json();
  
  // 2. Find the requirement root for this unit (walk up via ancestry)
  const ancestry = await fetchAncestry(targetIor);  // NEW endpoint
  
  // 3. Expand the tree from root to this instance
  traceTree.expandPath(ancestry);
  
  // 4. Select and show DetailView
  traceTree.select(targetIor);
}
```

### Part 3: Lazy-Load Children at Each Click (LOCKED Chain)

Current `rb-trace-tree.ts` loads the full graph from `/api/trace` on mount. At 297 units / ~400KB, this is acceptable for desktop but slow for mobile first-paint.

**Lazy-load design:** Replace full-graph load with per-node children fetch:

#### New Endpoint: `/api/trace/children/<uuid>`

```typescript
// server.ts — new endpoint:
if (filepath.startsWith('/api/trace/children/')) {
  const uuid = filepath.slice('/api/trace/children/'.length);
  const scenarioDir = path.join(__dirname, '../../../scenario/index');
  const idx = new ScenarioIndex(scenarioDir);
  const unit = idx.get(uuid);
  if (!unit) { res.writeHead(404); res.end('{}'); return; }
  
  // Return this unit + its direct children (one hop only)
  const type = (unit.ior || '').split(':')[2];
  const FORWARD_KEYS: Record<string, string[]> = {
    'Requirement': ['tasks'],
    'Task': ['subtasks', 'useCases'],
    'UseCase': ['classes'],
    'Class': ['methods'],
    'Method': ['implementations'],
    'TraceLink': ['tests'],
  };
  
  const childRefs: string[] = [];
  for (const key of (FORWARD_KEYS[type] || [])) {
    const refs = unit.model[key] || [];
    childRefs.push(...refs);
  }
  
  // Load child summaries (name + type only — not full model)
  const children = childRefs.map(ref => {
    const child = idx.get(ref);
    return child ? {
      uuid: ref,
      type: (child.ior || '').split(':')[2],
      name: child.model?.name || '',
      hasChildren: hasForwardRefs(child),
    } : null;
  }).filter(Boolean);
  
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
  res.end(JSON.stringify({ uuid, type, name: unit.model?.name, children }));
  return;
}
```

#### New Endpoint: `/api/trace/ancestry/<uuid>`

Returns the path from a Requirement root down to this UUID (for tree expansion):

```typescript
if (filepath.startsWith('/api/trace/ancestry/')) {
  const uuid = filepath.slice('/api/trace/ancestry/'.length);
  const scenarioDir = path.join(__dirname, '../../../scenario/index');
  const idx = new ScenarioIndex(scenarioDir);
  
  // BFS from all requirements to find the path to this UUID
  const requirements = idx.listByType('Requirement');
  for (const reqUuid of requirements) {
    const path = findPathTo(idx, reqUuid, uuid);
    if (path) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ancestry: path }));
      return;
    }
  }
  
  // Orphan — no path from any requirement
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ancestry: [uuid], orphan: true }));
  return;
}
```

#### Tree Builder: Lazy on Expand

```typescript
// rb-trace-tree.ts — replace full-graph mount with lazy root load:
async render(): Promise<void> {
  // Load only requirement roots initially
  const res = await fetch('/api/trace/roots');
  const roots = await res.json();  // [{uuid, type, name, hasChildren}]
  
  this.innerHTML = '';
  for (const root of roots) {
    this.appendChild(this.lazyNode(root, 0));
  }
}

// On expand click: fetch children for that node
private async expandNode(uuid: string, container: HTMLElement): Promise<void> {
  const res = await fetch(`/api/trace/children/${uuid}`);
  const data = await res.json();
  
  container.innerHTML = '';
  for (const child of data.children) {
    container.appendChild(this.lazyNode(child, /* depth + 1 */));
  }
}
```

### Part 4: /api/trace/roots — Requirement Roots Only

```typescript
if (filepath === '/api/trace/roots') {
  const scenarioDir = path.join(__dirname, '../../../scenario/index');
  const idx = new ScenarioIndex(scenarioDir);
  const roots = idx.listByType('Requirement').map(uuid => {
    const u = idx.get(uuid);
    return { uuid, type: 'Requirement', name: u?.model?.name || '', hasChildren: (u?.model?.tasks?.length || 0) > 0 };
  });
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
  res.end(JSON.stringify(roots));
  return;
}
```

### Performance Analysis

| Approach | First paint | Per-click | Total data |
|----------|------------|-----------|------------|
| Full graph (current) | ~400KB, 1 request | 0 (all loaded) | 400KB |
| Lazy-load (T173) | ~5KB (55 roots), 1 request | ~1KB per expand | ~50KB for a typical walk |

Mobile: 8x faster first paint. Desktop: slightly more requests but each is tiny.

### Fallback: Full Graph Still Available

Keep `/api/trace` returning the full graph for tools that need it (trace-cli, audit). The browser switches to lazy-load. No breaking change.

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/ts/server/server.ts` | Add `/api/trace/children/<uuid>`, `/api/trace/ancestry/<uuid>`, `/api/trace/roots` |
| `src/public/ts/components/rb-file-tree.ts` | Intercept `.scenario.json` click → navigate to `/trace?ior=` |
| `src/public/ts/trace/index.ts` | Read `?ior=` param, fetch ancestry, expand path |
| `src/public/ts/trace/rb-trace-tree.ts` | Replace full-graph mount with lazy root + per-expand fetch |
| `package.json` + `sw.js` | Rule-pair (a)+(b) |

STATIC_SHELL (c): exempt — no new HTML route (uses existing `/trace` with query param).

### Concrete Repro: Tron's Broken Sprint Link (R-K1)

**Steps:**
1. Open `/edit` → file browser → navigate to `scenario/sprints.json/sprint-15/`
2. See `sprint-traceability-browser.json 🔗 ✏️`
3. Click the `🔗` link
4. Navigates to `/md/scenario/sprints.md/task/sprint-traceability-browser.md` → **404**

**Root cause — TWO bugs in `server.ts:626`:**

```typescript
// server.ts line 626 — jsonHref():
const jsonHref = (e: any) => {
  const m = relPath.match(/^scenario\/sprints\.json\/([^/]+)\//);
  if (m && e.name.endsWith('.json')) {
    const slug = e.name.replace('.scenario.json', '').replace('.json', '');
    return `/md/scenario/sprints.md/task/${slug}.md`;  // ← BUG 1 + BUG 2
  }
  return `/md/${relPath}${e.name}`;
};
```

**Bug 1:** Hardcodes `task/` subdirectory for ALL `.json` files. Sprint scenario JSONs should resolve to `sprint/<slug>.md`, UC JSONs to `usecase/<slug>.md`, etc. The actual file lives at `scenario/sprints.md/sprint/sprint-traceability-browser.md`, not `task/`.

**Bug 2:** The `.json → .md` rewrite itself is wrong for `.scenario.json` files. Per T173 design, `.scenario.json` clicks should navigate to `/trace?ior=<uuid>` — not to any `/md/` path. The `.md` view is a generated artifact; the `/trace` tree is the canonical navigation surface.

**Also affected:** `renderChainLinkHtml()` (templates.ts:72) has the same `task/` hardcoding as fallback:
```typescript
return `<a href="/md/scenario/sprints.md/task/${uuid}.md" ...`;  // fallback: always task/
```

### Fix Specification (consolidated)

#### Fix 1: `jsonHref()` → `/trace?ior=` for `.scenario.json`

```typescript
// server.ts line 626 — REPLACE:
const jsonHref = (e: any) => {
  const m = relPath.match(/^scenario\/sprints\.json\/([^/]+)\//);
  if (m && e.name.endsWith('.scenario.json')) {
    // T173: .scenario.json → open in /trace tree (not /md/ rewrite)
    const uuid = e.name.replace('.scenario.json', '');
    return `/trace?ior=${encodeURIComponent(uuid)}`;
  }
  if (m && e.name.endsWith('.json')) {
    const slug = e.name.replace('.json', '');
    return `/md/${relPath}${e.name}`;  // non-scenario JSON: open raw
  }
  return `/md/${relPath}${e.name}`;
};
```

#### Fix 2: `renderChainLinkHtml()` fallback — use type from IOR, not hardcoded `task/`

```typescript
// templates.ts line 68-72 — REPLACE fallback:
function renderChainLinkHtml(ior: string, resolve?: SlugResolver): string {
  const uuid = ior.replace('ior:instance:', '');
  const info = resolve?.(uuid);
  if (info) return `<a href="/md/scenario/sprints.md/${info.type}/${info.slug}.md" class="chain-link">🔗 ${esc(info.name)}</a>`;
  // Fallback: link to /trace tree instead of guessing /md/ path
  return `<a href="/trace?ior=${encodeURIComponent(uuid)}" class="chain-link">🔗 ${esc(uuid.slice(0, 8))}</a>`;
}
```

Same fix for `renderChainLinkMd()` (line 61-65):
```typescript
// Fallback: link to /trace instead of ../sprints.md/task/
return `[🔗 ${uuid.slice(0, 8)}](/trace?ior=${encodeURIComponent(uuid)})`;
```

### Additional Files (beyond Part 1-4)

| File | Change |
|------|--------|
| `src/ts/server/server.ts:626` | `jsonHref()` → `/trace?ior=` for `.scenario.json` |
| `src/ts/scenario/templates.ts:65,72` | Fallback chain links → `/trace?ior=` instead of hardcoded `task/` |

### Acceptance Criteria (R-K1 + R-L dual; covers R-K2 + R-K3)

**R-K1 + R-L (shared root: json-click-to-navigate / dead-link prevention):**
- [ ] AC1 (R-K1+R-L) — Clicking `.scenario.json` in file-browser navigates to `/trace?ior=<uuid>` (NOT `/md/.../task/...`)
- [ ] AC2 (R-L) — Clicking Sprint `.scenario.json` does NOT 404 (Tron repro: `/md/scenario/sprints.md/task/sprint.md` "File not found")
- [ ] AC3 (R-L) — `renderChainLinkHtml`/`renderChainLinkMd` fallback (no slug resolver match) routes to `/trace?ior=` not hardcoded `task/`
- [ ] AC4 (R-L) — No generated view emits a dead href; every link resolves (chain-link audit clean)

**R-K2 (open in /trace tree at that instance):**
- [ ] AC5 (R-K2) — `/trace?ior=<uuid>` expands tree from a Requirement root down to that instance
- [ ] AC6 (R-K2) — Detail pane shows the targeted instance's DetailView on load

**R-K3 (lazy-load down the LOCKED chain):**
- [ ] AC7 (R-K3) — Tree loads only Requirement roots on first paint (~5KB, 55 summaries)
- [ ] AC8 (R-K3) — Expanding a node fetches children lazily via `/api/trace/children/<uuid>`
- [ ] AC9 (R-K3) — Every child fetch follows LOCKED chain order (T168 CANONICAL_WALK: req→task→useCase→class→method→implementation→test)

**Backwards-compat + ship rules:**
- [ ] AC10 — Full `/api/trace` endpoint preserved for tools (trace-cli, audit) — no breaking change
- [ ] AC11 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump; (c) STATIC_SHELL exempt (no new HTML route — reuses `/trace` with `?ior=`)
- [ ] AC12 — `npm run build` clean; full test suite passes

## Subtasks
None (atomic task — one consolidated fix per PO direction 2026-06-03).

## QA Audit & User Feedback
- 2026-06-03: Tron verbatim — R-K1 "clicking on the sprint.json currently ends in a dead end"; R-K2 "instead open it as a sprint item view in the traceability tree view"; R-K3 lazy-load cascade; R-L "still shows File not found". Captured by robbin-req in `compound-requirement-source-2.md`.
- 2026-06-03: PO refinement — R-K1 + R-L share root cause (json-click-to-navigate). Consolidate into single task with dual AC (this T173).
- 2026-06-03: Architect (3f9ff04) — design complete (Parts 1-4 + Concrete Repro + Fix Specification covering jsonHref + chain-link fallback).
- Pending: expert impl (rule-pair (a)+(b)), tester verification (R-K1+R-L+R-K2+R-K3 ACs), then Tron QA.

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
**Owners (CMM4):** robbin-req (R-K1/K2/K3/L capture) → robbin-architect (design, 3f9ff04) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (verify ACs)
**R-K1 + R-L:** consolidated — no dead-end links from file-browser, chain-link fallbacks, or any generated view

### Second Repro: T110 Link from Sprint Overview (R-L family)

**Steps:**
1. Open `/md/scenario/sprints.md/sprint/sprint-traceability-ux.md`
2. See "Traceability Tasks: 🔗 T110: DetailViewContainer..."
3. Click → navigates to relative path `../sprints.md/task/task-110-detailview-container.md`
4. Resolves to `/md/scenario/sprints.md/sprints.md/task/...` → **404 (double sprints.md)**

**Root cause — `templates.ts:64`:**

```typescript
// Line 64 — MD chain link (with slug resolver match):
if (info) return `[🔗 ${info.name}](../sprints.md/${info.type}/${info.slug}.md)`;
```

The relative path `../sprints.md/task/...` is wrong. Generated views live at `scenario/sprints.md/<type>/<slug>.md`. From `sprint/x.md`, `..` goes to `sprints.md/`, then `sprints.md/` prefix doubles it → `sprints.md/sprints.md/`.

**Fix:** Drop the redundant `sprints.md/` from the relative path — views are siblings within the `sprints.md/` tree:

```typescript
// BEFORE (line 64):
if (info) return `[🔗 ${info.name}](../sprints.md/${info.type}/${info.slug}.md)`;

// AFTER — sibling navigation within sprints.md/:
if (info) return `[🔗 ${info.name}](../${info.type}/${info.slug}.md)`;
```

From `sprint/x.md`, `../task/task-110.md` resolves correctly to `sprints.md/task/task-110.md`.

**Same fix for fallback (line 65):**
```typescript
// BEFORE:
return `[🔗 ${uuid.slice(0, 8)}](../sprints.md/task/${uuid.slice(0, 8)}.md)`;

// AFTER (per earlier T173 fix — fallback routes to /trace):
return `[🔗 ${uuid.slice(0, 8)}](/trace?ior=${encodeURIComponent(uuid)})`;
```

### ALL Generated Task Links — Single Fix Point

The `renderChainLinkMd()` function (templates.ts:61-65) is called by `renderChainSection()` (line 76) which ALL 7 class templates use. Fixing it ONCE fixes all 296 generated views.

**Updated files list (cumulative T173):**

| File | Change | Bug |
|------|--------|-----|
| `src/ts/server/server.ts:626` | `jsonHref()` → `/trace?ior=` for `.scenario.json` | Sprint JSON 404 |
| `src/ts/scenario/templates.ts:64` | `../sprints.md/${type}/` → `../${type}/` | Double sprints.md in MD links |
| `src/ts/scenario/templates.ts:65` | Fallback → `/trace?ior=` | Hardcoded task/ fallback |
| `src/ts/scenario/templates.ts:72` | Fallback → `/trace?ior=` | Hardcoded task/ fallback |
| `src/public/ts/trace/index.ts` | Read `?ior=` param, expand tree | New: lazy-load entry |
| `src/public/ts/trace/rb-trace-tree.ts` | Lazy root + per-expand | New: lazy-load tree |
| `src/ts/server/server.ts` | Add `/api/trace/children/`, `/ancestry/`, `/roots` | New: lazy-load endpoints |
| `src/public/ts/components/rb-file-tree.ts` | `.scenario.json` intercept | New: file-browser route |
| `package.json` + `sw.js` | Rule-pair (a)+(b) | |

**After fix:** ALL 296 generated view files have correct relative links. No regeneration needed — the templates emit correct paths on next view generation cycle.
