[Back to Sprint 17 Planning](./planning.md)

# T143: Traceability chain → TREE rework (R17.26–R17.29)

[task:uuid:49cbf5f4-ee83-4856-a35b-6721c70e2e53]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `4b65e79` architect design)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — anchor the verbatim Tron quote(s) under each R17.26–R17.29 below; reconcile with `ac8c8e7` formalization
2. **robbin-architect** — design the tree-shaped traceability model (multi-parent / multi-child edges across Requirement/UseCase/Task/Class/Method/Test/View units); decide template + ViewGenerator changes; specify "every element a link" rendering; specify "all typed scenarios" coverage gaps to migrate; produce the "sharpen planning + rework tasks" plan (R17.29)
3. **robbin-expert** — implement per architect's design (TraceLink/TraceModel tree extensions, template updates, planner-view regeneration)
4. **robbin-tester** — chain-walk verification, visual on `/trace` + `/md/scenarios/sprints.md/`, regression on existing migrated units

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:49cbf5f4-ee83-4856-a35b-6721c70e2e53]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (PO):** `df09df2` — *po: capture Tron 4th S17 extension (R17.26-R17.29 traceability = tree)*
  - **Requirement formalization (req-eng):** `ac8c8e7` — *robbin-req: R17.26-R17.29 formalized + R17.16-R17.25 re-archived*
  - **R17.26 Traceability is a TREE, not a chain**
    `[requirement:uuid:a1e2f3d4-b5c6-4d7e-8f90-1a2b3c4d5e26]`
    Verbatim Tron quote: req-eng to anchor here from `df09df2`.
  - **R17.27 Every traceability element is a clickable link**
    `[requirement:uuid:b2f3a4e5-c6d7-4e8f-9a01-2b3c4d5e6f27]`
    Verbatim Tron quote: req-eng to anchor here from `df09df2`.
  - **R17.28 All traceability elements are typed scenarios**
    `[requirement:uuid:c3a4b5e6-d7e8-4f90-a1b2-3c4d5e6f7028]`
    Verbatim Tron quote: req-eng to anchor here from `df09df2`.
  - **R17.29 Sharpen planning + rework refined task files**
    `[requirement:uuid:d4b5c6e7-e8f9-4a01-b2c3-4d5e6f708029]`
    Verbatim Tron quote: req-eng to anchor here from `df09df2`. (T143 itself is
    a deliverable of R17.29 — the "rework refined task files" workstream.)
- down
  - None (atomic at the parent level; architect may split sub-tasks T143.x if scope warrants — coordinate with planner first)
- follows
  - [T134: Traceability-as-units](./task-134-traceability-as-units.md) — current chain model T143 generalizes to a tree
  - [T141: Chain-link icon → sprints.json symlink](./task-141-chain-link-icon-symlinks.md) — link rendering this task extends to "every element"
  - [T126: Generated views + 7 templates](./task-126-views.md) — templates updated for tree + every-element-a-link
  - [T128.x: Migration burst](./task-128-migration.md) — coverage gap inputs for R17.28 (types not yet migrated)
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** R17.26–R17.29 (above)
  - **use case:** UC-TBD (architect — likely `trace.renderTree`, `trace.navigate`, `migration.typeCoverage`, `planner.rework`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds the new UCs as `UseCase` instances (rule #10 / T117 pattern)
  - **class/method:** `src/public/ts/trace/TraceModel.ts`, `TraceLink`, ViewGenerator templates, `/trace` rendering, `/md/` view emission (TBD by architect)

## Context

Tron's 4th S17 extension (2026-05-31, captured verbatim by PO in `df09df2`,
formalized by req-eng in `ac8c8e7`) re-shapes traceability:

1. **Chain → tree (R17.26).** Today's model is a linear "requirement → task → use
   case → class → method" chain; Tron asks for a **tree** with branching parents
   and children — a requirement can fan out to multiple tasks; a task can have
   many sub-tasks; a method can serve multiple use cases; etc. The current
   `TraceLink`/`TraceModel` (T134) needs to support multi-parent edges + tree
   walks, not just a single forward chain.

2. **Every element a link (R17.27).** In any rendered traceability view (HTML
   on `/trace`, MD on `/md/scenarios/sprints.md/...`), every textual node that
   names a typed unit MUST be a clickable link to that unit's canonical view.
   No bare text where a link could resolve.

3. **All elements typed scenarios (R17.28).** Anything appearing in a
   traceability view must be a typed scenario unit (Requirement / UseCase /
   Task / Class / Method / Test / View) — no untyped strings or
   yet-to-be-migrated entities. The migration scope (T128.x) extends to cover
   types that surface in traceability but aren't yet scenario units.

4. **Sharpen planning + rework refined task files (R17.29).** The planner
   surface (planning.md generated views) and existing refined task files need
   to be re-rendered against the tree model; symbols, chain-link icons, and
   parent/child navigation must reflect the tree.

## Intention

### Why this task exists
1. The chain model can't express real traceability (one→many in both
   directions); Tron called this out directly.
2. Without "every element a link" navigation, a "tree" is just a noun — users
   can't walk it.
3. Without R17.28 type-coverage, the tree has dead-ends (untyped strings).
4. R17.29 makes the planner + existing task files first-class consumers of the
   new tree, not legacy artifacts.

### Problems this task solves
- Linear-chain `TraceLink` cannot model fan-out / fan-in.
- Views render some refs as bare text or non-resolving anchors.
- Migration coverage is incomplete for some surfaced types.
- planning.md + refined task files lag behind the new model.

### How it solves them
- Generalize `TraceLink`/`TraceModel` to multi-edge tree (architect designs).
- Template + ViewGenerator update so every typed reference renders as
  `[name](sprints.json/<class>/<uuid>.scenario.json)` (or `.md` view).
- Audit migration coverage; extend T128.x scope per R17.28.
- Regenerate planning.md views; rework refined task files (this is the
  T143 workstream for R17.29).

## Acceptance Criteria
- [ ] AC1 — `TraceModel` supports multi-parent + multi-child edges; chain
  walks (`walkUp`/`walkDown`) become tree walks
- [ ] AC2 — Generated views (HTML + MD) render every typed reference as a
  resolvable link; chain audit shows 0 bare/broken refs across migrated units
- [ ] AC3 — Migration coverage audit run: every type appearing in a
  traceability view is a scenario unit; gaps captured as T128.x extensions
- [ ] AC4 — planning.md generated views (per #19 / T126) reflect the tree —
  parent/child navigation visible; symbols (⏳📝🔧✅🧪🏁) derive from FSM
- [ ] AC5 — Existing refined task files (T141, T134, T126, T124.x, …) re-render
  cleanly against the new templates; no broken links surfaced
- [ ] AC6 — `npm run build` succeeds; all existing tests pass (no regression)
- [ ] AC7 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version"
  bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as
  the user-facing impl; if any new route/page introduced, STATIC_SHELL entry
  added (architect to decide if applicable)
- [ ] AC8 — chain audit (`trace-cli`) reports 0 compliance failures across
  all sprint-17 units after the rework

## Test Scenarios
File: `test/vitest/trace-tree.test.ts` (new) + `test/e2e/trace-tree.spec.ts` (new) + visual on `/trace` and `/md/scenarios/sprints.md/`.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | `walkUp` from a method that serves 2 use cases | Both UCs returned (multi-parent) |
| TS2 | `walkDown` from a requirement with 3 child tasks | All 3 tasks returned (multi-child) |
| TS3 | Render any migrated view; click every chain link | All resolve; no 404, no bare text |
| TS4 | Run migration-coverage audit (architect-defined script) | 0 untyped refs |
| TS5 | Render generated planning.md view for sprint-17 | Parent/child tree visible; symbols match FSM state |
| TS6 | Re-render T141 / T134 / T126 / T124.x against new templates | No broken links; chain audit clean |
| TS7 | Rule-pair post-bump | New CACHE_NAME activates; tree view reaches device |

## Dependencies
- **Requires:** T134 (TraceLink unit — generalize), T126 (ViewGenerator + templates — extend), T128.x (migration coverage — extend per R17.28), T141 (chain-link rendering — generalize to "every element a link")
- **Coordinate-with:** T133 (FSM symbols for planning view), T140 (source-location IOR rendering)
- **Enables:** R17.26–R17.29 satisfied; future traceability work (S18+) builds on the tree model

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors the verbatim Tron quotes (from `df09df2`) under each of R17.26–R17.29 in the Traceability block above; closes any ambiguity with PO before architect starts.
2. **robbin-architect** designs: TraceModel/TraceLink tree extensions; template + ViewGenerator changes (every-element-a-link); migration-coverage audit script; "rework refined task files" plan (R17.29); decides scope split (single-PR vs T143.x sub-tasks); writes the Design section here.
3. **robbin-expert** implements per the design; single commit-set carries the rule-pair (a)+(b) (+ STATIC_SHELL if any new route).
4. **robbin-tester** runs TS1–TS7 + chain audit + visual sweep; commits the verification report into the QA Audit section of this file.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] Chain audit: 0 failures across sprint-17 units
- [ ] All 4 roles committed work (req anchor + architect design + expert impl + tester verify)
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-31: PO directed planner to stand up T143 immediately (no further reminder). Sources: `df09df2` (Tron capture) + `ac8c8e7` (req formalization R17.26–R17.29). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC7 + DoD (learnings #15+#16). Awaiting req-eng verbatim anchor → architect design → expert impl → tester verify → Tron QA.

## Design (robbin-architect, 2026-06-01)

### Current Model: Linear Chain

`trace-link.ts` stores edges as `{from, to, fromType, toType, relation}`. `renderChainSection()` in `templates.ts` reads flat arrays from model fields and renders each as `🔗 <8-char-uuid>` — bare text (MD) or dead `<a>` with no href (HTML). Violates R17.27.

### Target: Tree of Typed Links

#### 1. TraceLink model — NO schema change needed
`createTraceLink()` already stores `from`, `to`, `fromType`, `toType`, `relation`, `direction: 'bidirectional'`. These ARE graph edges. The tree emerges from traversal.

#### 2. New module: `src/ts/scenario/trace-tree.ts`

```typescript
export interface TraceNode {
  uuid: string;
  type: string;           // 'requirement'|'task'|'usecase'|'class'|'method'|'test'
  name: string;           // speaking name from scenario model
  relation: string;       // edge label to parent
  children: TraceNode[];
}

export function buildTraceTree(rootUuid: string, allLinks: ScenarioUnit[], allUnits: Map<string, ScenarioUnit>): TraceNode
export function walkUp(uuid: string, allLinks: ScenarioUnit[], allUnits: Map<string, ScenarioUnit>): TraceNode[]
export function walkDown(uuid: string, allLinks: ScenarioUnit[], allUnits: Map<string, ScenarioUnit>): TraceNode[]
```

Multi-parent (walkUp returns N parents), multi-child (walkDown returns N children).

#### 3. Fix R17.27 — every element a clickable link

Replace `renderChainLinkMd`/`renderChainLinkHtml` (lines 56-63 in templates.ts):

```typescript
// BEFORE (dead):
renderChainLinkHtml(ior) → '<a class="chain-link">🔗 uuid8</a>'  // no href!

// AFTER (live, speaking name):
renderTreeNodeHtml(node) → '<a href="/md/scenarios/sprints.md/{type}/{name}.md" class="chain-link">🔗 {name}</a>'
renderTreeNodeMd(node)   → '[🔗 {name}](scenarios/sprints.json/{type}/{uuid}.scenario.json)'
```

#### 4. Tree HTML — nested `<ul><li>`

```typescript
export function renderTraceTreeHtml(root: TraceNode): string {
  const renderNode = (n: TraceNode): string => {
    const link = renderTreeNodeHtml(n);
    const rel = n.relation ? `<span class="sv-relation">${n.relation}</span> ` : '';
    if (!n.children.length) return `<li>${rel}${link}</li>`;
    return `<li>${rel}${link}<ul>${n.children.map(renderNode).join('')}</ul></li>`;
  };
  return `<div class="sv-section sv-trace-tree"><h3>Traceability</h3><ul class="sv-tree">${root.children.map(renderNode).join('')}</ul></div>`;
}
```

MD equivalent: indented `- relation: [🔗 name](href)` lists.

#### 5. Template signature — add RenderContext

Current templates receive only `model`. Tree rendering needs access to all links + units:

```typescript
interface RenderContext {
  allLinks: ScenarioUnit[];
  allUnits: Map<string, ScenarioUnit>;
}
// All 7+1 template signatures:
toHtml(model, ctx?: RenderContext): string;
toMd(model, ctx?: RenderContext): string;
```

Backward-compatible: without ctx, falls back to flat chain.

#### 6. planning.md generator — tree-shaped task nesting

Parent-child from TraceLink `contains`/`follows`. Symbols from FSM (T133):
```markdown
- 🏁 [T124: Data Model](./task-124.md)
  - ✅ [T124.1: spec](./task-124.1.md) (implements)
  - ✅ [T124.2: templates](./task-124.2.md) (implements)
- 📝 [T143: Tree rework](./task-143.md)
  - ⏳ [T144: File-browser](./task-144.md) (follows)
```

### Touchpoints

| Component | File | Change |
|-----------|------|--------|
| NEW | `src/ts/scenario/trace-tree.ts` | TraceNode, build/walkUp/walkDown, render tree HTML+MD |
| MODIFY | `src/ts/scenario/templates.ts` | Replace renderChainSection → renderTraceTree; add RenderContext to 8 templates |
| MODIFY | `src/ts/scenario/index.ts` | Export trace-tree |
| MODIFY | server.ts `/trace` handler | Pass RenderContext |
| MODIFY | ViewGenerator | Tree nesting + FSM symbols |
| NO CHANGE | `trace-link.ts` | Model already graph-capable |

### Scope: single commit-set, no sub-tasks

## Subtasks
None (single commit-set as designed).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 5 (tree rework)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (Tron 4th S17 extension — blocks "traceability is a tree" experience)*
