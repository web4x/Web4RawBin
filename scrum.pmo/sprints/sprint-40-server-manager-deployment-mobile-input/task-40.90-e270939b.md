<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.90: expandPath waitForNode TIMEOUT on the room ROOT node (tester-observed, un-owned symptom — tracked defect)

[task:uuid:e270939b-3239-4912-a48c-fddaf9152da6]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned 2026-09-05 (PO GO). Planned. SYMPTOM-ONLY, root UNOWNED — architect diagnoses the root BEFORE any fix; do NOT imply a known root. NOT attached to R40.84. UC full-uuid bf89dd5c-4835-4066-a2e2-9531e21d6cc4 resolved from R40.90.useCases[] on disk (NOT fabricated). ACs mirrored from the req (no-drift). Minted LOCAL (push-freeze), path-limited. req reverse-wires R40.90.tasks[]. 0 Done till Tron.

## Task Description

Planned. SYMPTOM-ONLY, root UNOWNED — architect diagnoses the root BEFORE any fix; do NOT imply a known root. NOT attached to R40.84. Covers R40.90 (393e297a), UC bf89dd5c. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

Planned. SYMPTOM-ONLY, root UNOWNED — architect diagnoses the root BEFORE any fix; do NOT imply a known root. NOT attached to R40.84.

## Intention

Board-track R40.90 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

Mirrors R40.90 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-symptom-literal: LITERAL SYMPTOM (verbatim so an intake search by what the tester SEES finds it): expandPath waitForNode TIMEOUT on the room ROOT node. Observed REPEATEDLY by the tester.
- [ ] AC-root-unowned-symptom-only: the ROOT is NOT yet owned; this captures the SYMPTOM + the correct shape ONLY (expandPath should resolve the room root without timeout); do NOT build a fix until the root is diagnosed (architect).
- [ ] AC-distinct-from-r40.84: DISTINCT from R40.84 and NOT attached — folders render via the reDerive IN-PLACE path (Impl 8693dc2b), NOT via expandPath; this timeout did NOT affect the R40.84 verdict.
- [ ] AC-expandpath-resolves-root-no-timeout: the EVENTUAL gate (once the root is known + fixed): expandPath waitForNode RESOLVES the room ROOT node WITHOUT timeout; a waitForNode timeout on the room root => RED.

## Subtasks

None (atomic task).
