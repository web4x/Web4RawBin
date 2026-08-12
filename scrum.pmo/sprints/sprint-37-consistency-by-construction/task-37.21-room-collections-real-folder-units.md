<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.21: Room Members/Files become real Folder scenario-units with sunburst detail (rides R40.16, no dup)

[task:uuid:1bf4acc5-4c9b-41a2-9284-b30d323cfbdf]

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

Deliver R37.21: room Members/Files pseudo-collections resolve to REAL Folder scenario-units with R40.16's child-size sunburst detail; reuse R40.16's folder-as-unit + sunburst, do not duplicate. Architect wires to R40.16 first (scenario-first #126).

## Context

Covers R37.21 (80346a36) via UC roomCollection.asRealFolderUnit (c2d40f62); RIDES R40.16 cc875e35 (no dup).

## Intention

Tron 2026-08-12: in-room Files/Members show 'no scenario'; should be a real folder unit with sunburst. Find the corresponding task (=R40.16) + wire.

## Acceptance Criteria

- [ ] AC-B-real-folder-unit: room members-/files- pseudo-collections -> REAL Folder units (not 'no scenario').
- [ ] AC-B-sunburst-rides-R40.16: folder detail = child-size sunburst, REUSING R40.16 (no duplicate model/renderer).
- [ ] AC-B-DEVICE [@390 Tron]: in-room Files/Members render as real folder + sunburst, verified on device.

## Implementation

NOT STARTED (scenario-first #126). Architect designs; expert builds; req mints chain+Test. Units on disk BEFORE implementation.

## Subtasks

None (architect may split at design).
