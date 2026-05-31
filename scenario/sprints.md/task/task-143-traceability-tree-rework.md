# T143: Traceability chain → TREE rework (R17.26–R17.29)
[task:uuid:49cbf5f4-ee83-4856-a35b-6721c70e2e53]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `4b65e79` architect design)
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

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

## QA Audit & User Feedback

### T143 Verification Report — robbin-tester 2026-06-01

**Tested on:** task-124-architecture.html (task w/ children), sprint-scenario-units.html (sprint), unit-load.html (usecase)

| AC | Check | Result |
|----|------|--------|
| AC1 | Section renamed Chain→Traceability, sv-trace-tree class, walkUp/walkDown in trace-tree.ts | **PASS** |
| AC2 | Links now have `href` attrs (was bare `<a>` in T141). Relation labels present ("Children", "Tasks") | **PARTIAL** — hrefs use UUID filenames (`e83d47a1.md`) but generated views use speaking names (`task-124.1-architect-data-model.md`). **Links 404.** |
| AC4 | planning.md uses tree (nested ul/li visible in generated planning.md) | **PASS** |
| AC5 | Existing views re-render (T124 has 3 children, sprint has 22 tasks) | **PASS** (structure present) |
| AC6 | 834/834 vitest | **PASS** |
| AC7 | v0.5.37 in package.json + sw.js | **PASS** |
| CSS | `.sv-trace-tree ul` + `.sv-trace-tree li` in app.css | **PASS** |

**BUG — AC2 partial (v0.5.37):** chain-link hrefs use UUID filenames → 404.
**FIX ATTEMPT (4e79afa, v0.5.39):** trace-tree.ts TraceNode.slug populated correctly from unit model.slug. BUT templates.ts `renderChainLinkHtml`/`renderChainLinkMd` (L61-63) still uses raw UUID, not slug. The templates don't call trace-tree.ts — they use their own `renderChainSection`. Views regenerated (205 files) — still UUID hrefs.
**ROOT CAUSE:** templates.ts `renderChainLinkHtml` at L63 does `${uuid}.md`, not `${slug}.md`. Fix needs to either (a) pass slug lookup into renderChainSection, or (b) switch templates to use trace-tree.ts renderers.
**RE-VERIFY (v0.5.39):** AC2 still FAIL — 3/3 sampled links still 404.

- 2026-05-31: PO directed planner to stand up T143 immediately (no further reminder). Sources: `df09df2` (Tron capture) + `ac8c8e7` (req formalization R17.26–R17.29). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC7 + DoD (learnings #15+#16). Awaiting req-eng verbatim anchor → architect design → expert impl → tester verify → Tron QA.

## Subtasks

None (single commit-set as designed).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 5 (tree rework)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (Tron 4th S17 extension — blocks "traceability is a tree" experience)*
