[Back to Sprint 17 Planning](./planning.md)

# T165: Traceability tree renders ALL 7 typed classes (not only Requirements)

[task:uuid:35ed4168-f575-4df4-9a87-43f5ca4912ab]

> **Renumbered 2026-06-02 from T164 → T165** per PO direction. PO reassigned
> T164 to be the T163 close-out task (re-migrate dirty model.name units +
> firstLine() fallback hardening). Task uuid + scope preserved; only the
> T-number changed.

## Status — 📝 refinement done (architect 60a97a7)
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — architect-led design per Tron 2026-06-02; **`60a97a7` architect design committed: tree renders all 7 typed classes**)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> Sync per standing rule #11 (architect drops content without checking box →
> planner checks against committed reality): `60a97a7` lands the design;
> refinement box checked. Expert next. QA Review + Done remain Tron's gate.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — architect-LED per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim tester finding from T158 verification; confirm scope (all 7 typed classes: Requirement, UseCase, Task, Class, Method, Test, Implementation/TraceLink — and confirm Tron's "7-class" enumeration)
2. **robbin-architect (LEAD)** — design how every typed scenario class surfaces as a tree-item in `/trace`, not only Requirements; decide root-set + child-edge derivation (forward-ref tree per R17.26 / T143); per-class tree-item rendering (icon + speaky name + word-wrap description per T143's tree rules); interaction with the typed DetailViews shipped in T158 (a41d16a v0.5.59)
3. **robbin-expert** — implement per architect's design (rb-tree-item generalization + tree builder + per-class tree-item registration); rule-pair (a)+(b)
4. **robbin-tester** — verify all 7 classes appear in `/trace` tree; click-through into each typed DetailView (T158) works; chain audit clean; no regression on T160/T161/T163

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:35ed4168-f575-4df4-9a87-43f5ca4912ab]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tester finding on T158 verification (planner-anchored, req-eng to formalize verbatim):**
    `[requirement:uuid:f6f5b204-0595-4910-998f-5089025ec494]`
    Tester (2026-06-02, via PO): the graph tree on `/trace` shows ONLY Requirements as tree-items. The four typed DetailViews shipped in T158 (Class / Method / Test / Implementation) exist and render correctly when reached, but their objects do not appear as tree-items in the tree itself. Tron requests full **7-class tree rendering** (architect to enumerate the 7 — likely Requirement, UseCase, Task, Class, Method, Test, Implementation/TraceLink — with architect confirming).
  - **Aligns with [R17.26-R17.29](./requirements.md) (T143 traceability-as-tree rework):**
    - R17.26 (tree, not chain): the tree must include all typed scenarios
    - R17.27 (every element a link): each tree-item navigates to its DetailView (T158 provides 4 of the 7)
    - R17.28 (all typed scenarios): coverage of all class types in the tree
    - This task is one of the R17.29 "rework refined task files" workstream deliverables for the browser surface
- down
  - None at the parent level (architect may split T164.x sub-tasks if scope warrants — coordinate with planner first)
- follows
  - [T158: 4 typed DetailViews — Class/Method/Test/Implementation](./task-158-traceability-browser-full-chain-data.md) (shipped `a41d16a` v0.5.59) — provides the destination DetailViews this task's tree-items link to
  - [T143: Traceability chain → TREE rework (R17.26-R17.29)](./task-143-traceability-tree-rework.md) — parent direction; T164 is one concrete consumer of T143's tree model on the `/trace` browser
  - [T160: Forward-ref REPOPULATION + browser data-freshness](./task-160-trace-browser-stale-requirement-items.md) (shipped, AC3 verified) — supplies the forward-ref tree edges (Req→Task / Task→UC) the tree builder walks
  - [T161: Requirement name rendering — speaky model.name](./task-161-requirement-name-renders-tron-quote-not-speaky.md) (shipped) — T164 reuses speaky-name rendering across all 7 classes
  - [T163: /api/trace title source switch](./task-163-api-trace-title-source-switch.md) (shipped) — T164 inherits the clean title pipeline
- chain (req → usecase → puml → class/method) — architect fills on refinement
  - **requirement:** all-7-class tree rendering (anchored above)
  - **use case:** UC-TBD (architect — likely `tree.buildAll7Classes` or `traceTree.renderTypedItem`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect adds UC if introduced; first-class UseCase instances per R17.10 / T117 pattern)
  - **class/method:** `src/public/ts/trace/` — `rb-tree-item` (generalize per type), tree builder (root-set + child-edge derivation), per-class registration; TBD by architect

## Context

T158 (shipped `a41d16a` v0.5.59) delivered 4 typed DetailViews (Class / Method /
Test / Implementation) alongside the previously-existing Requirement DetailView.
Tester verification on T158 found a coverage gap: the **tree itself** in
`/trace` still only renders Requirement items as tree-nodes. The Class /
Method / Test / Implementation DetailViews exist and work when navigated to
(e.g. via chain-link anchors or direct URL), but their objects are not
visible as tree-items in the tree's structure.

Tron (via PO 2026-06-02) directs that ALL 7 typed scenario classes appear as
tree-items, per the R17.26-R17.28 tree-coverage requirements that T143 sets
as the architectural direction. Architect leads the design (PO assignment).

The "7 classes" enumeration is architect-confirmable but most likely:
**Requirement, UseCase, Task, Class, Method, Test, Implementation** (= TraceLink
class per S17 model). Confirm against the scenario-class registry shipped in
T125 (Unit + ClassRegistry + ScenarioIndex) and the templates in T126.

## Intention

### Why this task exists
T158 closed the DetailView gap (4 typed views) but not the tree-item-coverage
gap. Without T164, users can't navigate to typed objects from the tree itself —
they have to follow chain-links or know URLs. Breaks the discoverability of
the tree-shaped traceability per R17.26.

### Problems this task solves
- Tree on `/trace` shows only Requirements as nodes
- Class / Method / Test / Implementation objects are invisible at the tree level
- UseCase / Task tree-item coverage status: architect to confirm (likely partial)

### How it solves them
- Generalize `rb-tree-item` per type (or one component with per-type render)
- Tree builder walks the forward-ref graph (T160 forward arrays) AND the typed
  registries to surface every scenario object as a tree-item under appropriate
  parents
- Each tree-item navigates to its T158 DetailView (existing) on click

## Acceptance Criteria
- [ ] AC1 — All 7 typed scenario classes (architect to enumerate + confirm) appear as tree-items in `/trace`
- [ ] AC2 — Clicking any tree-item opens its corresponding T158 DetailView (Class/Method/Test/Impl) or existing Requirement/UseCase/Task DetailView
- [ ] AC3 — Tree-item rendering is consistent with T143 (speaky name + word-wrap description + square SVG icon when T113 lands; for now, per-type icon convention defined by architect)
- [ ] AC4 — Tree-item parent/child edges follow the forward-ref graph (T160's repopulated arrays) — no back-refs introduced (R17 forward-only rule)
- [ ] AC5 — Chain audit on `/trace` shows zero orphan typed objects (every typed scenario appears in the tree at least once)
- [ ] AC6 — No regression on T158 / T160 / T161 / T163; existing Requirement tree-items render unchanged
- [ ] AC7 — `npm run build` succeeds; all existing tests pass
- [ ] AC8 — **Rule-pair (a)+(b) [learnings #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set; (c) STATIC_SHELL exempt (no new route, architect to confirm)

## Test Scenarios
File: extend `test/vitest/trace-tree.test.ts` (T143's test surface) + `test/e2e/trace-tree.spec.ts` + visual on `/trace`.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Load `/trace`; enumerate tree-item types present | All 7 typed classes represented as tree-items |
| TS2 | Click a Class tree-item | Opens T158's Class DetailView |
| TS3 | Click a Method tree-item | Opens T158's Method DetailView |
| TS4 | Click a Test tree-item | Opens T158's Test DetailView |
| TS5 | Click an Implementation/TraceLink tree-item | Opens T158's Implementation DetailView |
| TS6 | Walk the tree from a Requirement root down to a Method leaf | Every hop is a clickable tree-item; chain audit zero orphan |
| TS7 | Visual: tree-item rendering per type | Consistent speaky-name + description + per-type marker; no MD artifacts (T161/T163 clean) |
| TS8 | Regression: existing Requirement tree-items | Unchanged behavior |
| TS9 | Rule-pair post-bump | New CACHE_NAME activates; full-tree visible on device |

## Dependencies
- **Requires:** T158 (shipped — destination DetailViews), T160 (shipped — forward-ref edges), T161 (shipped — speaky names), T163 (shipped — clean /api/trace titles), T143 (parent direction — tree model design)
- **Coordinate-with:** T141 (chain-link icon), T126 (per-class templates), T125 (ClassRegistry + ScenarioIndex — the 7-class enumeration source)
- **Enables:** complete tree-shaped traceability navigation per R17.26-R17.28

## Drive Plan (planner-coordinated, ARCHITECT-LED per PO 2026-06-02)
1. **robbin-req** anchors the verbatim tester finding here; confirms the "7-class" enumeration with PO if scope is ambiguous.
2. **robbin-architect (LEAD)** enumerates the 7 typed classes; designs the tree builder (root-set + child-edge derivation from forward refs); per-class tree-item rendering pattern; integration with T158 DetailViews; writes the Design section in this file.
3. **robbin-expert** implements per the design in one commit-set; carries the rule-pair (a)+(b).
4. **robbin-tester** runs TS1-TS9 + visual sweep + chain audit; commits the verification report into this file's QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] No regression on T158 / T160 / T161 / T163
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-02: PO directed planner to stand up T164 — tester finding during T158 verification: graph tree shows only Requirements; class/method/test/impl have DetailViews but no tree-items yet. Architect-LED design (PO assignment). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC8 + DoD (learnings #15+#16). Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.

## Design (Architect — robbin-architect, 2026-06-02)

### Root Cause

`src/public/ts/trace/rb-trace-tree.ts:57`:
```typescript
const roots = this.graph.ofType('requirement');
```
Tree starts ONLY from Requirement roots. `nodeEl()` recursively walks `obj.toJSON().links` to build children — so the infrastructure to render all 7 types already exists. The gap is: (1) root set is requirement-only; (2) forward links may be incomplete deeper in the chain.

### The 7 Typed Classes (confirmed from `src/ts/shared/TraceModel.ts`)

| # | Type | TraceModel Class | Root? | DetailView |
|---|------|-----------------|-------|------------|
| 1 | `requirement` | RequirementObject (L143) | YES (current root) | rb-requirement-detail |
| 2 | `task` | TaskObject (L153) | NO — child of requirement | rb-task-detail |
| 3 | `usecase` | UseCaseObject (L160) | NO — child of task | rb-usecase-detail |
| 4 | `class` | ClassObject (L167) | NO — child of usecase | rb-class-detail (T158) |
| 5 | `method` | MethodObject (L174) | NO — child of class | rb-method-detail (T158) |
| 6 | `test` | TestObject (L191) | NO — evidence on usecase | rb-test-detail (T158) |
| 7 | `implementation` | ImplementationObject (L183) | NO — child of method | rb-implementation-detail (T158) |

### Fix: Three Parts

#### Part 1 — Verify Forward Links End-to-End

The tree walks `obj.toJSON().links`. These must be populated:

| Link | Source→Target | Status |
|------|--------------|--------|
| `requirement.links.tasks[]` | Req → Task | ✅ T160 AC2 |
| `task.links.useCases[]` | Task → UC | ✅ T160 AC3 |
| `useCase.links.classes[]` | UC → Class | ⬜ Verify (T153) |
| `class.links.methods[]` | Class → Method | ⬜ Verify (T151) |
| `useCase.links.tests[]` | UC → Test | ⬜ Verify (T155) |
| `method.links.implementations[]` | Method → Impl | ⬜ Verify (T140) |

Expert audits ⬜ links. If empty, populate from scenario index (same T160 forward pattern).

#### Part 2 — Orphan Recovery (Fallback Root Set)

Any typed scenario NOT reachable from a Requirement root is an orphan. Show orphans in a separate section — never hide them (AC5: zero orphan typed objects hidden).

```typescript
// rb-trace-tree.ts render() — replace lines 55-61:
render(): void {
  if (!this.graph) { this.innerHTML = '<div class="tt-empty">no graph</div>'; return; }
  
  const roots = this.graph.ofType('requirement');
  
  // Walk forward from all roots to find reachable set
  const reachable = new Set<string>();
  const walk = (ref: string) => {
    if (reachable.has(ref)) return;
    reachable.add(ref);
    const obj = this.graph!.get(refUuid(ref));
    if (obj) Object.values(obj.toJSON().links).flat().forEach(walk);
  };
  roots.forEach(r => walk(r.ref()));
  
  // Orphans: typed objects not reachable from any requirement
  const orphans = this.graph.all().filter(o => !reachable.has(o.ref()));
  
  this.innerHTML = '';
  for (const obj of roots) this.appendChild(this.nodeEl(obj.ref(), new Set()));
  
  if (orphans.length > 0) {
    const hdr = document.createElement('div');
    hdr.className = 'tt-orphan-header';
    hdr.textContent = `Orphan items (${orphans.length})`;
    this.appendChild(hdr);
    for (const obj of orphans) this.appendChild(this.nodeEl(obj.ref(), new Set()));
  }
}
```

#### Part 3 — Per-Type Tree-Item Icons

`rb-object-item.ts` receives `type` attribute (line 76 of rb-trace-tree.ts). Add icon rendering:

```typescript
// rb-object-item.ts — add to render path:
private typeIcon(type: string): string {
  return { requirement: '📋', task: '📝', usecase: '🎯', class: '📦',
           method: '⚙️', test: '✅', implementation: '💻' }[type] || '📄';
}
```

Prepend `typeIcon(this.type)` before title text in the item's render.

### Click-Through — Already Works

`rb-object-item` dispatches clicks → `TraceRouter` → VerbRegistry → DetailView. T158 registered Class/Method/Test/Implementation in VerbRegistry. No change needed.

### Files to Modify

| File | Change |
|------|--------|
| `src/public/ts/trace/rb-trace-tree.ts` | Orphan recovery in `render()` |
| `src/public/ts/trace/rb-object-item.ts` | Per-type icon rendering |
| Server or migration | Verify + populate ⬜ forward links if empty |
| `package.json` | Bump version (rule-pair (a)) |
| `src/public/sw.js` | Bump CACHE_NAME (rule-pair (b)) |

### STATIC_SHELL (c): Exempt — no new route, changes bundle into existing `dist/trace.js`.

## Subtasks
None at parent level (architect may split T165.x if scope warrants — coordinate with planner first).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 27 (tree-coverage enrichment)*
*Owners (CMM4): robbin-req → robbin-architect (LEAD) → robbin-expert → robbin-tester*
*Priority: 2 (closes the discoverability gap left by T158; aligns `/trace` tree with R17.26-R17.28)*
