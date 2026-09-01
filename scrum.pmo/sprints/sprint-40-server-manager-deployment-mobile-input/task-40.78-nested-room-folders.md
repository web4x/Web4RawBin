<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.78: Add-folder ALSO inside a room Files collection (nested room folders) — mint unit AND mkdir at the per-user room target (build-last)

[task:uuid:7193c129-ad18-4c33-82e2-e30e7373d6cc]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

NEW capability (Tron wider-scope choice 2026-09-01, covers R40.78). The Add-folder action appears NOT ONLY on real on-disk folders (T37.21 part-2 /model side) but ALSO INSIDE a room Files collection, creating NESTED room folders. ★ STORAGE TARGET TRON-LOCKED (i) PER-USER: a nested room folder lives under EACH MEMBER's own room dir = getRoomDir(userToken,roomId)/files/<nestedPath>/ (per-user, storageId-keyed), mkdir THROUGH the R40.22 homeKeyFor chokepoint — NEVER a raw mkdir; option (ii) canonical-per-room (share/sync) was NOT chosen. Follows the SAME Tron BOTH ruling as part 2 (R40.70): mint the folder scenario-UNIT AND mkdir the REAL directory at that target + live-MVC + WS fan-out. Chain: R40.78 -> UC 65b07a49 -> Class 75c52485 RoomFilesService -> Method accf56ab -> Impl 70916a80 (design-ahead, architect-minted, req derive-verified). Reuse R40.70's add-folder/live/WS + R40.16 folder-as-unit, NO fork.

## Context

Covers R40.78 c638d72c (UC 65b07a49). Extends part-2 R40.70 542946c4 (add-folder mkdir on /model) to the ROOM side; rides R40.16 cc875e35 (folder-as-unit); sibling of R37.21. ★ BUILD-LAST per PO priority: AFTER part-2-client-insert + sunburst-bytes(P4b) + sourceDirTree(P5b). Fresh expert builds; architect chain is design-ahead.

## Intention

A user can Add-folder inside a room Files collection; it mints a real Folder unit AND creates the physical directory at the LOCKED per-user room target, live + multi-browser.

## Acceptance Criteria

Mirrors R40.78's 6 ACs (storage TRON-LOCKED (i) per-user). NEVER Done till Tron.
- [ ] AC-add-folder-inside-room-files (@390): Add-folder is AVAILABLE inside a room Files collection (not only real on-disk folders), creating a NESTED room folder. @390 screenshot: opening a room Files collection shows an Add-folder affordance; firing it creates a nested folder.
- [ ] AC-per-room-storage-target-DEFINED (LOCKED Tron (i) per-user): the nested folder lives under getRoomDir(userToken,roomId)/files/<nestedPath>/ (per-user, storageId-keyed), mkdir THROUGH the R40.22 homeKeyFor chokepoint, NEVER raw; NO share/sync (option ii not chosen).
- [ ] AC-BOTH-unit-and-directory-at-target: mints the folder scenario-UNIT AND mkdirs the REAL directory at that per-user target (Tron BOTH ruling, same as R40.70). Fail-clean: dir-exists / invalid-name / mint-fails-after-mkdir -> leave NOTHING behind.
- [ ] AC-nested-live-and-ws: the nested folder appears LIVE in the room tree with NO reload [browser 1] AND a second browser updates over WS [rides R40.70 live+broadcast/2nd-passive]. reload-to-see=FAIL; single-browser-only=FAIL.
- [ ] AC-nested-is-real-folder-unit: the nested room folder is a REAL Folder scenario-unit (rides R40.16, NO duplicate folder model).
- [ ] AC-stub-must-fail: (1) unit-but-no-dir OR dir-but-no-unit -> RED; (2) mkdir NOT through the R40.22 chokepoint / a RAW path -> RED; (3) placed anywhere OTHER than the LOCKED per-user getRoomDir(...)/files/<nestedPath> (e.g. a canonical-per-room path) -> RED.

## Implementation

STOOD UP Planned (build-last). Chain design-ahead (architect-minted, req derive-verified): R40.78 c638d72c -> UC 65b07a49 -> Class 75c52485 RoomFilesService -> Method accf56ab -> Impl 70916a80. Storage TRON-LOCKED (i) per-user (getRoomDir/files/<nestedPath> via R40.22 chokepoint; (ii) canonical NOT chosen). PO priority: BUILD AFTER part2-client-insert + sunburst-bytes + sourceDirTree. UC full-uuid 65b07a49-a33f-4888-9ca3-d8464ddd78fb verified from R40.78.useCases[]. Minted SERVED; req reverse-wires R40.78.tasks[] += 7193c129. LOCAL not pushed (push-freeze). 0 Done till Tron.

## Subtasks

None (atomic task).
