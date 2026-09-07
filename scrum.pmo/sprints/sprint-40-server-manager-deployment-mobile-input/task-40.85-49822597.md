<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.85: Plain file upload via the drop area SUCCEEDS (0.8.175 regression: recognition works then upload dies) — all uploads

[task:uuid:49822597-25c7-41ea-8edc-dcdb60d5603b]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

★ REOPENED QA-Review -> In-Progress (planner=board-owner, 2026-09-06, evidence INVALIDATED, switch-back-unasked per QA-is-a-switch-state): Tron's upload is STILL BROKEN (P0 reopened). The v0.8.176 fix is INADEQUATE — (a) its gate ran on a CONSTRUCTED/invented request-shape = a BLIND gate [[gate-that-mocks-the-mechanism-is-blind]] (green proved nothing), (b) it covered ONE client upload transport and MISSED the 2nd (drop-dispatcher :59 fetch + :92 xhr) = 'not fixed EVERYWHERE = DRY violation' (Tron: by oop!!!). A board reading Done-pending-Tron while the customer is broken = the scoreboard lying. => testing/creating-test-cases/implementing UNCHECKED (fix incomplete + gate invalid); refinement stays (the defect is now understood). ★ RE-SCOPE (PO ruling, OOP-CR keep-history NOT supersede): toward the upload-ownership COLLAPSE (R40.103) — the OBJECT owns its upload (ONE method, every caller ASKS it; the 2 client paths DELETED into it; ONE server ingress NativeFileIngress parses content-type ONCE). ★ MECHANISM-HOME = T37.20 ae01f065 (canonical DnD drop-contract): T40.85 = the upload-WORKS OUTCOME, T37.20 = the mechanism that delivers it. Flagged req to re-home R40.85 under R37.20 (extendsRequirement, their lane). ★ CARRY (Tron/PO): NO upload verdict from CONSTRUCTED input — the gate rebuilds from a CAPTURED-REAL-REQUEST fixture (expert captures verbatim bytes); prod cleanup + any prod touch HELD until that capture lands (the capture window is un-repeatable). History PRESERVED. 0 Done till Tron.

## Task Description

CLOSED (PO): SW-upload regression fix v0.8.176. QA-Review — Done pending TRON acceptance. Covers R40.85 (deeeec90), UC 2640f986. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

CLOSED (PO): SW-upload regression fix v0.8.176. QA-Review — Done pending TRON acceptance.

## Intention

Board-track R40.85 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

- [ ] **(regression/behaviour)** A file dropped on the drop area UPLOADS successfully (recognition -> stored), for ALL file types. The 0.8.175 face (png recognized as image/png then Upload FAILED) is gone. Upload-dies-after-recognition => RED.
- [ ] **(regression/root)** The regression is traced to the specific DEPLOY change that broke the upload path (recognition works; the upload POST/store dies) and the fix RESTORES it. This is US breaking something (a regression), NOT a missing capability.
- [ ] **(scope)** Scope = ALL uploads via the drop area, NOT a folder-specific case. Distinct from R40.86 (folders-as-drop-targets, a separate capability). Do not conflate.
- [ ] **(verify/customer-not-tester)** WE verify @390 member-session (drop a png on the drop area -> it uploads + lands). Tron ACCEPTS — he hit this as a CUSTOMER (our regression = our verification failure), NOT a test he runs.
- [ ] **(stub-must-fail)** Seed the exact 0.8.175 defect — a file recognized then the upload POST/store dies => RED. A suite green on recognition-without-store is inadmissible.

## Subtasks

None (atomic task).
