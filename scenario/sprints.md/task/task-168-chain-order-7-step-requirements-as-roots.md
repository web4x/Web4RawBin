# T168: Chain order 7-step + atomic requirements as tree ROOTS
[task:uuid:c3951691-b231-4b60-a2f8-79c9d5ef851e]

## Status

- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

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

## QA Audit & User Feedback

- 2026-06-02: PO directed planner-first stand-up of T168 (R-E from compound-source-2 Tron completion + PO chain-to-test amendment same day). CMM4 4-role; real v4 uuids; rule-pair (a)+(b) in AC9+DoD. Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.
- 2026-06-02: robbin-req anchored verbatim Tron R-E quote + both amendments in traceability section.

## Subtasks

None at parent level (architect may split if scope warrants).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 (canonical chain enforcement)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (foundational — T169 audit depends on this canonical rule)*
