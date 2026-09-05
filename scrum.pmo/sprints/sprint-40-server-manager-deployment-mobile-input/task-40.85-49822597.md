<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.85: Plain file upload via the drop area SUCCEEDS (0.8.175 regression: recognition works then upload dies) — all uploads

[task:uuid:49822597-25c7-41ea-8edc-dcdb60d5603b]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

STOOD UP QA Review 2026-09-05 (PO GO). CLOSED (PO): SW-upload regression fix v0.8.176. QA-Review — Done pending TRON acceptance. UC full-uuid 2640f986-ec15-4579-89f3-807158239a5a resolved from R40.85.useCases[] on disk (NOT fabricated). ACs mirrored from the req (no-drift). Minted LOCAL (push-freeze), path-limited. req reverse-wires R40.85.tasks[]. 0 Done till Tron.

## Task Description

CLOSED (PO): SW-upload regression fix v0.8.176. QA-Review — Done pending TRON acceptance. Covers R40.85 (deeeec90), UC 2640f986. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

CLOSED (PO): SW-upload regression fix v0.8.176. QA-Review — Done pending TRON acceptance.

## Intention

Board-track R40.85 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

Mirrors R40.85 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-upload-succeeds-drop-area: a file dropped on the drop area UPLOADS (recognition -> stored) for ALL types; the 0.8.175 face (png recognized then Upload FAILED) is gone.
- [ ] AC-regression-root-identified: the regression is traced to the specific DEPLOY change that broke the upload path (recognition works; POST/store died) and the fix RESTORES it — US breaking something, our regression.
- [ ] AC-scope-all-uploads-not-folder: scope = ALL drop-area uploads, NOT a folder-specific case; distinct from R40.86 (folders-as-drop-targets). Do not conflate.
- [ ] AC-verify-member-session: WE verify @390 member-session (drop a png -> uploads + lands); Tron ACCEPTS — he hit this as a CUSTOMER (our regression = our verification failure), NOT a check we hand him.
- [ ] AC-stub-must-fail: seed recognized-then-POST/store-dies => RED; a suite green on recognition-without-store is inadmissible.

## Subtasks

None (atomic task).
