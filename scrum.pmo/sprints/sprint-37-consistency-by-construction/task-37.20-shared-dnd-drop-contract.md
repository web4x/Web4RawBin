<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20: ONE shared DnD drop contract — buffer carries the scenario unit (not a URL/webitem), file-drags-as-file, details render, fleet-wide every drop target

[task:uuid:ae01f065-bb0b-413e-bdd4-ee97f2fa94ba]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver R37.20: a single shared serializer+resolver so the DnD buffer always carries the scenario UNIT (never a *.show URL), a file drags as a file, detail views render, and every drop target (diagram/room/tree/editor) reuses ONE contract with no URL fallback. Architect designs the shared serializer/resolver first (scenario-first #126).

## Context

Covers R37.20 (03e0f803) via UC dnd.carryUnitPayload (5474886a). Chain pending architect drop-contract design.

## Intention

Tron 2026-08-12 overnight: dragging /model tree files produced #collection.show/#webitem.show URLs (generally wrong) + empty detail views; amendment makes the contract fleet-wide.

## Acceptance Criteria

- [ ] AC-A1-file-drags-as-file: a FILE drags as a FILE not a collection.
- [ ] AC-A2-buffer-carries-unit: payload = scenario UNIT JSON, NEVER a *.show?uuid= URL/webitem, ALWAYS.
- [ ] AC-A3-details-render: detail views render for every /model tree selection.
- [ ] AC-shared-contract-fleet-wide: ONE serializer + ONE resolver, every drop target reuses it, no per-target format, no URL fallback.
- [ ] AC-BITE-per-target-stub-must-fail: BITE per target (diagram/room/tree/editor) + emit-URL-again->RED.
- [ ] AC-6-DEVICE [@390 Tron]: file drags as file + drops carry unit + details render, verified on device.

## Implementation

NOT STARTED (scenario-first #126). Architect designs; expert builds; req mints chain+Test. Units on disk BEFORE implementation.

## Subtasks

SLICED per-AC (2026-09-06, PO+req: nothing drifts to unscheduled; SLICE-A upload covered only AC-A2 partial). RESOLVER-HALF FIRST (serializer without resolver = half a contract). Each slice covers its R37.20 AC with its OWN status:
- [Task 37.20.1: RESOLVER half — one resolver](./task-37.20.1-resolver-half-one-resolver.md) `[task:uuid:68364f5e-4392-4d2d-ada5-819060b05110]` (AC-resolve-drop-payload)
- [Task 37.20.2: a file drags as a file](./task-37.20.2-file-drags-as-file.md) `[task:uuid:3dd05daa-d552-4ba2-9642-ae687446805a]` (AC-A1)
- [Task 37.20.3: details render every /model selection](./task-37.20.3-details-render-every-selection.md) `[task:uuid:82c0c01f-e3f3-44b7-b2bb-129ae3472c25]` (AC-A3)
- [Task 37.20.4: ONE shared serializer+resolver fleet-wide](./task-37.20.4-shared-contract-fleet-wide.md) `[task:uuid:369b8636-f449-45cd-b553-c523112d26b3]` (AC-shared-contract + AC-A2 fleet)
- [Task 37.20.5: per-target BITE stub-must-fail](./task-37.20.5-bite-per-target-stub-must-fail.md) `[task:uuid:4c083193-699c-44b9-85bd-0f61f9c57e88]` (AC-BITE)
- [Task 37.20.6: DEVICE @390 Tron acceptance](./task-37.20.6-device-390-tron-acceptance.md) `[task:uuid:53571e22-2c58-4451-8e05-6bfb76647008]` (AC-6-DEVICE)
