<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.86: Folders are drop targets — dropping content onto a folder places it INSIDE that folder

[task:uuid:b60afb24-9244-4767-a720-87d722538f93]

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

ADVANCED Planned -> QA-Review 2026-09-05 (Tron-designated HIGH priority; built+gated fast so the In-Progress step was skipped — honest final = QA-Review, gated). TESTER-GATED GREEN (VERIFIED on disk not relayed): commit 6933f7c97 'R40.86 render fix VERIFIED — ALL GREEN', DET 3/3, v0.8.185 (fix 9febe7a64, shared isDirectChildOfNode predicate byParent||byLoc, RED->GREEN of the r4086 baseline): drop nests INSIDE the folder + RENDERS as a child + NOT double-listed at root + exactly ONE unit + no regression. This is the item that MET Tron's done+green stop-condition. Done pending TRON only. UC full-uuid af1bf20b disk-resolved. ACs mirrored no-drift. LOCAL push-freeze, path-limited. 0 Done till Tron.

## Task Description

WIRED, not built (PO). Planned. Covers R40.86 (a7bd184b), UC af1bf20b. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

WIRED, not built (PO). Planned.

## Intention

Board-track R40.86 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

- [ ] **(behaviour)** A folder ACCEPTS a drop — it is a valid drop target with a drop affordance. Today folders are NOT drop targets; this adds it.
- [ ] **(containment/USER-TERMS)** Tron: dropping content onto a folder places it INSIDE that folder. Dropped content lands in the TARGET folder (containment), NOT at root or elsewhere. User terms: when I drop content onto a folder, it lands inside that folder.
- [ ] **(by-construction/R40.83-lesson)** The drop resolves the DESTINATION folder by the ONE canonical roomcoll identity (R40.83 lesson) — NOT a second/dual identity for the drop target. A wrong-destination from a divergent identity resolution => RED.
- [ ] **(render/R40.84-lesson)** The drop-add updates the target node IN PLACE (R40.84): the tree does not collapse or rebuild wholesale, expanded state survives, only the target folder gains the child.
- [ ] **(verify/customer-not-tester)** WE verify @390 member-session (drop content onto a folder -> it lands inside). Tron ACCEPTS delivered verified work (NOT Tron-verified).
- [ ] **(stub-must-fail)** Seed a drop onto a folder that lands at ROOT or elsewhere (not inside the target) => RED. A suite green on lands-outside-the-target is inadmissible.
- [ ] **(REVOKED)** REVOKED 2026-09-06 (struck-in-place, NOT appended — the carve-out must not survive as text a future agent could act on). This AC WRONGLY enshrined a PER-SURFACE CARVE-OUT (room-folder file-drop IN / model-collection OUT) as a design BOUNDARY. It was a MISSING IMPLEMENTATION dressed up as scope. TRON OVERRULED (verbatim): 'a folder being a drop target is for every folder everywhere... not just in certain rooms. oop folder implements dropTarget... are you kidding me?' A Folder is a drop target EVERYWHERE by virtue of being a Folder; 'the model store has no blob-create path' is WORK TO BUILD, not a permitted absence. SUPERSEDED BY AC-folder-implements-droptarget + AC-model-blob-create-path-required. (WHY it changed: PO ratified a carve-out at my direction; Tron overruled; the capability belongs to the CLASS, not the rendering context.)
- [ ] **(class-capability/OOP-first (architect design 980b81c76))** Every Folder IS a DropTarget — CLASS-KEYED, offered on EVERY folder surface with NO per-surface gate; no folder answers false to 'are you a drop target'. A drop into a MODEL-COLLECTION folder mints a File unit in MODEL_STORE UNDER it + renders INSIDE it + PERSISTS across reload. The capability belongs to the Folder CLASS, not the rendering/surface context (OOP-first, R40.82 sibling — a per-surface carve-out IS the functional-construct defect). UC generalises to folder.acceptDrop (the DropTarget contract).
- [ ] **(required-capability/work-owed (CORRECTED 2026-09-06))** Folder.acceptDrop mints the dropped file as a File unit INTO scenario/index (the ONE store rooms already use) UNDER the target folder + renders inside + persists. ★ CORRECTED 2026-09-06: the earlier 'MODEL_STORE blob-create path' framing is RETRACTED — it was the SECOND-STORE VIOLATION (architect build-go error, self-owned). There is NO model-store blob-create to build; the drop mints into the ONE store (scenario/index), same as rooms. See R40.95 (eliminate MODEL_STORE). A drop that mints into a second store => RED.

## Subtasks

None (atomic task).
