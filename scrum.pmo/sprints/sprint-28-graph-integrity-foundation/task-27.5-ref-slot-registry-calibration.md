<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.5: Canonical ref-slot registry + trace-audit calibration

[task:uuid:179fafeb-0f00-4d64-be9f-e007f9801721]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [~] testing (tester gating axes 2-4 + bridging Test hops)
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 28 Planning](./planning.md)
    - Requirement (uuid:f48fbf5d-e75e-43c3-9a0c-80bbd6e503bc)
  - crossRef
    - R27.6 (consumes the registry's honest inventory) + R24.5 (the trace-audit tool)
  - down
    - [UC: traceAudit.refSlotRegistry](./planning.md) `[uc:uuid:5ff15c57-503c-45f7-a4c0-82f7969d3646]`

## Task Description

Build the canonical ref-slot registry (every ref-bearing slot: class/classes[]/method/parent/ownerIor/implementation/verifies/methods), tag each forward/back/cross + classify token/edge/self so back-edges and ~500 auth-token false-positives are excluded, and calibrate the trace-audit orphan metric so a non-zero count means REAL debt.

## Context

Foundational (architect registry 05da0584a/76c3a102b): today's ~2207 orphan/dangling count is mostly token/walk-gap noise -> untrustworthy. The registry + calibration make the metric honest. Correct-by-construction root fix (fixes slot-miss + miscalibration in ONE registry).

## Intention

S28 Graph-Integrity Foundation. STOOD UP scenario-first; implementation awaits Tron go (not urgent, foundational).

## Acceptance Criteria

- [ ] (registry) A canonical ref-slot registry lists every ref-bearing slot {class, classes[], method, methods[], ownerIor, children, implementations, tests, requirements, tasks, useCases, parent, coveredRequirements, subtasks, verifies}; every migration + audit imports it so no slot is scanned ad-hoc.
- [ ] (registry) Each slot is tagged forward / back / cross and classified token/edge/self, so back-edges (ownerIor, Test.methods) and cross-refs are covered, not just forward chain.
- [ ] (registry) ~500 auth-token false-positives (non-ref token strings) are classified as token (not edge) and excluded from the dangling/orphan counts.
- [ ] (calibrate) trace-audit orphan metric calibrated: non-chain types added to ORPHAN_BY_DESIGN + Requirement->tasks + Sprint-roots added to the walk (the benign ~2207 metric drops to real chain-orphans).
- [ ] (calibrate) After the registry + calibration, a non-zero orphan/dangling count indicates REAL debt (trustworthy enough to hard-gate); R27.6's true-dangling inventory is measurable against it.
- [ ] (verify) Re-run trace:audit: token false-positives excluded, all slots covered, metric reflects only real chain debt.

## Implementation

IN PROGRESS. All 5 axes built + credited (5f34dde7e): refSlot registry + ref-integrity axes. implementing[x]. testing[~] — tester gating axes 2-4 + bridging the Test hops. Status stays In-Progress until tester GREEN -> QA Review/Done.

## Subtasks

None (atomic task).
