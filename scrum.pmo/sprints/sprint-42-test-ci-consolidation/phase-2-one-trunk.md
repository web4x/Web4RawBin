<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.2: Phase 2 — one trunk (main = prod line, protected, PR-only)

[task:uuid:be71588c-e4b5-41c6-936b-08e0e522aa15]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Carry main's 49 planning-only commits onto the hotfix line; back up main as archive/main-orphan; make main identical to the hotfix line (force-push, needs Tron's explicit go); protect main; tag v0.8.247; delete the hotfix branch once main points at it.

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(main-is-prod)** git merge-base main <prod commit> equals the prod commit.
- [ ] **(pr-only)** main is protected: PR required, CI required, no force-push.
- [ ] **(ci-tags)** Tags are created by CI on the merge commit after the version bump; nobody tags by hand.
