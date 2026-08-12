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

None (architect may split at design).
