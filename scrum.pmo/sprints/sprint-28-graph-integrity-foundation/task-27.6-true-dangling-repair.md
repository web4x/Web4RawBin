<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.6: Repair the true-dangling refs surfaced by the ref-slot registry

[task:uuid:600fa089-c8a4-4977-a89b-504969e78170]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 28 Planning](./planning.md)
    - Requirement (uuid:3a7d4df2-7588-4b09-a959-21708d68b8b1)
  - crossRef
    - R27.5 (the registry that surfaces the inventory) + R27.4 (naive-count predecessor) + R24.5 (CI gate)
  - down
    - [UC: traceAudit.repairTrueDangling](./planning.md) `[uc:uuid:a07def59-1e57-40bc-9b92-7c64b1229516]`

## Task Description

Repair the 96 TRUE-dangling refs the R27.5 registry surfaces (Method.implementation 51 + Test.parent 32 + Test.verifies 12 + Test.methods 1) — triage each repoint-to-live OR drop-with-reason, dry-run+count, atomic+rollbackable, all four slot counts -> 0.

## Context

The REAL debt hidden under the token/walk-gap noise (only visible AFTER R27.5's honest inventory). GATED repair, same discipline as R27.2/R27.4. Depends on R27.5 (needs the registry first). ★ MEASURED SCOPE (R27.5 registry, architect): true-dangling repair inputs = dangling chain=212 / data=9; orphans ~397 real (+~394 orphan-by-design EXEMPT + TestCase706 back-edge under-pop); Axis-3 sprawl=4 (triage allowlist-vs-dedup); chain-less markers=75. These are R27.6 build inputs.

## Intention

S28 Graph-Integrity Foundation. STOOD UP scenario-first; implementation awaits Tron go (not urgent, foundational).

## Acceptance Criteria

- [ ] (repair) The true-dangling inventory is enumerated per slot: Method.implementation (51) + Test.parent (32) + Test.verifies (12) + Test.methods (1), full-uuid verified (no prefix collisions), token false-positives excluded.
- [ ] (repair) Each true-dangling ref is triaged repoint-to-live-target OR drop-the-ref with a reason; dry-run + count FIRST, never silently drop a real edge.
- [ ] (repair) Repair is atomic + rollbackable + self-reassert (all four slot counts -> 0 on the mutated disk), same gated discipline as R27.4.
- [ ] (repair) Post-repair, every ref-slot in the canonical registry (R27.5) resolves; no back-edge (ownerIor/Test.methods/Test.parent/Test.verifies) or forward-edge dangles.
- [ ] (ci-gate) trace:audit:strict (R24.5) using the R27.5 registry FAILS on any true-dangling ref -> recurrence prevented by construction.
- [ ] (verify) Post-repair re-measure via the registry: Method.implementation/Test.parent/Test.verifies/Test.methods dangling all = 0.

## Implementation

STOOD UP (planning) — status Planned, implementation awaits Tron go. Grounded in architect ref-slot registry design (05da0584a/76c3a102b).

## Subtasks

None (atomic task).
