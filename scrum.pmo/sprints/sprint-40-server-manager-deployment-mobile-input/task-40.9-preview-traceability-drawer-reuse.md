<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.9: 'Preview' = traceability chain + details drawer, REUSING /trace + rb-detail-drawer (no bespoke renderer)

[task:uuid:cc3fa868-91e9-4d1e-8c2e-4b558b779d8a]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.9 (Preview = traceability + details drawer, REUSE not bespoke). Scenario-first: req minted R40.9 50753cf6 (515f743b8); coveredRequirements + useCases 23af7ba9 wired; ACs MIRRORED (3 AUTOMATABLE source/@390). Architect designs the chain. No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.9 `[requirement:uuid:50753cf6-59e8-4251-84e0-7d54f988ce76]`
  - down
    - None (atomic task)

## Task Description

R40.9 (Tron: 'preview should show that scenario's traceability and the details drawer'). The editor footer 'Preview' tab renders the scenario's traceability chain and opens the details drawer for a selected node — REUSING the existing /trace + rb-detail-drawer surfaces (no bespoke preview renderer; same DRY spirit as R40.5). Reuse /trace + rb-detail-drawer, NO fork. Scenario-first: req mints R40.9 + ACs; architect designs; expert implements; tester gates @390.

## Acceptance Criteria

- [ ] [AUTOMATABLE, source, stub-must-fail] Preview REUSES the existing trace + rb-detail-drawer components (grep proves NO bespoke preview renderer — plant a bespoke renderer -> gate RED; DRY like R40.5).
- [ ] [AUTOMATABLE @390 real-WebKit] Preview renders the selected scenario's traceability chain (the /trace surface).
- [ ] [AUTOMATABLE @390 real-WebKit] The details drawer opens for a selected node (the rb-detail-drawer surface).

## Subtasks

None (atomic task).
