[Back to Sprint 17 Planning](./planning.md)

# T168: Chain order 7-step + atomic requirements as tree ROOTS

[task:uuid:c3951691-b231-4b60-a2f8-79c9d5ef851e]

## Status — 📝 refinement done (architect c28c982)
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — **`c28c982` architect design committed: 7-step canonical chain LOCKED + requirements as roots**)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> Sync per rule #11 (committed reality): `c28c982` lands the design;
> refinement box checked. Expert next. QA Review + Done remain Tron's gate.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02:**
1. **robbin-req** — anchor the verbatim Tron R-E quote from `compound-requirement-source-2.md` (Tron completion); confirm the 7-step canonical chain order: **requirement → task → usecase(s) → class → method → implementation → test(s)** (PO amendment 2026-06-02 extended chain to test as final node)
2. **robbin-architect** — design the canonical chain enforcement: `TraceModel` walk order, ViewGenerator template chain-rendering, tree builder root-set selection (atomic requirements only), validator update; update `scrum.pmo/standards/traceability-standard.md` to reflect the 7-step order + roots-are-atomic-requirements rule; update Sprint 17 chain documentation
3. **robbin-expert** — implement per design (model walk + template + tree builder + validator); rule-pair (a)+(b)
4. **robbin-tester** — verify chain walk order in `/api/trace`, `/trace` UI, generated MD views, and chain audit; ensure every tree root is an atomic requirement; ensure every test node is reachable from a requirement root via the 7-step chain

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:c3951691-b231-4b60-a2f8-79c9d5ef851e]`

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) → **R-E** (Tron completion 2026-06-02; PO chain-to-test amendment same day)
  - **R-E Canonical chain order 7-step + atomic requirements as tree roots**
    `[requirement:uuid:12f6f7d1-1fd0-4f44-acd1-fb59c01e7f62]`
    > TRON DIRECTIVE: "traceability has to start with atomic requirements. tracing to tasks to many usecases to one class to one method to one implementation"
    > TRON AMENDMENT 1: "implementation traces finally to test"
    > TRON AMENDMENT 2: "one implementation can have multiple tests"
    **PO amendments 2026-06-02 (chain LOCKED):**
    - Chain extends to **test(s)** as final node:
      `requirement → task → usecase(s) → class → method → implementation → test(s)`
    - **Cardinality: Implementation:Test is 1:N** — Implementation carries an
      IOR array `tests[]`; one impl can map to multiple tests.
    - Plural points (`usecase(s)`, `test(s)`) signal 1:N branching at those
      hops; other hop cardinalities are architect-confirmed but at minimum
      these two are explicit.
    **Source commits:** `bfae071` + `2be6e96` + `7e01491` (req-eng captures of
    R-A through R-G in compound-requirement-source-2.md).
- down
  - None (atomic at parent level; architect may split T168.x if scope warrants)
- follows
  - [T143: chain → tree rework (R17.26-R17.29)](./task-143-traceability-tree-rework.md) — parent direction (tree model)
  - [T134: TraceLink as units](./task-134-traceability-as-units.md) — current chain model T168 finalizes
  - [T165: tree renders ALL 7 typed classes](./task-165-tree-renders-all-7-typed-classes.md) — visual surface for the 7-step chain
  - [T117: UseCase as class instances in PUML](./task-117-usecase-as-class.md) — UC link in chain (S16)
- chain (req → task → usecase(s) → class → method → implementation → test(s); 1:N at plural hops) — this task IS the canonical chain spec
  - **requirement:** R-E (above)
  - **use case:** UC-TBD (architect — likely `trace.chain.canonicalOrder`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** `TraceModel.walk()`, `traceability-standard.md`, ViewGenerator templates — TBD
  - **implementation:** TBD
  - **test:** chain-walk validator + visual on `/trace` — TBD

## Context

Tron R-E (compound-requirement-source-2 completion 2026-06-02): the canonical
traceability chain order is **requirement → task → usecase → class → method →
implementation → test** (7 steps). Atomic requirements are tree **ROOTS** —
nothing parents them; everything else descends from a requirement.

PO amendment 2026-06-02: the chain extends to **test as the final node**
(originally implied: req → task → usecase → class → method → implementation;
PO clarification: add test as terminal). This becomes the canonical 7-step
chain.

Today's model is partly there (T134 TraceLink, T143 tree direction, T160
forward-only refs, T165 7-class tree) but the canonical ordering isn't
formally enforced and the standard doc may be silent on the final test node.

## Intention

### Why this task exists
The chain order is now canon; tooling and docs must match. Tree roots being
atomic requirements is the rule for "every instance is reachable from a req"
(R-F).

### Problems this task solves
- Chain order isn't formally enforced in TraceModel walks / templates
- Tree builder roots may include non-requirement types
- `traceability-standard.md` may not specify the final test-node step
- Sprint 17 chain documentation needs update

### How it solves them
- Architect updates the standard + adds the enforcement (model + templates +
  validator) so the 7-step order is mechanically checked
- Tree builder root-set = atomic requirements only
- Chain audit confirms every test node has a path back to a requirement

## Acceptance Criteria
- [ ] AC1 — `TraceModel.walkDown(requirement)` follows the canonical 7-step order: req → task → usecase(s) → class → method → implementation → test(s); 1:N branches at usecase and test hops are walked correctly
- [ ] AC1b — `Implementation.tests[]` IOR array surfaces in scenario index + `/api/trace` graph; 1:N cardinality enforced in model
- [ ] AC2 — Tree builder for `/trace` produces ROOTS = atomic requirements only (no other types appear as roots)
- [ ] AC3 — `scrum.pmo/standards/traceability-standard.md` documents the 7-step order + roots-are-requirements rule
- [ ] AC4 — Sprint 17 chain documentation (planning.md / requirements.md) reflects the 7-step + test-as-final-node
- [ ] AC5 — Chain audit (`trace-cli` or equivalent) confirms every test node is reachable from a requirement root via the canonical chain
- [ ] AC6 — Generated MD views render the chain in canonical order
- [ ] AC7 — No regression on T134/T143/T160/T161/T163/T165/T166
- [ ] AC8 — `npm run build` succeeds; all existing tests pass
- [ ] AC9 — **Rule-pair (a)+(b) [#15+#16]:** package.json bump + sw.js CACHE_NAME bump in same commit-set; (c) STATIC_SHELL — architect confirms (likely exempt)

## Test Scenarios
File: extend `test/vitest/trace-model.test.ts` + `test/e2e/trace-chain.spec.ts`.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | `walkDown` from a sample requirement | Visits in order req → task → uc → class → method → impl → test (skipping types that don't exist for that req) |
| TS2 | Enumerate `/trace` tree roots | All roots are atomic requirements; no other types |
| TS3 | Pick a test node, walk up | Reaches a requirement root via the canonical reverse chain |
| TS4 | Inspect `traceability-standard.md` | Documents 7-step order + roots rule |
| TS5 | Chain audit run | 0 orphan tests (every test reachable from a req via 7-step chain) |
| TS6 | Generated MD view of a UseCase | Chain rendered in canonical order |
| TS7 (regression) | T134/T143/T160/T161/T163/T165/T166 behavior | Unchanged |
| TS8 | Rule-pair post-bump | New CACHE_NAME activates |

## Dependencies
- **Requires:** T134 (TraceLink units), T160 (forward-only repopulation), T165/T166 (7-class tree surface), T143 (tree direction)
- **Coordinate-with:** T169 (data-quality audit + remigrate — uses T168's canonical order as the audit rule), T167 (mobile layout — visual surface)
- **Enables:** R-F audit (T169) has a canonical rule to audit against

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors verbatim Tron R-E quote + PO amendment when Tron completes the cut sentence.
2. **robbin-architect** designs the enforcement (model + templates + validator); updates `traceability-standard.md`; writes Design section.
3. **robbin-expert** implements per design; carries rule-pair (a)+(b).
4. **robbin-tester** runs TS1-TS8 + chain audit; commits verification to QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] Standard + Sprint 17 chain doc updated
- [ ] Chain audit clean: every test reachable from a requirement root via the 7-step chain
- [ ] No regression on T134/T143/T160/T161/T163/T165/T166
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-02: PO directed planner-first stand-up of T168 (R-E from compound-source-2 Tron completion + PO chain-to-test amendment same day). CMM4 4-role; real v4 uuids; rule-pair (a)+(b) in AC9+DoD. Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.
- 2026-06-02: robbin-req anchored verbatim Tron R-E quote + both amendments in traceability section.

## Design (Architect — robbin-architect, 2026-06-02)

### The 7-Step Canonical Chain (LOCKED)

```
requirement → task → usecase(s) → class → method → implementation → test(s)
    ROOT        1:1      1:N        1:1    1:N         1:1            1:N
```

| Step | Type | Cardinality | Forward field | LEAF? |
|------|------|-------------|---------------|-------|
| 1 | requirement | ROOT | `tasks[]` | NO |
| 2 | task | 1:1 from req | `useCases[]`, `subtasks[]` | NO |
| 3 | usecase | 1:N from task | `classes[]` | NO |
| 4 | class | 1:1 from UC | `methods[]` | NO |
| 5 | method | 1:N from class | `implementations[]` | NO |
| 6 | implementation | 1:1 from method | `tests[]` (NEW) | NO |
| 7 | test | 1:N from impl | — | YES (LEAF) |

Plural hops: task→usecase(s), class→method(s), implementation→test(s).

### Tree Root Rule

Atomic requirements are the ONLY tree roots:
```typescript
const roots = this.graph.ofType('requirement');
// NO fallback to graph.all()
```

### Canonical Walk Order

Replace unordered link walk with canonical order:
```typescript
const CANONICAL_WALK: Record<string, string[]> = {
  requirement:    ['tasks'],
  task:           ['subtasks', 'useCases'],
  usecase:        ['classes'],
  class:          ['methods'],
  method:         ['implementations'],
  implementation: ['tests'],
  test:           [],
};

function orderedChildRefs(obj: TraceObject): string[] {
  const order = CANONICAL_WALK[obj.type] || [];
  return order.flatMap(key => obj.toJSON().links[key] || []);
}
```

Replace `Object.values(obj.toJSON().links).flat()` in `nodeEl()` with `orderedChildRefs(obj)`.

### Implementation.tests[] — New IOR Array

```typescript
// TraceModel.ts ImplementationObject — NEW field:
tests: string[] = [];  // 1:N IOR refs to TestObject UUIDs
```

Scenario JSON:
```json
{ "model": { "chainType": "implementation", "tests": ["uuid-1", "uuid-2"] } }
```

### Validator: auditCanonicalChain()

1. Every tree root is type `requirement`
2. Every requirement reaches at least one `test` via 7-step walk
3. Walk follows CANONICAL_WALK order (no skipped hops)

### Standard Update (traceability-standard.md)

1. Replace 6-step chain (lines 12-27) with 7-step canonical
2. Replace "Bidirectional Verification" (lines 134-148) with forward-only (T159)
3. Replace "Cross-Reference Rules" (lines 124-131) — remove "task MUST link up" (T159 violation)
4. Add Implementation.tests[] to tag format table
5. Add cardinality at plural hops

### R-A Diagnosis Collision Note

My earlier R-A diagnosis (HTML task-status checklist — renderStatusHtml emojis + missing CSS) was queued for T167, but planner reassigned T167 to R-D (mobile-first). R-A overlaps T132. NOT committing R-A to T167. Awaiting planner's T-number assignment.

### Files to Modify

| File | Change |
|------|--------|
| `src/ts/shared/TraceModel.ts` | CANONICAL_WALK, Implementation.tests[], orderedChildRefs() |
| `src/public/ts/trace/rb-trace-tree.ts` | orderedChildRefs() in nodeEl(); lock roots |
| `src/ts/server/TraceConsistency.ts` | auditCanonicalChain() |
| `scrum.pmo/standards/traceability-standard.md` | 7-step chain, forward-only, Implementation.tests[] |
| `diagrams/s17-usecases.puml` | Add UC_CHAIN |
| `package.json` + `sw.js` | Rule-pair (a)+(b) |

STATIC_SHELL (c): exempt.

## Subtasks
None at parent level (architect may split if scope warrants).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 (canonical chain enforcement)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (foundational — T169 audit depends on this canonical rule)*
