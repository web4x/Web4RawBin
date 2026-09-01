<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.21: TRON 5-PART extended scope — room collections=real Folder units + sunburst + Add-folder-physical(live-MVC/WS) + dedupe detail links + puml physical-folder-tree

[task:uuid:1bf4acc5-4c9b-41a2-9284-b30d323cfbdf]

## Status
- [x] Planned
- [x] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

TRON EXTENDED SCOPE (2026-09-01, PO-relayed; 'that and only that is the task'). FIVE PARTS from Tron's verbatim words (spec text authoritative; PO transcription of his 4 shots is PO-SOURCED — re-derive against the LIVE app, do not blind-trust). (1) room Members/Files ARE real Folder scenario-units (virtual, no disk dir) — rides R40.16, no dup. (2) the EXISTING 'Add folder' action creates a PHYSICAL folder on disk + live-MVC + 2nd-browser WS fan-out. (3) remove the redundant Scenario/Edit LINKS in the detail body (the action bar already has them). (4) render the MISSING sunburst in the detail. (5) beneath the virtual puml collection, surface the REAL physical-folder tree as scenario-units. Scenario-first #126: req mints all 5 requirements from the quotes; architect designs 2+5; expert continues 3+4; tester builds the 2-browser WS harness (long pole); planner mirrors ACs + drives to QA-Review by tomorrow AM (NEVER Done — Tron acts from QA-Review).

## Context

Covers R37.21 (80346a36) via UC roomCollection.asRealFolderUnit (c2d40f62); RIDES R40.16 cc875e35 (no dup). Parts 2/3/5 = NEW requirements req mints from the quotes (R#s PENDING — mirror into coveredRequirements + ACs AS THEY LAND, wording aligned w/ req so task<->req cannot drift). Brief = scrum.pmo/sprints/sprint-37-.../T37.21-TRON-EXTENDED-SCOPE.md (Tron's 4 real screenshots were CORRECT — the PO had attached a stale wrong-batch + deleted it; spec text + PO transcription authoritative, re-derive vs live). ★ CHECK-BEFORE-CREATE (req Rule-9, mostly EXTEND not mint): P1=R37.21 80346a36 · P2=R40.70 542946c4 (+req appends unit-persisted AND fs-directory) · P3=R40.5 e152177d (+req appends detail-body-links-removed) · P4=R37.21 sunburst · P5=NEW R40.x. ★ PHYSICAL-DEFINITION CHANGED (Tron ruling 2026-09-01): 'physical' = the persisted scenario-UNIT *AND* the real filesystem DIRECTORY (both, in step) — SUPERSEDES the stale FolderService.ts:2 comment (which said physical=unit-NOT-fs-dir + falsely ATTRIBUTED that to Tron; it misled the tester); correcting that comment is IN SCOPE (expert), record: definition changed by Tron 2026-09-01. ⛔ OUT OF SCOPE (PO-deferred, nobody works it): the 'File unit not found' dangling-File defect.

## Intention

Tron: a room collection / puml collection is a REAL folder unit with a sunburst + a working physical add-folder (live, multi-browser), and the detail shows the sunburst not redundant links. In-room Files/Members + /model collections.

## Acceptance Criteria

5-PART (Tron verbatim; ACs mirror req's requirements as they land — R#s pending for 2/3/5). NEVER Done till Tron from QA-Review.
- [ ] PART 1 REAL-FOLDER-UNITS: room Members/Files pseudo-collections resolve to REAL Folder scenario-units (VIRTUAL — 'Files (5) IS A FOLDER even if not on disk'), riding R40.16 cc875e35, NO duplicate folder model. [R37.21 80346a36]
- [ ] PART 2 ADD-FOLDER-PHYSICAL (★TRON 2026-09-01 ruled 'BOTH, unit now, real directory too' = FOUR checkable assertions, ALL required): the EXISTING 'Add folder' action (bar Scenario/Edit/ADD-FOLDER/IMPORT-PUML) (a) MINTS/persists the folder SCENARIO-UNIT + (b) CREATES the actual FILESYSTEM DIRECTORY (mkdir; model+fs stay in step) + (c) live-MVC updates the tree with NO reload + (d) a SECOND BROWSER on a similar view updates immediately over WS. ERROR-CLEAN (mkdir now in scope): dir-already-exists / invalid-name / mkdir-ok-but-mint-fails -> FAIL CLEANLY leaving NOTHING behind (a half-created folder is worse than a failed one). Refresh-to-see=FAIL; single-browser-only=FAIL. [R40.70 542946c4 carries c+d (live-no-reload + 2nd-passive/broadcast); req appends (a)=unit-persisted AND (b)=fs-directory; architect designs mkdir + error paths]
- [ ] PART 3 DEDUPE-DETAIL-LINKS: remove the redundant Scenario/Edit LINKS repeated in the detail BODY (the action bar already provides them). Do NOT remove the action-bar buttons (R34.7/R33.6.5, Tron-verified v0.8.153). [NEW R# pending; expert]
- [ ] PART 4 SUNBURST-IN-DETAIL: render the MISSING sunburst in the detail view (child-size, reuse R40.16, no dup renderer). [R37.21 sunburst AC; expert]
- [ ] PART 5 PUML-PHYSICAL-TREE: keep the VIRTUAL puml collection AND beneath it surface the REAL on-disk folder paths where the .puml files live, as a tree of physical folder scenario-units. Evidence: 61 entries w/ class-diagram.puml x4 + object-verb-usecases/pwa-update-workflow/avatar-crop-lifecycle x2 each = same names in DIFFERENT physical folders. [NEW R# pending; architect design]
- [ ] DEVICE @390 (Tron closing gate): every part verified @390 real-WebKit, SCREENSHOT evidence (never DOM); part-2 WS fan-out proven with TWO browsers (tester harness). Tron approves from QA-Review.

## Implementation

IN PROGRESS (scenario-first #126): scope extended to Tron's 5 parts; req minting the 5 requirements from the quotes; architect designing parts 2+5; expert on 3+4; tester building the 2-browser WS harness. ACs mirror req's requirements AS THEY LAND. Drive to QA-Review by tomorrow AM; Done is Tron's act.

## Subtasks

None (architect may split at design).
