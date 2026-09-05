<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.78: Add-folder ALSO inside a room Files collection (nested room folders) — mint unit AND mkdir at the room folder target (build-last)

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

NEW capability (Tron wider-scope 2026-09-01; EXTENDED + SECURITY-STRIPPED 2026-09-02, covers R40.78). Add-folder appears NOT ONLY on real on-disk folders (T37.21 part-2 /model side) but ALSO INSIDE a room Files collection — Tron ruled the room Files node IS the room's REAL physical folder — creating NESTED room folders. ★ STORAGE TARGET (security-stripped per Tron 'we are in development, no unordered security'): the nested folder lives at getRoomDir(roomId)/files/<nestedPath> = THE room folder (NOT per-user), key folder::<relpath> (no storageId). The per-user isolation / R40.22 chokepoint / raw-mkdir-reject framing is RETIRED. Same Tron BOTH ruling as part 2 (R40.70): mint the folder scenario-UNIT AND mkdir the REAL directory + live-MVC + WS fan-out; both-or-neither = CORRECTNESS (a half-created folder is a broken feature, NOT a security control). ONE folder-creation mechanism shared with /model, differing only in which parent path it resolves (DRY). Chain: R40.78 -> UC 65b07a49 -> Class 75c52485 RoomFilesService -> Method accf56ab -> Impl 70916a80 (design-ahead, architect re-issue 059107c35 clean). Reuse R40.70 add-folder/live/WS + R40.16 folder-as-unit, NO fork.

## Context

Covers R40.78 c638d72c (UC 65b07a49). Extends part-2 R40.70 542946c4 (add-folder mkdir on /model) to the ROOM side via ONE shared mechanism (DRY); rides R40.16 cc875e35 (folder-as-unit); sibling of R37.21. ★ SECURITY-STRIPPED 2026-09-02 (mirror of req's stripped R40.78, architect re-issue 059107c35 verified clean). BUILD-LAST per PO priority: AFTER part-2-client-insert + sunburst-bytes(P4b) + sourceDirTree(P5b).

## Intention

A user can Add-folder inside a room Files collection; it mints a real Folder unit AND creates the physical directory at the room folder target (getRoomDir(roomId)/files/<nestedPath>), live + multi-browser. both-or-neither = correctness.

## Acceptance Criteria

Mirrors R40.78's 13 ACs (SECURITY-STRIPPED per Tron 2026-09-02: per-user isolation / R40.22 chokepoint / raw-mkdir-reject REMOVED; both-or-neither KEPT = CORRECTNESS; DRY one-mechanism KEPT). NEVER Done till Tron.
- [ ] AC-add-folder-inside-room-files (@390): Add-folder is AVAILABLE inside a room Files collection (not only real on-disk folders), creating a NESTED room folder. @390 TEAM-VERIFIED (rewordProvenance 2026-09-05, customer-not-tester): WE verify @390 real-WebKit in a live TEST-MEMBER room (member-gated, server.ts:2414 memberOf, NO owner rights) that opening a room Files collection shows an Add-folder affordance + firing it creates a nested folder; Tron ACCEPTS.
- [ ] AC-add-folder-verb-appears-in-room-context (@390): Tron @v0.8.165 — Add-folder is TOTALLY MISSING on the room Files folder detail (drawer shows only Scenario + Edit). AC (TEAM-VERIFIED): WE verify on 390px real-WebKit (live test-member room) that the Add-folder verb APPEARS on the room Files folder detail (ROOM context) and works; Tron ACCEPTS. (Tron's v0.8.165 screenshot REPORTED it missing = a defect he found = our verification failure, not a check we hand him.) Root (architect): add-folder was a /MODEL-view verb, never offered in the room = service-built-but-UNWIRED.
- [ ] AC-files-node-IS-room-physical-folder: the room Files node resolves to the room's REAL files directory (NOT virtual, NOT synthesised) — the Files collection IS that physical folder (architect re-rule f6f1463e0).
- [ ] AC-add-folder-ordinary-physical-BOTH: Add-folder inside Files = the ORDINARY physical-equals-BOTH case: mint the Folder unit AND mkdir the real subdirectory at getRoomDir(roomId)/files/<nestedPath> (THE room folder, NOT per-user), key folder::<relpath> (no storageId). both-or-neither = correctness. NO exception.
- [ ] AC-BOTH-unit-and-directory-at-target: mints the folder scenario-UNIT AND mkdirs the REAL directory at that per-room target (Tron BOTH ruling, same as R40.70). Fail-clean: dir-exists / invalid-name / mint-fails-after-mkdir -> leave NOTHING behind.
- [ ] AC-routes-to-room-endpoint-not-model: the verb routes to the ROOM folder-create path (RoomFilesService), NOT /api/model/folder/create (the surfacing+wiring the architect measured as missing).
- [ ] AC-nested-live-and-ws: the nested room folder appears LIVE in the room tree with NO reload [browser 1] AND a second browser updates over WS [rides R40.70 live-no-reload + broadcast/2nd-passive]. reload-to-see = FAIL; single-browser-only = FAIL.
- [ ] AC-live-mvc-no-reload-ws: live-MVC no-reload + 2nd-browser-WS via publishUnitChanged on the ROOMCOLL PARENT ref (shared client-subscribe root with P2). 2-browser: live in both.
- [ ] AC-nested-is-real-folder-unit: the nested room folder is a REAL Folder scenario-unit (rides R40.16, NO duplicate folder model).
- [ ] AC-fail-clean-no-half-state: architect 6-case atomicity — a failure leaves NEITHER an orphan unit NOR an orphan directory.
- [ ] AC-location-real-relpath-retire-logical: the nested Folder unit key = folder::<relpath> (real relpath under getRoomDir(roomId)/files, no storageId / no per-user). The earlier LOGICAL roomcoll-ref location + per-user storageId key are RETIRED — one plain real location.
- [ ] AC-stub-must-fail (CORRECTNESS): Add-folder-in-room creates a unit but NO physical directory (or a directory but no unit) => RED. Both-or-neither is a CORRECTNESS gate, not a security control.
- [ ] AC-one-folder-creation-mechanism-DRY (Tron standing law): the ROOM add-folder and the MODEL add-folder call ONE shared folder-creation MECHANISM (mkdir + mint, both-or-neither = correctness), differing ONLY in which PARENT PATH they resolve. The two that exist today CONVERGE to ONE — a 2nd implementation of mkdir-plus-mint => RED.

## Implementation

STOOD UP Planned (build-last). Chain design-ahead (architect-minted, req derive-verified): R40.78 c638d72c -> UC 65b07a49 -> Class 75c52485 RoomFilesService -> Method accf56ab -> Impl 70916a80. Storage = getRoomDir(roomId)/files/<nestedPath> (THE room folder, NOT per-user; key folder::<relpath>, no storageId) — SECURITY-STRIPPED 2026-09-02 (per-user isolation / R40.22 chokepoint / raw-reject RETIRED per Tron 'in development, no unordered security'). RE-SYNC'd to req's stripped R40.78 (13 ACs, architect re-issue 059107c35 clean). PO priority: BUILD AFTER part2-client-insert + sunburst-bytes + sourceDirTree. UC full-uuid 65b07a49-a33f-4888-9ca3-d8464ddd78fb verified from R40.78.useCases[]. req reverse-wired R40.78.tasks[] += 7193c129. LOCAL not pushed (push-freeze). 0 Done till Tron.

## Subtasks

None (atomic task).
