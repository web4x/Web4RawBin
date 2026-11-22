<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 42.2: Phase 2 — one trunk (main = prod line, protected, PR-only)

[task:uuid:be71588c-e4b5-41c6-936b-08e0e522aa15]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing (archive old main, main = prod line, DEPLOY-STATE.md)
  - [ ] implementing (branch protection — needs a repo admin)
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Done 2026-11-22 on TRON's decision ('Yes, archive old main first'): old main archived as archive/main-orphan (d443674de); main force-moved to the hotfix head 471f0d5ee; DEPLOY-STATE.md rewritten. Open: branch protection; prod checkout switch; delete the hotfix branch after that; CI-made tags (R42.2 ci-tags, with T42.5).

## Task Description

Carry main's 49 planning-only commits onto the hotfix line; back up main as archive/main-orphan; make main identical to the hotfix line (force-push, needs Tron's explicit go); protect main; tag v0.8.247; delete the hotfix branch once main points at it.

## Intention

Part of the Sprint 42 radical consolidation (see the sprint goal).

## Acceptance Criteria

- [ ] **(main-is-prod)** git merge-base main <prod commit> equals the prod commit.
- [ ] **(pr-only)** main is protected: PR required, CI required, no force-push.
- [ ] **(ci-tags)** Tags are created by CI on the merge commit after the version bump; nobody tags by hand.
