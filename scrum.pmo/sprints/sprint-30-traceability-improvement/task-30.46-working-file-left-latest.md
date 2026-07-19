<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.46: Working-file diff — left=latest resolves to the on-disk working file (uncommitted)

[task:uuid:e545614d-c7b3-4832-a681-e850bc81f1d0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:88e97c14-59cb-4223-a28b-b043d7bea6e2]`
  - reuse
    - R30.38 save PUT (left=working writes the same on-disk file — no code change, confirmed)
  - gate
    - r3046-working-file-gate.mjs GREEN DET-3x (tester 6213d022a); served==gated v0.7.68; W4 parked
  - down
    - [UC](./planning.md) `[uc:uuid:6c46d917-2973-42fd-8b16-de3f776eac72]`
    - [UC](./planning.md) `[uc:uuid:eaf0cecc-42b0-42f1-b99c-e3c643df2a1e]`
    - [UC](./planning.md) `[uc:uuid:3fcf6237-fa79-4764-8653-e347129a3d74]`

## Task Description

The diff editor's LEFT side supports the live on-disk working file. A 'latest'/'working' pseudo-ref makes loadSide read the raw uncommitted file via /api/files (NOT git show <ref>:file), resolveBase treats working/'' as no-ref (2-way); saving with left=working round-trips that same file to disk (reuses R30.38 save PUT, no code change); opening a diff DEFAULTS left=working pinned + right=HEAD (a _pinnedLeft flag suppresses the R30.17 auto-promote); the left picker is repurposed to pick the RIGHT compare-ref.

## Context

Covers R30.46 (88e97c14) → UC-W1..W4 (6c46d917/eaf0cecc/3fcf6237/98173cd4) → Class RbDiffEditor + loadSide/resolveBase/openFromParams. Reuses R30.38 save (confirmed no code change). Impls b7b6fcb6/0eb17ebd/f2bdca27 — expert building.

## Intention

S30 diff/merge editor — R30.46 working-file-as-left (Tron #1): the diff's left side is the live on-disk working file, not only a committed ref.

## Acceptance Criteria

- [x] (W1) A 'latest'/'working' pseudo-ref resolves to the current on-disk working file (incl uncommitted) — loadSide reads raw via /api/files, not git show; resolveBase treats working/'' as no-ref (2-way).
- [x] (W2) Saving with left=working writes the on-disk working file (reuses R30.38 save PUT) — round-trips to disk, locked by a Test.
- [x] (W3 flip) Opening a diff DEFAULTS left=working + right=HEAD, pinned + shown first (openFromParams/showDiff; _pinnedLeft suppresses the R30.17 promote).
- [ ] (W4 optional — PARKED, out-of-scope) The left picker is repurposed to choose the RIGHT compare-ref — DEFERRED (f2bdca27 design-ahead, no code).
- [ ] (gate) GATE — DET-3x GREEN ✓ (r3046-working-file-gate.mjs, tester 6213d022a, served==gated v0.7.68); Tron VISUAL pending. Full gate: /edit/otmux?repo=oosh&left=latest&right=dev&3way=1 → left shows the live working file, edit+save round-trips, bare open defaults left=working; client-facing → version-bump.

## Implementation

QA-REVIEW: r3046-working-file-gate.mjs GREEN DET-3x (tester 6213d022a). Chain-to-Test complete BOTH-directions: W1 loadSide b7b6fcb6<->eaaa2469 / W2 save rides R30.38 a88b2b53<->4e2c8f10 (no-code confirm) / W3 openFromParams 0eb17ebd<->53d94d46. served==gated v0.7.68. W4 refPickerLatest PARKED (optional/out-of-scope; f2bdca27 design-ahead, no code). HELD rule#9 -> awaiting Tron VISUAL (left=latest working-file diff) -> Done.

## Subtasks

None (atomic task).
