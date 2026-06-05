# Narrowing Bugs Diagnosis + R18.13-15 Design

**Author:** robbin-architect (2026-06-05)

---

## Narrowing Bug 1: Detail-view "Traceability Chain" shows ALL methods

### Root cause
`rb-class-detail.ts:28`: `const links = forwardOnly(obj)` uses `forward-only.ts` FORWARD_KEYS which maps `class: ['methods']` (PLURAL). This returns ALL 7 methods of RbObjectItem — identical to "All children."

`forwardOnly()` has NO narrowing context — it doesn't know which UC led here, so it can't filter to the one relevant method.

### Fix
The "Traceability Chain" section needs the NARROWED chain (one method matching the UC that led here). Two data sources per R18.9:

- "Traceability Chain" section: fetch `/api/trace/children/<uuid>?mode=trace` → shows ONE method (the UC's verb-matched method)
- "All children" section: fetch `/api/trace/children/<uuid>?mode=scenario` → shows ALL methods

**Per-file change:**
```typescript
// rb-class-detail.ts — replace forwardOnly(obj) with trace-mode fetch
const traceChildren = await fetch(`/api/trace/children/${obj.uuid}?mode=trace`);
// Render traceChildren in "Traceability Chain" (narrowed)
// Render scenarioChildren in "All children" (full — already done by fetchDetailData)
```

---

## Narrowing Bug 2: Tree picks wrong method + stops at Method

### Root cause (wrong method)
`TRACE_FWD` on server.ts:553: `Class: ['method']` reads `Class.method` (singular field). But `Class.method` is GLOBAL — it was populated by the T187 verb-matching pipeline as a single value per Class. If RbObjectItem is shared by 11 UCs, `Class.method` = the LAST UC's verb match (e.g., `.render`), not the CURRENT UC's verb (`.drag`).

`Class.method` cannot narrow per-UC because it's one value per Class, not per-UC-context.

### Root cause (stops at Method)
`TRACE_FWD`: `Method: ['implementation']` reads `Method.implementation` (singular). After T197 cleanup, 66 Methods had their implementation fields stripped (were pointing to Task UUIDs). Many now have empty `implementation` — chain stops.

The server fallback (server.ts:572-584) is type-checked (T194) so it correctly returns 0 children instead of wrong-type children. But the chain still dead-ends.

### Fix (wrong method)
The narrowing must come from the **UC**, not the Class. When the tree expands a Class that's under a UC, the correct method is `UC.method`, not `Class.method`.

**Solution: client-side context propagation.** The tree client already knows which UC it expanded. When rendering a UC's children in trace mode:

1. Server returns UC's children: `{class: <uuid>, method: <uuid>}` — BOTH the class (context) and method (narrowed)
2. Client renders Class as a tree node
3. When Class is expanded, client uses the STORED UC.method (from step 1) instead of fetching `/api/trace/children/<class>?mode=trace`

**Server change:** `/api/trace/children/<uc-uuid>?mode=trace` returns children with a `chainMethod` hint:

```json
{
  "children": [
    {"uuid": "<class-uuid>", "type": "Class", "name": "RbObjectItem", "hasChildren": true,
     "chainMethod": {"uuid": "<method-uuid>", "type": "Method", "name": "RbObjectItem.drag"}}
  ]
}
```

The client uses `chainMethod` when expanding the Class node instead of fetching Class's generic children.

**Client change (rb-trace-tree.ts `buildSeedNode`):** When a child has `chainMethod`, expanding it inserts the chainMethod as the single child (with its own expansion for Impl→Test) instead of fetching `/api/trace/children/<class>`.

### Fix (stops at Method)
The 66 Methods with empty `implementation` need real Implementation links. This is T195 Phase C scope — expert adds `[impl:uuid]` markers in source for these methods' implementations.

### Per-file fix table

| File | Line | Change |
|------|------|--------|
| `server.ts` | 552-553 | UC in trace mode: return `chainMethod` hint alongside class child |
| `rb-trace-tree.ts` | `buildSeedNode` | When child has `chainMethod`, use it on expand instead of fetching |
| `rb-class-detail.ts` | 28 | Replace `forwardOnly(obj)` with trace-mode fetch for "Chain" section |
| `forward-only.ts` | — | No change (still used by other detail views) |

---

## R18.13: Source link on ALL types (extends R18.11/12)

### Current state
- Implementation: some have `model.sourceFile` (e.g., `ior:file:src/ts/scenario/types.ts`)
- Class: have `model.file` (filename only, no path)
- Method/UC/Test/Req/Task: no source location

### Design
Populate `model.sourceFile` + `model.sourceLine` on ALL types via marker scan:

| Type | Source | sourceFile | sourceLine |
|------|--------|-----------|------------|
| Implementation | `[impl:uuid:]` in `src/**/*.ts` | `ior:file:src/path/file.ts` | marker line |
| Class | `[class:uuid:]` in `*.puml` or `src/**/*.ts` | `ior:file:path/file.puml` or `.ts` | marker line |
| Method | Same file as owning Class + method signature search | `ior:file:src/path/file.ts` | method declaration line |
| UseCase | `[uc:uuid:]` in `*.puml` | `ior:file:scrum.pmo/.../diagrams/s17-usecases.puml` | marker line |
| Test | `[test:uuid:]` in `test/**/*.ts` | `ior:file:test/path/file.ts` | marker line |
| Task | `[task:uuid:]` in `scrum.pmo/**/task-*.md` | `ior:file:scrum.pmo/.../task-N-slug.md` | marker line |
| Requirement | `[requirement:uuid:]` in `requirements.md` | `ior:file:scrum.pmo/.../requirements.md` | marker line |

**Pipeline extension:** Add passes to `populate-forward-refs.ts` for each marker type:

```typescript
// For each source/test/puml/md file:
for (const line of text.split('\n')) {
  for (const [marker, iorType] of [
    [/\[impl:uuid:([0-9a-f-]{36})\]/i, 'Implementation'],
    [/\[class:uuid:([0-9a-f-]{36})\]/i, 'Class'],
    [/\[uc:uuid:([0-9a-f-]{36})\]/i, 'UseCase'],
    [/\[test:uuid:([0-9a-f-]{36})\]/i, 'Test'],
    [/\[task:uuid:([0-9a-f-]{36})\]/i, 'Task'],
    [/\[requirement:uuid:([0-9a-f-]{36})\]/i, 'Requirement'],
  ]) {
    const match = line.match(marker);
    if (match) {
      unit.model.sourceFile = `ior:file:${relativePath}`;
      unit.model.sourceLine = lineNumber;
    }
  }
}
```

---

## R18.14: Browse-File → file-browser folder (highlighted), NOT /edit

### Current design (R18.11)
Link goes directly to `/edit/<path>` — skips the file browser.

### Revised design (R18.14)
Link goes to `/md/<dir>/?highlight=<filename>` — the file-browser folder view with the target file HIGHLIGHTED.

```
Browse source: /md/src/public/ts/trace/?highlight=rb-trace-tree.ts
```

**File-browser change:** The `/md/<dir>/` route reads `?highlight=<filename>` query param. If present, the listed file matching that name gets a CSS highlight class (e.g., `background: rgba(255,152,0,0.15); border-left: 3px solid #ff9800`).

**Per-file changes:**

| File | Change |
|------|--------|
| `server.ts` (`/md/` dir handler) | Read `?highlight` param, add `class="highlighted"` to matching `<li>` |
| `rb-*-detail.ts` | "Browse source" href = `/md/<dir>/?highlight=<filename>` |
| `app.css` | `.highlighted` style: orange left-border + subtle bg |

---

## R18.15: Line preserved through browser → editor

### Design
The file-browser's "open in editor" action (the ✏️ icon) passes the source line as a query param:

```
File browser: /md/src/public/ts/trace/?highlight=rb-trace-tree.ts&line=9
  ↓ user clicks ✏️ on rb-trace-tree.ts
Editor: /edit/src/public/ts/trace/rb-trace-tree.ts#L9
```

**Flow:**
1. Detail-view links: `/md/<dir>/?highlight=<file>&line=<N>`
2. File-browser reads `?line` param, stores it in the ✏️ link's href: `/edit/<path>#L{line}`
3. `edit.ts` reads `location.hash` → `editor.revealLineInCenter(N)`

**Per-file changes:**

| File | Change |
|------|--------|
| `server.ts` (`/md/` dir handler) | Read `?line` param, add `#L{line}` to ✏️ icon href |
| `edit.ts` | `const line = parseInt(location.hash.replace('#L',''));` → `editor.revealLineInCenter(line)` |
| `rb-*-detail.ts` | href includes `&line={sourceLine}` |

---

## Summary

| Item | What | Priority |
|------|------|----------|
| Narrowing bug 1 | Detail-view chain section uses forwardOnly (all methods) not trace-mode (one method) | HIGH — visible to Tron |
| Narrowing bug 2 | Class.method is global, not per-UC; tree picks wrong method | HIGH — visible to Tron |
| R18.13 | sourceFile+sourceLine on ALL 7 types via marker scan pipeline | MEDIUM |
| R18.14 | Browse-File → /md/ folder with highlight (not /edit direct) | MEDIUM |
| R18.15 | Line preserved browser→editor via ?line param → #L hash | LOW |

---

**Formulated by:** robbin-architect (2026-06-05)
