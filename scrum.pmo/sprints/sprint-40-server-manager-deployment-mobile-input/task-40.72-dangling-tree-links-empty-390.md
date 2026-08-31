<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.72: Dangling tree links expand to EMPTY @390 — a user taps a chevron and gets nothing; some resolve by carry, not a code fix

[task:uuid:45ae067e-deb0-4916-a2df-83eb72ec37aa]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (PO+req GO after count STABILIZED 41->17 type-correct, req committed 0ee4281a5). AC = RENDERED ANCHOR 1c3b86ad (not the count — a number drifts). ★ CROSS-BRANCH CAVEAT encoded: some of the 17 are hotfix-vs-main uncarried -> resolve by CARRY not code; task does NOT assume code-fix-only (would be wrong for those). UC full-uuid b6d381d8-409b-4048-bb77-d1f44088ba48 verified from R40.72.useCases[]. Held earlier on the moving count (41->17) = measure-a-stable-state, PO+req both endorsed. Minted SERVED; req reverse-wires 0deb7ab5.tasks[]. LOCAL-ONLY not pushed (Tron push-hold). 0 Done till Tron.

## Task Description

USER-VISIBLE DEFECT (prod sweep, served v0.8.150; covers R40.72, TYPE-CORRECT re-measure). REPRO @390: a forward ref the tree TRAVERSES points to a unit that does not exist -> tapping the chevron/link expands to EMPTY. ★ ACCEPTANCE IS A RENDERED ANCHOR, NOT A COUNT (a count drifts, a rendered example does not): Requirement 1c3b86ad declares ONE useCase, that useCase is DEAD, prod returns ZERO children -> a user sees a Requirement whose ENTIRE chain is invisible @390. Stable served figure = 17 type-correct (15 Requirement.useCases->dead UseCase + 1 Class + 1 Task; TRAVERSED keys only — the old 41/469 over-counted non-traversed keys + working-tree churn, req+architect owned it). ★★ CROSS-BRANCH CAVEAT (do NOT assume code-fix-only): a chunk of the 17 are HOTFIX-vs-MAIN UNCARRIED — some VANISH on a CARRY, not a code fix. The resolution DISTINGUISHES carry-resolvable from code-fix-needed. Reuse the tree chevron/expand render + forward-ref resolution, NO fork.

## Context

Covers R40.72 0deb7ab5 (UC b6d381d8). User-visible face of the traceability-integrity family (R37.29 referential / R37.32 forward-authoritative). Delivery-first (Law 2), screenshot-checkable @390. Rendered anchor 1c3b86ad; cross-branch caveat encoded.

## Intention

A user never dead-clicks a chevron into emptiness @390 — a traversed ref resolves to real content, or the chevron is hidden/disabled-with-reason; carry-resolvable dangles resolve by carrying, not code.

## Acceptance Criteria

- [ ] @390 NO-EMPTY-EXPANSION (rendered anchor): tapping any visible chevron/link expands to REAL content, never empty. ANCHOR: Requirement 1c3b86ad today expands to ZERO children (its 1 useCase is dead) = user sees an invisible chain — screenshot shows it now populated (or the dead ref hidden). No expanded node is empty.
- [ ] DANGLING HIDDEN-OR-MARKED: a forward ref whose target does not exist is NOT a clickable chevron (hidden, or shown disabled-with-reason) so a user cannot dead-click into emptiness. Screenshot: no live chevron yields nothing.
- [ ] SERVED-COUNT-TO-0 + CARRY-vs-CODEFIX (measurable): the type-correct SERVED-tree dangling count (baseline 17 = 15 Requirement.useCases->dead UseCase + 1 Class + 1 Task, TRAVERSED keys only) trends to 0. ★ The gate DISTINGUISHES carry-resolvable (hotfix->main uncarried — resolves by a CARRY, not code) from code-fix-needed, and measures the SERVED build. MUST NOT assume a code fix is the only resolution.

## Subtasks

None (atomic task).
