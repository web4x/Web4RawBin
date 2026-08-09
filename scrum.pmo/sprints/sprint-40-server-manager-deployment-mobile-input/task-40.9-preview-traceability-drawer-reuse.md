<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.9: 'Preview' = traceability chain + details drawer, REUSING /trace + rb-detail-drawer (no bespoke renderer)

[task:uuid:cc3fa868-91e9-4d1e-8c2e-4b558b779d8a]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

QA-Review (units-win; planner disk-verified BOTH directions + tester two-key CLOSED): chain-complete-to-Test — Impl 0ed5cd75 (ModelView.previewTraceability, reuse /trace + rb-detail-drawer no-fork) tests[]=[a1e8d3f7] <-> Test a1e8d3f7.implementations[]=[0ed5cd75], status=pass, ownerIor=0ed5cd75 (single-impl, clean, no cross-wire). Tester KEY-2 two-key CLOSED both-dir + PUSHED (01addbba1, origin==b0d0f5a17). All In-Progress sub-steps [x]. Done-gate [ ] = Tron's act (R40.10 approve-control). Board re-derived from units (PO campaign 2026-08-09).

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.9 `[requirement:uuid:50753cf6-59e8-4251-84e0-7d54f988ce76]`
  - down
    - None (atomic task)

## Task Description

R40.9 (Tron: 'preview should show that scenario's traceability and the details drawer'). The editor footer 'Preview' tab renders the scenario's traceability chain and opens the details drawer for a selected node — REUSING the existing /trace + rb-detail-drawer surfaces (no bespoke preview renderer; same DRY spirit as R40.5). Reuse /trace + rb-detail-drawer, NO fork. Scenario-first: req mints R40.9 + ACs; architect designs; expert implements; tester gates @390.

## Acceptance Criteria

- [x] [AUTOMATABLE, source, stub-must-fail] Preview REUSES the existing trace + rb-detail-drawer components (grep proves NO bespoke preview renderer — plant a bespoke renderer -> gate RED; DRY like R40.5).
- [x] [AUTOMATABLE @390 real-WebKit] Preview renders the selected scenario's traceability chain (the /trace surface).
- [x] [AUTOMATABLE @390 real-WebKit] The details drawer opens for a selected node (the rb-detail-drawer surface).

## Subtasks

None (atomic task).
