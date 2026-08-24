<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.37: Context-sensitive actions — invalid-for-type/status actions are NOT offered (universalActionBar per-action applicability); server guard stays defense-in-depth

[task:uuid:2e831ffd-5eba-45ce-961e-25195b2071a3]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.37 `[requirement:uuid:a3cdb98a-cde7-4b3a-94f9-bd301dbf26f8]`
  - down
    - [UC applicability](./planning.md) `[uc:uuid:1de961e7-5f64-4768-af31-7e7de8063ed5]`
    - [UC folder-create](./planning.md) `[uc:uuid:0c58eb53-73fc-4e4d-97d4-dbe729cc0916]`

## Task Description

Deliver R40.37: an action invalid for the unit's TYPE/STATUS is NOT offered (hidden or disabled-with-reason), not clickable-then-refused. Capability lives ONCE in the SHARED universalActionBar, declared per-action (valid types+statuses), NOT per-view if-statements. Approve/Decline only at QA Review; container actions (+Add Diagram/Add folder/Import PUML) never on a Task; +Add Diagram only on the diagrams SPECIAL container; Add folder immediately MINTS a real persisted Folder scenario-unit (no mkdir/no fs dir; the itemview becomes the unit at once, atomicity = the unit write). Server guard REMAINS (defense-in-depth). Architect designs the applicability model FIRST (scenario-first #126).

## Context

Covers R40.37 (a3cdb98a) via UC universalActionBar.applicableActionsFor (1de961e7) + folder.createPhysicalWithUnit (0c58eb53). Chain (Class/Method/Impl) pending ARCHITECT applicability-model design. Server-side approve/decline guard (correct refusal Tron saw) stays as defense-in-depth — this task fixes the UI OFFERING, not the guard.

## Intention

Tron-ordered 2026-08-12: he hit Approve on Done Task 32.0, got the correct refusal, but the button should not have been offered. New ordered work = ACTIONABLE 0->1.

## Acceptance Criteria

- [ ] AC-CONTEXT-SENSITIVE-ACTIONS: an action invalid for the unit TYPE/STATUS is NOT offered (hidden or disabled-with-reason), not clickable-then-refused; server guard REMAINS defense-in-depth (never removed to fix a UI affordance).
- [ ] AC-APPROVE-DECLINE-ONLY-AT-QA: Approve/Decline appear only when status == 'QA Review'.
- [ ] AC-NO-CONTAINER-ACTIONS-ON-TASKS: '+ Add Diagram' / 'Add folder' / 'Import PUML' are NOT offered on a Task.
- [ ] AC-DIAGRAMS-IS-A-SPECIAL-CONTAINER: '+ Add Diagram' only on the diagrams SPECIAL container (diagrams = special typed folder, not generic).
- [ ] AC-ADD-FOLDER-MINTS-REAL-UNIT-IMMEDIATELY: 'Add folder' IMMEDIATELY MINTS a real PERSISTED Folder scenario-unit on disk (NOT a filesystem directory — NO mkdir, NO fs write); the itemview BECOMES that unit at once; atomicity = the unit write (if it FAILS, nothing changes + NO phantom itemview node). [TRON CLARIFICATION 2026-08-12: 'physical' = a persisted unit, not an fs dir]
- [ ] AC-6-DEVICE [device-only @390 pixel, Tron on phone, un-mockable, NEVER headless-green, TRON-ONLY]: Tron verifies on his phone the impossible buttons are gone AND folder-create works (turns the device bucket when this reaches QA Review).

## Implementation

NOT STARTED (scenario-first). Architect designs the applicability model (per-action declaration in universalActionBar); expert builds; req mints chain + Test; scenario units on disk BEFORE implementation (#126).

## Subtasks

None (atomic; architect may split at design).
