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

- [ ] **(functional)** The server-manager ROOT host is DISCOVERED from real on-disk config (ssh config etc.), the SAME way otmux tree items are discovered — read from files, not a constant.
- [ ] **(functional)** On WODA.test the root resolves to WODA.test (discovered), NOT the hardcoded WODA.prod; a hardcoded root host is FORBIDDEN (fragile-heuristic class). Provable by running on a non-prod host and asserting the root == that host.
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron, NEVER headless-green, TRON-ONLY] Tron verifies on WODA.test the server-manager root shows WODA.test (discovered), not WODA.prod.

## Implementation

NOT STARTED (scenario-first #126). Architect designs; expert builds; req mints chain+Test. Units on disk BEFORE implementation.

## Subtasks

None (architect may split at design).
