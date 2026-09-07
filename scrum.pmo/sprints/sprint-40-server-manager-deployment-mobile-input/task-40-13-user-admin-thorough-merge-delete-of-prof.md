<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.13: User Admin — thorough merge + delete of prof

[task:uuid:4968e400-1790-46f0-8ab3-f7022d30b8c3]

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

Deliver + verify requirement R40.13 (User Admin — thorough merge + delete of prof). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.13; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(merge-all-refs)** MERGE consolidates EVERY reference, not just the profile row — room memberships, file/unit ownership, device enrollments, alt-identity indexes (phone/email symlinks), avatars, vCards, usedIn side-index.
- [ ] **(delete-no-dangling)** DELETE leaves NO dangling reference — every ref to the removed user is repointed (merge) or removed (delete).
- [ ] **(gate-graph-query-REUSE)** The completion GATE is a GRAPH QUERY: ZERO dangling/orphan refs after merge or delete, PROVEN by the EXISTING S37 identity-family detectors (orphan-owner / truncated-ref / prefix-collision). REUSE them — do NOT write a parallel checker.
- [ ] **(dry-run-reversible-idempotent)** DRY-RUN + counts BEFORE apply; reversible backup; idempotent (the R27.2 / repair protocol).
- [ ] **(owner-gated-403)** OWNER-GATED; non-owner => 403 (same integrity argument as R40.10 — if anyone can merge identities, identity means nothing).
- [ ] **(device-390)** Usable at 390px on mobile (Tron's phone).

## Subtasks
