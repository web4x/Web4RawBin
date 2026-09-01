<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.21: TRON 5-PART extended scope — room collections=real Folder units + sunburst + Add-folder-physical(live-MVC/WS) + dedupe detail links + puml physical-folder-tree

[task:uuid:1bf4acc5-4c9b-41a2-9284-b30d323cfbdf]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Task Description

TRON EXTENDED SCOPE (2026-09-01, PO-relayed; 'that and only that is the task'). FIVE PARTS from Tron's verbatim words (spec text authoritative; PO transcription of his 4 shots is PO-SOURCED — re-derive against the LIVE app, do not blind-trust). (1) room Members/Files ARE real Folder scenario-units (virtual, no disk dir) — rides R40.16, no dup. (2) the EXISTING 'Add folder' action creates a PHYSICAL folder on disk + live-MVC + 2nd-browser WS fan-out. (3) remove the redundant Scenario/Edit LINKS in the detail body (the action bar already has them). (4) render the MISSING sunburst in the detail. (5) beneath the virtual puml collection, surface the REAL physical-folder tree as scenario-units. Scenario-first #126: req mints all 5 requirements from the quotes; architect designs 2+5; expert continues 3+4; tester builds the 2-browser WS harness (long pole); planner mirrors ACs + drives to QA-Review by tomorrow AM (NEVER Done — Tron acts from QA-Review).

## Context

Covers R37.21 (80346a36) via UC roomCollection.asRealFolderUnit (c2d40f62); RIDES R40.16 cc875e35 (no dup). Parts 2/3/5 = NEW requirements req mints from the quotes (R#s PENDING — mirror into coveredRequirements + ACs AS THEY LAND, wording aligned w/ req so task<->req cannot drift). Brief = scrum.pmo/sprints/sprint-37-.../T37.21-TRON-EXTENDED-SCOPE.md (Tron's 4 real screenshots were CORRECT — the PO had attached a stale wrong-batch + deleted it; spec text + PO transcription authoritative, re-derive vs live). ★ CHECK-BEFORE-CREATE (req Rule-9, mostly EXTEND not mint): P1=R37.21 80346a36 · P2=R40.70 542946c4 (+req appends unit-persisted AND fs-directory) · P3=R40.5 e152177d (+req appends detail-body-links-removed) · P4=R37.21 sunburst · P5=NEW R40.x. ★ PHYSICAL-DEFINITION CHANGED (Tron ruling 2026-09-01): 'physical' = the persisted scenario-UNIT *AND* the real filesystem DIRECTORY (both, in step) — SUPERSEDES the stale FolderService.ts:2 comment (which said physical=unit-NOT-fs-dir + falsely ATTRIBUTED that to Tron; it misled the tester); correcting that comment is IN SCOPE (expert), record: definition changed by Tron 2026-09-01. ⛔ OUT OF SCOPE (PO-deferred, nobody works it): the 'File unit not found' dangling-File defect.

## Intention

Tron: a room collection / puml collection is a REAL folder unit with a sunburst + a working physical add-folder (live, multi-browser), and the detail shows the sunburst not redundant links. In-room Files/Members + /model collections.

## Acceptance Criteria

WALKED TO QA-REVIEW for Tron's morning approval (PO-directed 2026-09-01) — HONEST state, NOTHING rounded up. ZERO Done flips; Tron approves from QA-Review. Some parts carry Tron's OWN device-confirmation @0.8.158; others are honestly OPEN with their reason.
- [x] PART 1 REAL-FOLDER-UNITS: DEVICE-CONFIRMED BY TRON @0.8.158 ('live and good') + tester-GATED (fail-proof). [R37.21 80346a36 AC-B-real-folder-unit]
- [ ] PART 2 ADD-FOLDER-PHYSICAL (Tron 'BOTH' 4-assert): SERVER-HALF tester-GREEN (v0.8.165, gate r4021-twobrowser-ws-folder-gate.mjs sha d97effcc7: unit persisted + confine traversal-rejected + WS FRAME unit-changed reaches passive browser-2 frames=1). CLIENT-half OPEN + UNVERIFIABLE-YET (honest — NOT 'client broken'): tester's 2b browser-1-shows=FALSE + 2c-DOM browser-2-live-insert=FALSE, BUT the RED is AMBIGUOUS = the harness's own ref-detection limitation (reads display itemRef 'collection:dir:ts' not the node's raw uuid 'dir:ts') -> if the parent node isn't rendered+subscribed, live-insert CAN'T fire regardless of whether the client fix works = NOT a clean client verdict. ★ ALSO the mkdir landed at src/ts/ not ts/ (src-relative) = the R37.33 dir-namespace bug -> P2's CLEAN closure is ENTANGLED with T37.34 (dir:ts->dir:src/ts, one resolveDirRefAbs). Tester is FIXING the harness (key on raw uuid + create under a rendered+subscribed parent) to disambiguate. NO flip on hearsay-green or ambiguous-red. [R40.70 542946c4 + R37.33/T37.34 entanglement]
- [x] PART 3 DEDUPE-DETAIL-LINKS: tester-GATED BOTH DIRECTIONS. [R40.5 e152177d AC-detail-body-scenario-edit-links-removed]
- [x] PART 4a SUNBURST RENDERS: DEVICE-CONFIRMED BY TRON @0.8.158 ('live and good') + tester-GATED (proportional discriminator proven on 86 arcs: the largest-childCount child has the largest measured arc). [R37.21 AC-B-sunburst-rides-R40.16]
- [x] ★ PART 4b SUNBURST-SIZE = ON-DISK BYTES: TESTER-GATED (verified 2026-09-01, tester first-hand not-relayed — commit c816ae635, gate test/visual/r4021c-room-files-sunburst-gate.mjs, DET-3x @390 real-WebKit): rendered .dv-sunburst arcs measured + tied to /api/trace/children on-disk sizes Tron sees (png 10916416B->largest arc, mp3->mid, doc 43B->sliver, max/min 7.58); equal-angle STUB->1.00->RED = able-to-fail. Arc size = REAL ON-DISK BYTES = Tron's corrected metric (NOT childCount). ★ Tron corrected the metric 2026-09-01 (childCount->bytes, req AC-B-sunburst-size-is-on-disk-bytes) — now SATISFIED at the rendered gate; the earlier childCount green did NOT hide it. TRON-DEVICE @390 = PENDING (tester ran desktop-WebKit emulation) = closing bonus like P1/P4a.
- [x] PART 5a PUML-PHYSICAL-TREE STRUCTURE: tester-GATED (the four-distinct-dirs reveal). [R40.77 70c6b806]
- [ ] PART 5b derived dir-folder SUNBURST: HELD on a known small server fix (sourceDirTree hard-codes 'src'); NOT one of Tron's 5 asks -> does NOT block QA-Review. [R40.77]
- [ ] DEVICE @390 closing (Tron): parts 1 + 4a-render Tron-device-confirmed @0.8.158; the OPENS (part-2 client-insert / part-4b bytes / part-5b derived) await build + Tron's final approval from QA-Review.

## Implementation

AT QA-REVIEW (PO-directed 2026-09-01; Tron asked for it AT QA-Review for morning approval = the deliverable SHAPE). HONEST per-part state in acceptanceCriteria, NOTHING rounded up: PART1 Tron-device-confirmed @0.8.158 + gated · PART2 SERVER-half tester-GREEN (v0.8.165 d97effcc7: unit persisted + confine + WS-frame-to-passive-browser-2). CLIENT-half OPEN + UNVERIFIABLE-YET (re-run RED but AMBIGUOUS = tester harness ref-detection limit reads display itemRef not raw 'dir:ts' uuid -> parent not rendered+subscribed -> live-insert can't fire = NOT a clean client verdict; tester FIXING harness key-on-raw-uuid). ★ mkdir landed src/ts not ts (src-relative) = R37.33 dir-namespace bug -> P2 CLEAN-close ENTANGLED with T37.34 (build-NEXT). NO flip on hearsay-green or ambiguous-red · PART3 gated both-directions · PART4a-render Tron-device-confirmed @0.8.158 + gated (86-arc proportional discriminator) · ★PART4b-size TESTER-GATED (verified first-hand c816ae635, gate r4021c DET-3x @390, real-ON-DISK-BYTES tied to /api/trace sizes, equal-angle-stub->RED able-to-fail; Tron-device @390 PENDING=closing-bonus) = Tron's corrected childCount->bytes metric now SATISFIED at the rendered gate · PART5a-structure gated (four-distinct-dirs reveal) · PART5b-derived-sunburst HELD on a known small server fix (sourceDirTree hard-codes 'src'), NOT a Tron-5-ask = non-blocking. ★ NEW REQ RECORDED: R40.78 c638d72c nested-room-folders — carries an UNANSWERED design question the ARCHITECT owes (where on disk a nested room folder lives); NOT part of this 5-part QA-Review, needs its own design-then-task (scenario-first) — flagging req+architect. evidence[]=req-wired (untouched). ZERO Done flips; Tron approves from QA-Review.

## Subtasks

None (architect may split at design).
