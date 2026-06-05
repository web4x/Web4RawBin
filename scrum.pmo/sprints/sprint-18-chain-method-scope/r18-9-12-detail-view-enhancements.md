# R18.9-12: Detail-View Enhancements — Full Object + Parent + Browse-File + Source Line

**Source:** Tron S18 Follow-on C (via robbin-po 2026-06-05).
**Author:** robbin-architect

---

## R18.9: Detail-pane renders FULL object (ALL methods/children)

### Problem
The detail-pane currently renders from the same forward-walk data as the narrowed tree. When the tree narrows (UC.method → ONE method), the detail-pane ALSO shows only that one method. But Tron wants: tree narrows, detail-pane shows the FULL object.

### Design
Separate the detail-pane's data source from the tree walker:

```
TREE (narrowed):  UC → ONE method (TRACE_FORWARD)
DETAIL-PANE:      UC → ALL methods (SCENARIO_FORWARD — full object)
```

**Implementation:**

When a node is clicked in the tree:
1. Tree highlight stays narrowed (one method)
2. Detail-pane fetches `/api/trace/children/<uuid>?mode=scenario` (fan-out — ALL children)
3. Detail-pane renders ALL methods, ALL classes, ALL children — the full object model

**Per-file changes:**

| File | Change |
|------|--------|
| `rb-detail-drawer.ts` | When rendering a node's children section, fetch with `?mode=scenario` (not the tree's `?mode=trace`) |
| `rb-*-detail.ts` (all 6) | Render ALL forward children from scenario mode, not the narrowed trace mode |
| No server change | `/api/trace/children` already supports `?mode=scenario` vs `?mode=trace` |

---

## R18.10: Parent link resolves ownerIor

### Current state
Scenario units have `ownerIor` field:
- Class: `ownerIor: ior:instance:<Sprint-uuid>` (Sprint that owns this class)
- Method: `ownerIor: ior:instance:<Class-uuid>` (Class that owns this method)
- UseCase: `ownerIor: ior:instance:<Sprint-uuid>`
- Implementation: `ownerIor: null` (most missing)

### Design
Add a "Parent" link in each detail-view that resolves `ownerIor` to a clickable navigation:

```typescript
// In each rb-*-detail.ts render():
const ownerIor = scenario.ownerIor;
if (ownerIor) {
  const ownerUuid = ownerIor.replace('ior:instance:', '');
  const owner = idx.get(ownerUuid);
  // Render: "Parent: <Type> <Name>" as clickable link
  html += `<div class="dv-parent">
    <label>Parent</label>
    <a data-ref="${owner.type.toLowerCase()}:${ownerUuid}">${owner.name}</a>
  </div>`;
}
```

**Data requirement:** `ownerIor` must be populated on ALL scenario units. Currently missing on Implementation units. Fill: set `Implementation.ownerIor = ior:instance:<Method-uuid>` (the Method whose implementations[] includes this Impl).

**Per-file changes:**

| File | Change |
|------|--------|
| `rb-*-detail.ts` (all 6) | Add "Parent" section from `ownerIor` |
| `/api/trace/children` | Include `ownerIor` in response for each child |
| Scenario index | Populate `Implementation.ownerIor` (pipeline pass) |

---

## R18.11: Browse-File link → file-browser route → Monaco

### Current state
- `rb-task-detail.ts:41` has hardcoded `href="/md/scrum.pmo/sprints/"` (T181 fix pending)
- Class units have `model.file` (e.g., `"rb-detail-view.ts"`) — filename only, no path
- Implementation units: some have `model.sourceFile` (e.g., `"ior:file:src/ts/scenario/types.ts"`)
- UseCase units have `model.source` (inconsistent)

### Design
Each detail-view renders a "Browse source" link that deep-links to the file browser at the unit's source file:

```typescript
// Source file resolution priority:
const sourceFile = unit.model.sourceFile   // "ior:file:src/ts/trace/rb-trace-tree.ts"
                || unit.model.file          // "rb-trace-tree.ts" (filename only → search)
                || unit.model.source;       // legacy field

if (sourceFile) {
  const path = sourceFile.replace('ior:file:', '');
  // Link to file browser: /edit/<path> opens Monaco
  html += `<a href="/edit/${path}" class="dv-file-link">📄 Browse source</a>`;
}
```

**Data requirement:** Populate `model.sourceFile` on all units with `ior:file:<relative-path>` format:
- Class: `ior:file:src/public/ts/trace/rb-trace-tree.ts` (from [class:uuid] marker scan)
- Method: `ior:file:src/public/ts/trace/rb-trace-tree.ts` (same file as class)
- Implementation: `ior:file:src/ts/scenario/types.ts` (from [impl:uuid] marker location)
- UseCase: `ior:file:scrum.pmo/sprints/.../diagrams/s17-usecases.puml` (PUML source)
- Task: `ior:file:scrum.pmo/sprints/.../task-123-*.md` (task file)

Pipeline: scan `src/` and `test/` for `[impl:uuid]`/`[class:uuid]` markers → record the file path → write `model.sourceFile`.

**Per-file changes:**

| File | Change |
|------|--------|
| `rb-*-detail.ts` (all 6) | Render "Browse source" from `model.sourceFile` with `/edit/<path>` href |
| Scenario index | Populate `model.sourceFile` on all units (pipeline) |

---

## R18.12: Source LINE in scenario units → Monaco opens at line

### Current state
No scenario unit carries a source line number. When Monaco opens a file, it starts at line 1.

### Design
Add `model.sourceLine` to scenario units — the line number where the `[impl:uuid]`/`[class:uuid]`/`[uc:uuid]` marker appears in the source file:

```json
{
  "ior": "ior:class:Implementation",
  "model": {
    "uuid": "...",
    "sourceFile": "ior:file:src/public/ts/trace/rb-trace-tree.ts",
    "sourceLine": 9
  }
}
```

**Population pipeline:** When scanning source files for UUID markers, capture the line number:

```typescript
const lines = text.split('\n');
for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(/\[(impl|class|uc|test):uuid:([0-9a-f-]{36})\]/i);
  if (match) {
    const uuid = match[2];
    // Write to scenario unit: sourceFile + sourceLine
    unit.model.sourceFile = `ior:file:${relativePath}`;
    unit.model.sourceLine = i + 1;  // 1-based
  }
}
```

**Monaco integration:** The "Browse source" link includes the line number as a hash fragment:

```typescript
const href = `/edit/${path}#L${line}`;
// Monaco: editor.revealLineInCenter(line); editor.setPosition({lineNumber: line, column: 1});
```

The `/edit/` route's client-side JS reads `location.hash` → `#L42` → calls `editor.revealLineInCenter(42)`.

**Per-file changes:**

| File | Change |
|------|--------|
| Scenario index | Populate `model.sourceLine` on all marker-bearing units (pipeline) |
| `rb-*-detail.ts` | "Browse source" href includes `#L{line}` |
| `edit.ts` | Read `location.hash` → `editor.revealLineInCenter(lineNumber)` |
| `populate-forward-refs.ts` / pipeline | Capture line number during marker scan |

---

## Summary

| Req | What | Data needed | Code change |
|-----|------|-------------|-------------|
| R18.9 | Detail-pane full object | None (use `?mode=scenario`) | Detail-views fetch scenario mode |
| R18.10 | Parent link | `Implementation.ownerIor` populated | Detail-views render ownerIor link |
| R18.11 | Browse-File link | `model.sourceFile` on all units | Detail-views + pipeline |
| R18.12 | Source line → Monaco | `model.sourceLine` on all units | Detail-views + pipeline + edit.ts |

**Priority:** R18.9 (pure client, no data) → R18.10 (small data fill) → R18.11 (pipeline + client) → R18.12 (pipeline + client + edit.ts).

---

**Formulated by:** robbin-architect (2026-06-05)
