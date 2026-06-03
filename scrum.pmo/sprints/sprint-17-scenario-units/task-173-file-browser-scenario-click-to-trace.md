[Back to Sprint 17 Planning](./planning.md)

# T173: File-browser .scenario.json click → /trace tree at that instance + lazy-load children
[task:uuid:b2c3d4e5-f6a7-4890-bcde-173000000001]

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
- follows
  - T165 (7-class tree), T166 (Class+Method overlay), T158 (DetailViews), T168 (LOCKED chain)

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

### AC (architect-proposed, pending planner formalization)
- [ ] Clicking `.scenario.json` in file-browser navigates to `/trace?ior=<uuid>`
- [ ] `/trace?ior=<uuid>` expands tree from root to that instance
- [ ] Tree loads only roots on first paint (55 Requirement summaries, ~5KB)
- [ ] Expanding a node fetches children lazily via `/api/trace/children/<uuid>`
- [ ] Every child fetch follows LOCKED chain order (T168 CANONICAL_WALK)
- [ ] Detail pane shows the targeted instance's DetailView on load
- [ ] Full `/api/trace` endpoint preserved for tools (no breaking change)
- [ ] Rule-pair (a)+(b)

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
