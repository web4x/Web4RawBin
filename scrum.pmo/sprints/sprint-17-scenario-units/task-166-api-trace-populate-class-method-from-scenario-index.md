[Back to Sprint 17 Planning](./planning.md)

# T166: /api/trace populate Class + Method types from scenario index

[task:uuid:086a35db-0de3-49f3-971a-c6be1863100e]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim tester finding from T165 verification (5/7 classes render; Class + Method = 0 in /trace graph because scanRepo doesn't produce them); confirm scope (Class + Method only, or all types not in scanRepo's output)
2. **robbin-architect** — design the scenario-index overlay/walk for `/api/trace`: the data exists per T128.1 (Sprint 1 class/method units migrated to scenario index) but `/api/trace` doesn't surface them in the graph. Same pattern as T163 (data-source switch to scenario index for titles) — here: scenario-index supplies Class + Method nodes that scanRepo misses. Decide overlay (merge scanRepo + scenario-index) vs full switch (scenario-index only for these types).
3. **robbin-expert** — implement per architect's design; rule-pair (a)+(b)
4. **robbin-tester** — re-run T165 verify: target **7/7 classes** render in `/trace` graph; Class + Method tree-items appear; click-through opens T158's DetailViews

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:086a35db-0de3-49f3-971a-c6be1863100e]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tester finding on T165 verification (planner-anchored, req-eng to formalize verbatim):**
    `[requirement:uuid:92c25e03-0b67-4a2e-bf12-dda2df412c4a]`
    Tester (2026-06-02 via PO): T165 PARTIAL — 5/7 classes render in `/trace` graph (requirement, task, useCase, test, implementation). **Class and Method = 0 nodes** because `scanRepo` (the current `/api/trace` data source for non-Requirement types) does not produce them. The data exists: T128.1 migrated Sprint 1 class/method units to the scenario index. Fix: populate Class + Method types in `/api/trace` from the scenario index — same sister-pattern as T163 (data-source switch to scenario index).
- down
  - None (atomic; single-endpoint overlay/walk change)
- follows
  - [T165: tree renders ALL 7 typed classes](./task-165-tree-renders-all-7-typed-classes.md) — `60a97a7` architect design; T165 closes 5/7 but Class+Method blocked by missing source data; T166 unblocks
  - [T163: /api/trace title source switch](./task-163-api-trace-title-source-switch.md) — sister pattern (data-source switch to scenario index)
  - [T160: forward-ref REPOPULATION](./task-160-trace-browser-stale-requirement-items.md) — sister pattern (forward-refs from scenario index)
  - [T128.1: Sprint 1 exemplar migration](./task-128-migration.md) — supplies the migrated Class + Method scenario-index units T166 surfaces
  - [T158: 4 typed DetailViews](./task-158-traceability-browser-full-chain-data.md) — destination DetailViews for Class + Method tree-items
- chain (req → usecase → puml → class/method) — architect fills on refinement
  - **requirement:** Class + Method in /api/trace (anchored above)
  - **use case:** UC-TBD (architect — likely `api.trace.overlayClassMethod` or `traceEndpoint.surfaceFromIndex`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect adds UC if introduced)
  - **class/method:** `src/ts/server/` `/api/trace` route handler — overlay/walk pulling Class + Method from scenario index (TBD by architect)

## Context

T165 (`60a97a7` architect design committed) targets full 7-class tree
rendering in `/trace`. Tester verification: **5/7 work** (Requirement, Task,
UseCase, Test, Implementation render correctly). **Class + Method = 0
nodes** in the graph because `/api/trace`'s current source (`scanRepo`) doesn't
produce them.

The data is NOT missing — T128.1 migrated Sprint 1's class/method units to the
scenario index. The graph just doesn't read from there for these types.

**Sister pattern to T163.** T163 switched `/api/trace` requirement-title source
from a derived path → scenario-index `model.name`. T166 does the same kind of
move for Class + Method: surface them in the `/api/trace` graph by walking /
overlaying the scenario index, instead of relying on scanRepo's incomplete
output.

Architect decides: full data-source switch (scenario-index only for Class +
Method) vs overlay (merge scanRepo + scenario-index). Overlay is safer if
scanRepo carries any data scenario-index lacks; full switch is cleaner if
scenario-index is authoritative post-T128.1.

## Intention

### Why this task exists
T165 cannot reach 7/7 without Class + Method appearing in `/api/trace`'s
output. The fix is upstream of the tree builder — at the data-source layer.

### Problems this task solves
- `/api/trace` returns 0 Class + Method nodes despite migrated data existing
- T165 visually blocked at 5/7 classes for tree-coverage AC
- Click-through into T158's Class / Method DetailViews unreachable from the tree

### How it solves them
- Architect designs the overlay/walk: scenario-index supplies Class + Method
  graph nodes (with their forward refs); `/api/trace` merges into its response
- Expert implements as a single endpoint change in one commit-set
- Tree builder (T165) now has 7/7 typed objects to render

## Design (Architect — robbin-architect, 2026-06-02)

### Root Cause

`src/ts/server/server.ts:429` — `const { graph, coverage } = scanRepo(sprintsDir, srcDir, testDir)` builds the graph from markdown parsing. `scanRepo()` produces Requirement, Task, UseCase, Test, Implementation (TraceLink) objects. It does NOT produce Class or Method objects — those types are only in the scenario index (created by T128.1's migration from TypeScript AST extraction).

T163's overlay (lines 435-441) patches `model.name` from scenario index onto **existing** graph objects:
```typescript
const obj = graph.get(uuid);          // only finds objects scanRepo created
if (obj && unit.model.name) obj.title = String(unit.model.name);
```
If scanRepo didn't create the object (Class/Method), `graph.get(uuid)` returns null → overlay skips it → Class/Method never appear.

### Decision: OVERLAY (merge), not full switch

**Overlay** — keep scanRepo for types it handles well (Req/Task/UC/Test/Impl), add scenario-index for types it misses (Class/Method). Rationale:
- scanRepo produces forward refs, coverage stats, and validation data that scenario index doesn't replicate yet
- Full switch would require rebuilding the entire graph from scenario index — larger scope, higher risk
- Overlay is the same pattern T163 used (small addition to existing endpoint)

### Fix: Add Class + Method Objects from Scenario Index

After the T163 title-overlay loop (line 441), add a second pass that **creates graph objects** for Class + Method types not present in scanRepo's output:

```typescript
// server.ts /api/trace handler — AFTER T163 overlay (line 441):

// T166: populate Class + Method from scenario index (scanRepo doesn't produce them)
try {
  const idx = new ScenarioIndex(scenarioDir);
  for (const uuid of idx.list()) {
    const unit = idx.get(uuid);
    if (!unit) continue;
    const chainType = unit.model.chainType;
    
    // Only add types scanRepo doesn't produce
    if (chainType !== 'class' && chainType !== 'method') continue;
    
    // Skip if already in graph (shouldn't happen, but defensive)
    if (graph.get(uuid)) continue;
    
    // Create graph object from scenario index
    graph.add({
      uuid,
      type: chainType,
      title: String(unit.model.name || ''),
      description: String(unit.model.description || ''),
      status: String(unit.model.status || ''),
      links: {
        // Forward refs from scenario (T160 forward-only)
        ...(chainType === 'class' ? { methods: unit.model.methods || [] } : {}),
        ...(chainType === 'method' ? {} : {}),  // Method = LEAF, no forward links
      },
    });
  }
} catch { /* scenario index not available for class/method — degrade gracefully */ }
```

### Walk Pattern

Scenario index stores Class + Method units under `scenario/index/<5-char-prefix>/<uuid>.scenario.json`. Each has:

```json
{
  "model": {
    "uuid": "...",
    "chainType": "class",
    "name": "GameRoom",              // T161-clean speaky name
    "description": "...",
    "sourcePath": "src/ts/server/GameRoom.ts",
    "methods": ["uuid-1", "uuid-2"]  // forward refs to Method units
  }
}
```

The overlay reads these, creates TraceObject nodes in the graph, and includes their forward links. The tree builder (T165) then renders them as tree-items.

### Forward-Ref Integration with Existing Graph

Class/Method objects need parent edges FROM existing graph objects (UseCase → Class). Two approaches:

**Option A (minimal — T166 scope):** Add Class/Method as orphan nodes. T165's orphan recovery (Part 2 of T165 design) shows them in the "Orphan items" section. Tester clicks through to T158 DetailViews.

**Option B (full — if UC→Class forward refs exist):** T153 populated `useCase.classes[]` in scenario units. If the `/api/trace` graph's UseCase objects carry `links.classes[]`, the tree builder already connects UC→Class→Method. Expert checks: do the graph's UC objects have `links.classes` populated? If yes, option B works automatically — no orphan section needed.

**Architect recommendation:** Implement Option A first (guaranteed 7/7). If option B works (UC links already have class refs), the orphan section will be empty — best of both worlds.

### Files to Modify

| File | Change |
|------|--------|
| `src/ts/server/server.ts` (line ~441) | Add T166 overlay loop: create Class + Method graph objects from scenario index |
| `package.json` | Bump version (rule-pair (a)) |
| `src/public/sw.js` | Bump CACHE_NAME (rule-pair (b)) |

**3 files.** Same minimal pattern as T163.

### STATIC_SHELL (c): Exempt — no new route, no new bundle.

### AC Mapping

| AC | Design Answer |
|----|---------------|
| AC1 | Class nodes created from scenario index in overlay loop — count > 0 |
| AC2 | Method nodes created from scenario index — count > 0 |
| AC3 | Forward refs from scenario `model.methods[]` — no back-refs |
| AC4 | `model.name` is scenario-index clean (T161/T163 pipeline) |
| AC5 | T165 tree-item click → TraceRouter → VerbRegistry → T158 DetailView |
| AC6 | 7/7 types in graph (5 from scanRepo + 2 from scenario index overlay) |
| AC9 | Rule-pair (a)+(b) in same commit |

## Acceptance Criteria
- [ ] AC1 — `GET /api/trace` returns Class nodes populated from the scenario index (count > 0; verify against T128.1's migrated S1 class units)
- [ ] AC2 — `GET /api/trace` returns Method nodes populated from the scenario index (count > 0)
- [ ] AC3 — Class + Method nodes carry their forward refs (per T160 forward-only rule) — no back-refs reintroduced
- [ ] AC4 — Class + Method titles use scenario-index `model.name` (T161/T163 clean) — no MD prefix leak
- [ ] AC5 — Click-through from `/trace` Class / Method tree-items opens T158's DetailViews correctly
- [ ] AC6 — T165 verify target met: **7/7 classes** render in the `/trace` graph
- [ ] AC7 — No regression on T158 / T160 / T161 / T163 / T165 (existing 5 classes unchanged)
- [ ] AC8 — `npm run build` succeeds; all existing tests pass
- [ ] AC9 — **Rule-pair (a)+(b) [learnings #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set; (c) STATIC_SHELL exempt (no new route, architect to confirm)

## Test Scenarios
File: extend `test/vitest/api-trace.test.ts` + `test/e2e/trace-tree.spec.ts` + visual on `/trace`.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | GET /api/trace, count Class nodes | Matches T128.1's migrated S1 class unit count (architect supplies expected number) |
| TS2 | GET /api/trace, count Method nodes | Matches T128.1's migrated S1 method unit count |
| TS3 | Verify a Class node's forward refs (T160 pattern) | Forward refs present; no back-refs |
| TS4 | Verify a Class node's title | Clean speaky name (no MD prefix, no Tron-quote blockquote) |
| TS5 | Open `/trace`, count tree-item types | All 7 typed classes represented (T165 AC1 satisfied) |
| TS6 | Click a Class tree-item | T158's Class DetailView opens |
| TS7 | Click a Method tree-item | T158's Method DetailView opens |
| TS8 | Regression: existing 5 typed classes (Req/Task/UC/Test/Impl) | Unchanged tree-items + DetailViews |
| TS9 | Rule-pair post-bump | New CACHE_NAME activates; 7/7 tree visible on device |

## Dependencies
- **Requires:** T165 (`60a97a7` architect design — tree builder ready to consume the 7/7), T128.1 (shipped — class/method scenario-index units exist), T158 (shipped — destination DetailViews), T160 + T163 (sister-pattern data-source switches)
- **Coordinate-with:** T128.2 (S10-S16 migration in flight — once landed, more Class + Method units available to surface; T166's overlay/walk should cover them automatically)
- **Enables:** T165 reaches 7/7; complete tree-shaped traceability across all typed scenarios

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors the verbatim tester finding (T165 5/7 partial; Class + Method = 0 in /api/trace because scanRepo doesn't produce them); confirms scope with PO.
2. **robbin-architect** designs the overlay/walk pattern (data-source switch OR merge); same sister-pattern as T163; specifies T160's forward-only rule preservation; writes the Design section.
3. **robbin-expert** implements per the design in one commit-set; carries the rule-pair (a)+(b).
4. **robbin-tester** runs TS1-TS9 + visual sweep + chain audit + T165 7/7 re-verify; commits the verification report into this file's QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] No regression on T158 / T160 / T161 / T163 / T165
- [ ] All 4 roles committed work
- [ ] Tron QA approved
- [ ] T165 status updates to ✅-ready once T166 lands (T165's 7/7 AC depends on T166)

## QA Audit & User Feedback
- 2026-06-02: PO directed planner-first stand-up of T166 — tester T165 partial finding (5/7 classes; Class + Method = 0 because scanRepo doesn't produce them). Sister to T163 overlay/data-source-switch pattern. CMM4 4-role (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC9 + DoD (learnings #15+#16). Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.

## Subtasks
None (atomic task; single-endpoint overlay/walk change).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 27 follow-on (T165 unblocker)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 2 (unblocks T165's 7/7 target; closes the Class+Method data-source gap at /api/trace)*
