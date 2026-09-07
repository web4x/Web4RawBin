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

✓✓ CLOSED-BY-MEASUREMENT -> QA-Review (planner=board-owner, 2026-09-07, PO ghost-check): the regression is FIXED, proven FRESH ON v0.8.211 (no build). Upload-doesnt-die core GREEN (tester file-chain 775af28c7 + upload-status-bar, real drop recognition->STORED, class=File, Uploading 3%..100% Uploaded, unit created+in Files tree). RENDER GREEN (tester re-ran r4081t3720-remaining-inputs on served 211: all 5 types instantiate correct class + render-VISIBLE — URL->WebItem, image->Image [the die-face type], .eml->Email, .vcf->Contact, .ics->CalendarEntry, 5/5 PASS). => full AC 'recognition->stored->renders, ALL types, 0.8.175 die-face GONE' PROVEN ON-VERSION. ★ MY 2026-09-06 REOPEN (below) IS RETRACTED AS STALE: its reasons (constructed-input gate + 'missed 2nd client impl') are MOOT — the SLICE-A rebuild DELETED the dual fetch/xhr and consolidated to ONE path (drop-dispatcher:118 saveFileUnit); a defect claim decays, and mine was 34 versions old [[measure-a-posture-before-obeying]]. HONEST CAVEAT: image/.eml render rows are desktop-webkit repro (the render MECHANISM proven on-version); genuine real-iOS device rendering is a SEPARATE device-gate, not 40.85's claim. QA-Review ceiling; 0 Done till Tron. --- HISTORY (retracted): ★ REOPENED QA-Review -> In-Progress (planner=board-owner, 2026-09-06, evidence INVALIDATED, switch-back-unasked per QA-is-a-switch-state): Tron's upload is STILL BROKEN (P0 reopened). The v0.8.176 fix is INADEQUATE — (a) its gate ran on a CONSTRUCTED/invented request-shape = a BLIND gate [[gate-that-mocks-the-mechanism-is-blind]] (green proved nothing), (b) it covered ONE client upload transport and MISSED the 2nd (drop-dispatcher :59 fetch + :92 xhr) = 'not fixed EVERYWHERE = DRY violation' (Tron: by oop!!!). A board reading Done-pending-Tron while the customer is broken = the scoreboard lying. => testing/creating-test-cases/implementing UNCHECKED (fix incomplete + gate invalid); refinement stays (the defect is now understood). ★ RE-SCOPE (PO ruling, OOP-CR keep-history NOT supersede): toward the upload-ownership COLLAPSE (R40.103) — the OBJECT owns its upload (ONE method, every caller ASKS it; the 2 client paths DELETED into it; ONE server ingress NativeFileIngress parses content-type ONCE). ★ MECHANISM-HOME = T37.20 ae01f065 (canonical DnD drop-contract): T40.85 = the upload-WORKS OUTCOME, T37.20 = the mechanism that delivers it. Flagged req to re-home R40.85 under R37.20 (extendsRequirement, their lane). ★ CARRY (Tron/PO): NO upload verdict from CONSTRUCTED input — the gate rebuilds from a CAPTURED-REAL-REQUEST fixture (expert captures verbatim bytes); prod cleanup + any prod touch HELD until that capture lands (the capture window is un-repeatable). History PRESERVED. 0 Done till Tron.

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
