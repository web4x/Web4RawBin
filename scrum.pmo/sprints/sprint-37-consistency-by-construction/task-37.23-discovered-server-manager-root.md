<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.23: Server-manager root discovered from ssh config on disk (like otmux tree items), not hardcoded WODA.prod

[task:uuid:d6dae432-bf5b-4a97-a967-6f98cf096a52]

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

Deliver R37.23: the server-manager root host is read from on-disk config (ssh config), the way otmux tree items are discovered; on WODA.test the root = WODA.test. Architect designs the discovery first (scenario-first #126).

## Context

Covers R37.23 (185fffc7) via UC serverManager.discoverRoot (428caca1).

## Intention

Tron 2026-08-12: on WODA.test the server-manager root is still hardcoded WODA.prod; must be discovered from config on disk.

## Acceptance Criteria

- [ ] AC-D-discovered-root: root discovered from on-disk config (ssh config) like otmux tree items.
- [ ] AC-D-no-hardcode: on WODA.test root == WODA.test (discovered), hardcoded host forbidden.
- [ ] AC-D-DEVICE [@390 Tron]: WODA.test server-manager root shows WODA.test not WODA.prod, verified on device.

## Implementation

NOT STARTED (scenario-first #126). Architect designs; expert builds; req mints chain+Test. Units on disk BEFORE implementation.

## Subtasks

None (architect may split at design).
