<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.46: Live code-stamp of lastAdvancedAt on a marke

[task:uuid:a93426a1-d08f-47dc-838b-c21a1b52c7f5]

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

Deliver + verify requirement R40.46 (Live code-stamp of lastAdvancedAt on a marke). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.46; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** A CODE commit touching a task's MARKED DECLARATION stamps lastAdvancedAt LIVE (source='code') THROUGH THE SEAM at commit-time — the pin's code-recency moves without waiting for a backfill re-run (the live half of the shipped git-derived code-recency).
- [ ] **(functional)** The live code-stamp routes THROUGH THE SEAM (not a bare write) and is SINGLE-SOURCE with the backfill's code-recency (both = MAX of checklist-commit + marked-declaration-commit); no 2nd stamping path that could diverge.
- [ ] **(honesty)** When -L cannot scope to the marked declaration (TS static methods etc), the fallback is FILE-level + LABELED source='code-file' so the over-credit (a whole-file commit attributed to one marked decl on a SHARED file like unit-controller.ts) is VISIBLE, never silent. The label distinguishes precise ('code') from file-fallback ('code-file').
- [ ] **(tracking)** The residual (code-file over-credit on the shared unit-controller.ts) is NAMED + detectable via the source label, tracked not hidden — a reader/audit can see which stamps are precise vs file-fallback.
- [ ] **(family)** Same lastAdvancedAt recency family as R40.18 (derivation) + R40.45 (live-on-advance); the source-label set = seam / git-backfill / code / code-file (honesty-by-provenance: never claim more precision than the signal supports).

## Subtasks
