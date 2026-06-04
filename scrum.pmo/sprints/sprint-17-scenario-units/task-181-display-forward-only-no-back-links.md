[Back to Sprint 17 Planning](./planning.md)

# T181: Strict forward-only DISPLAY — no backward links in any DetailView (Tron live /trace violation)
[task:uuid:41b0d724-dfd3-4fa0-903e-a7c2845be122]

> **PO direction 2026-06-04:** Tron live-/trace shows the Task DetailView
> rendering a `requirements` backward link despite T172 stripping all backward
> refs from the data and the audit reporting 0 issues. **The DISPLAY layer is
> emitting back-refs that the DATA does not contain.** Stand up T181 — strict
> forward-only DISPLAY: no DetailView (Task / UseCase / Class / Method /
> Implementation / Test) may render a backward link. 4-role planner-first;
> architect diagnoses the renderer; expert removes the back-link rendering;
> tester verifies live /trace has zero backward link affordances.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect diagnoses root cause — which template / which DetailView class is emitting the back-link)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - PO directive 2026-06-04 (Tron-relayed): Task DetailView shows 'requirements' backward link — violation despite T172/audit=0
  - **R-U** `[requirement:uuid:82638acb-2fae-4ad9-833b-27f7b218b2b2]` — every DetailView MUST render only forward-direction links per the LOCKED 7-step chain; backward links (`requirements` on a Task, `tasks` on a UseCase, etc.) are PROHIBITED in the DISPLAY layer (planner pre-seed; req-eng to anchor verbatim Tron quote if relayed)
- follows
  - T172 (`3fefc68` 5-step forward-ref + 238/238 reachability) — stripped back-refs in DATA; T181 closes the DISPLAY-side gap
  - T168 (`e714e255` LOCKED 7-step) — chain order spec; T181 enforces the same order in DetailViews
  - T159/B18 (prohibited fields on non-Requirement units) — extends to DISPLAY enforcement
  - Strict Verify Bar (`scrum.pmo/standards/traceability-standard.md`) — T181 satisfaction is part of the live-UX (2) reproduction for chain claims
- unblocks
  - Tron's confidence in forward-only chain (DISPLAY no longer contradicts DATA)
- down
  - None (atomic task — one renderer audit + fix pass)

## Task Description (planner seed — architect designs)

**Observed (PO 2026-06-04 from Tron live /trace):**
- Task DetailView shows a `requirements` section / link pointing back to the
  parent Requirement. **This violates the LOCKED 7-step forward-only rule** —
  Tasks render only their FORWARD children (UseCases), not their backward
  parent (Requirement).
- Per the standards (`traceability-standard.md` Prohibited Fields section
  +T159/B18): non-Requirement units MUST NOT carry backward refs in their
  data model. T172 confirmed the DATA is clean (planner re-verified
  2026-06-04: ZERO scenario units have prohibited backward fields).
- **The DISPLAY layer is the violator.** A DetailView template or renderer is
  emitting a back-link that the data does not declare. Likely sources:
  1. A hardcoded "Parent / Requirements" section in `rb-task-detail.ts` or
     analogous DetailView
  2. The renderer doing an upward walk (`walkUp(task) → Requirement`) and
     rendering the result as a `requirements[]` collection (semantically a
     parent breadcrumb, but the LABEL violates forward-only)
  3. A legacy template inherited from S15/S16 DetailViews before the LOCKED
     7-step rule existed
- **Audit blind spot:** the existing sprint audit + strict-direction audit
  inspect DATA only (`scenario/index/*.scenario.json`). They do not scan
  rendered HTML/MD views or the DetailView TypeScript sources for prohibited
  backward-link emissions. T181 adds a DISPLAY-side audit.

**Architect to diagnose:**
- Which file emits the back-link? (likely `src/public/ts/trace/rb-task-detail.ts`
  or a shared template helper)
- Is it hardcoded markup, an upward-walk rendered as a forward collection, or
  template inheritance?
- Does it affect other DetailViews (UseCase showing "tasks", Class showing
  "useCases", etc.) or only Task?
- Architect produces a per-DetailView audit table: which forward fields render,
  which back-link emissions exist, which are clean.

**Expert removes the back-link rendering** per architect's diagnosis. Parent
navigation may still exist via the tree breadcrumb (architect designs that
boundary) — but no DetailView body section may be labeled with a backward
collection name.

**Tester verifies live /trace** with SW active (per strict-verify-bar 2b):
inspect each DetailView for every type; confirm zero backward links emitted.

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — anchor R-U verbatim if Tron relays additional context (the literal "Task shows requirements back-link" observation)
- **robbin-architect** — diagnose root cause (per-DetailView audit table: which view emits which back-link); design the per-DetailView render contract (forward-only); design a DISPLAY-side audit (scans DetailView TS for prohibited collection names)
- **robbin-expert** — remove back-link rendering per architect's diagnosis; add the DISPLAY-side audit as a CI script (extension to T170 `trace:audit:strict` per learning #27)
- **robbin-tester** — verify live /trace (with SW active per strict-bar 2b): every DetailView for every type emits forward-only; AC2 audit script reports zero prohibited collection emissions; regression check that parent breadcrumb (if any) is correctly labeled (not as a backward collection)

## Acceptance Criteria

**R-U (strict forward-only DISPLAY):**
- [ ] AC1 — Task DetailView emits NO `requirements`-labeled section/link (Tron's reported violation closed)
- [ ] AC2 — UseCase DetailView emits NO `tasks`-labeled backward section
- [ ] AC3 — Class DetailView emits NO `useCases`-labeled backward section
- [ ] AC4 — Method DetailView emits NO `classes`-labeled backward section
- [ ] AC5 — Implementation DetailView emits NO `methods`-labeled backward section
- [ ] AC6 — Test DetailView emits NO `implementations`-labeled backward section
- [ ] AC7 — Each DetailView renders ONLY its forward children per the LOCKED chain (Requirement→tasks, Task→useCases, UseCase→classes, Class→methods, Method→implementations, Implementation→tests, Test→[leaf])
- [ ] AC8 — Parent breadcrumb (if architect retains it) is labeled as "Parent: <single type>" NOT as a backward collection — semantic clarity that this is navigation context, not a chain-forward reference

**Display-side audit (extends T170 strict gate per learning #27):**
- [ ] AC9 — A new audit script scans DetailView TypeScript sources (and/or rendered HTML snapshots) for prohibited backward collection name emissions; fails CI if any DetailView source mentions `requirements` (in a Task view), `tasks` (in a UseCase view), etc.
- [ ] AC10 — Standards (`scrum.pmo/standards/traceability-standard.md`) updated: the Prohibited Fields section extended with a DISPLAY-side clause — "Renderers / DetailViews MUST NOT label any section with a backward-direction collection name."

**Backwards-compat + ship rules:**
- [ ] AC11 — No regression on forward-direction rendering (all currently-correct DetailView sections still render their forward children)
- [ ] AC12 — Rule-pair (a)+(b) required; (c) STATIC_SHELL likely required if DetailView bundle hashes change (architect declares per learning #16)
- [ ] AC13 — `npm run build` clean; full test suite passes; new DISPLAY-audit script passes (zero prohibited emissions)

## Architect Design — Forward-Only Render Contract (2026-06-05)

### Root Cause (confirmed by code audit)

Every DetailView + the tree walker uses `obj.toJSON().links` which returns ALL link keys — both forward AND backward. The `renderLinks()` helper iterates `Object.entries(links)` unfiltered:

```typescript
// CURRENT (ALL 6 DetailViews — identical pattern):
const links = obj.toJSON().links;           // ALL keys: forward + backward
renderLinks(this.graph, links)              // renders every key

// CURRENT (rb-trace-tree.ts:91 — tree children):
const childRefs = Object.values(obj.toJSON().links).flat();  // ALL links
```

### The Fix: FORWARD_KEYS filter

One shared constant defines the forward-only contract (matches LOCKED 7-step from T168):

```typescript
const FORWARD_KEYS: Record<string, string[]> = {
  requirement: ['tasks'],
  task:        ['useCases'],
  usecase:     ['classes'],
  class:       ['methods'],
  method:      ['implementations'],
  implementation: ['tests'],
  test:        [],  // leaf — no forward children
};
```

### Per-File Fix Table

| File | Line | Current (BUG) | Fix |
|------|------|---------------|-----|
| `rb-task-detail.ts` | 30,45 | `renderLinks(graph, obj.toJSON().links)` | `renderLinks(graph, forwardOnly(obj))` |
| `rb-usecase-detail.ts` | 30,43 | same | same |
| `rb-class-detail.ts` | 26,36 | same | same |
| `rb-method-detail.ts` | 21,29 | same | same |
| `rb-implementation-detail.ts` | 21,29 | same | same |
| `rb-test-detail.ts` | 21,30 | same | same |
| `rb-trace-tree.ts` | 91 | `Object.values(obj.toJSON().links).flat()` | `obj.children.map(c => c.ref())` — uses T175 Tree getter |
| `rb-trace-tree.ts` | 69 | `Object.values(obj.toJSON().links).flat().forEach(walk)` | same fix — forward-only reachability walk |
| `rb-task-detail.ts` | 41 | `href="/md/scrum.pmo/sprints/"` hardcoded | construct from task slug: `href="/md/scrum.pmo/sprints/${sprint}/${slug}"` |

### Backward Keys PROHIBITED Per Type (what the filter removes)

| DetailView | Backward keys currently rendered | Must NOT render |
|------------|----------------------------------|-----------------|
| Task | `requirements` | Parent req is NOT a child |
| UseCase | `tasks` | Parent task is NOT a child |
| Class | `useCases` | Parent UC is NOT a child |
| Method | `classes` | Parent class is NOT a child |
| Implementation | `methods`, `requirements` | Parents are NOT children |
| Test | `implementations`, `methods`, `requirements` | Parents are NOT children |

### Implementation Pattern (expert copy-paste)

Add ONE shared helper (e.g., in a new `trace-utils.ts` or inline in each file):

```typescript
function forwardOnly(obj: TraceObject): Record<string, string[]> {
  const all = obj.toJSON().links;
  const fwd = FORWARD_KEYS[obj.type] || [];
  const result: Record<string, string[]> = {};
  for (const key of fwd) {
    if (all[key]) result[key] = all[key];
  }
  return result;
}
```

Replace `renderLinks(this.graph, links)` with `renderLinks(this.graph, forwardOnly(obj))` in all 6 DetailViews.

For `rb-trace-tree.ts`: replace line 91 with `const childRefs = obj.children.map(c => c.ref());` — the `children` getter on TraceObject (T175, line 139) already implements the FORWARD_KEYS filter via `graph.resolve()`.

### Browse Source Fix (rb-task-detail.ts:41)

Current: `<a href="/md/scrum.pmo/sprints/">📄 Browse source</a>` — hardcoded to generic dir.

Fix: construct from task model data:
```typescript
const slug = obj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^t(\d+)/, 'task-$1');
const sprint = obj.sprint || '';
const href = sprint ? `/md/scrum.pmo/sprints/${sprint}/${slug}.md` : '/md/scrum.pmo/sprints/';
```

### Rule-pair: (a)+(b) REQUIRED, (c) STATIC_SHELL REQUIRED
DetailView bundle changes → client-side code changes → sw.js CACHE_NAME bump needed.

## Subtasks
None (atomic task — single renderer audit + fix pass + new audit script).

## QA Audit & User Feedback
- 2026-06-04: PO directs T181 stand-up — Tron live /trace shows Task DetailView rendering 'requirements' back-link despite T172 (strict-direction) + 0-issue sprint audit. **DATA is clean** (planner re-verified 2026-06-04: ZERO scenario units carry prohibited backward fields). **DISPLAY is the violator** — a DetailView template emits a back-link the data does not declare. Architect diagnoses; expert removes; tester verifies live /trace (SW active per strict-bar 2b).
- 2026-06-04: Pre-flight scan confirmed audit blind spot — existing audits inspect DATA only, not DISPLAY. T181 AC9 adds a DISPLAY-side audit script (extends T170 strict gate).
- 2026-06-04: **FOLDED (PO 2026-06-04):** forward-only-TREE fix at `rb-trace-tree.ts:91` (`obj.children`) and `rb-trace-tree.ts:69` (`walk(r.ref())` recursion) — the TREE renderer is part of the DISPLAY surface; its `children` accessor must be forward-only (per the Tree class from T175 with `chainPosition.below`). Any walk that follows reverse links violates the same R-U rule. Architect to extend per-DetailView audit table to include rb-trace-tree.ts; expert fixes both line ranges in same commit as the DetailView fixes; tester verifies tree expand only walks the forward chain (req→task→uc→class→method→impl→test) with SW active per strict-bar 2b.
- Pending: architect produces per-DetailView + per-tree-walker audit table → expert removes back-link rendering in DetailViews AND fixes rb-trace-tree.ts:91/:69 forward-only walk + adds CI script → tester verifies live /trace with SW active → Tron QA closes the forward-only DISPLAY guarantee.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 37 — R-U (strict forward-only DISPLAY — close the DATA-vs-DISPLAY gap)
**Follows:** T172 (DATA back-ref strip) · T168 (LOCKED 7-step) · T159/B18 (Prohibited Fields rule) · Strict Verify Bar
**Unblocks:** Tron's confidence that forward-only is enforced end-to-end (DATA → DISPLAY)
**Rule-pair scope:** (a)+(b) required; (c) STATIC_SHELL per architect declaration (DetailView bundle change likely requires).
