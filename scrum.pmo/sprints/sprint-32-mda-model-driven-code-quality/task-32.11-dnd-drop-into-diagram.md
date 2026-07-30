<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.11: DnD drop into the /model diagram not working (Tron device-QA) — the drop IS the vision, being fixed

[task:uuid:42555b04-f47e-4d56-9fab-987fafc1df2b]

## Status
- [x] Planned
- [x] In Progress
  - [~] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

OPEN (Tron device-QA). Architect DIAGNOSING root cause. req to canonicalize R32.11 (placeholder d981876f) + formalize ACs → expert fixes the drop handler → tester gates the drop @390 on real device.

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.11 `[requirement:uuid:d981876f-4816-4cd0-b3e3-e28ed02c787d]` (Tron device-QA; placeholder — req canonicalizes)
  - down
    - None (atomic task)

## Task Description

Tron device-QA (2026-07-30): dragging/dropping an itemView into the /model diagram does NOT work on the device — the drop→generate→view interaction (the core R32.5/R32.8 go-live path) fails. This is being FIXED, not demoted — the drop IS the MDA go-live vision. Architect diagnosing the root cause (device DnD event/handler on the diagram surface).

## Context

Scenario-first (Tron device-QA reopen-family, S32): architect DIAGNOSING; req to formalize R32.11 (placeholder d981876f, canonicalize in place). Sibling of the T32.9/T32.10 device-QA findings (all 'gated-loads-not-works' — gate at the real interaction @390, not page-load).

## Intention

Make the /model diagram DROP interaction actually work on Tron's device — drop an itemView → generate/re-sync → the model view (tree/diagram/edges) renders. Gate the DROP @390.

## Acceptance Criteria

- [ ] The DnD drop of an itemView into the /model diagram WORKS on the device (drop event reaches the handler; not swallowed).
- [ ] Drop → generate/re-sync → the model view (tree/diagram/edges) renders the dropped source.
- [ ] Gated at the DROP INTERACTION @390 (Tron viewport) — not page-load; a real device drop, not a synthetic dispatch. (req to formalize full ACs.)

## Subtasks

None (atomic task).
