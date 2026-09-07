<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.37: Context-sensitive actions — invalid-for-type/status actions are NOT offered (universalActionBar per-action applicability); server guard stays defense-in-depth

[task:uuid:2e831ffd-5eba-45ce-961e-25195b2071a3]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.37 `[requirement:uuid:a3cdb98a-cde7-4b3a-94f9-bd301dbf26f8]`
  - down
    - [UC applicability](./planning.md) `[uc:uuid:1de961e7-5f64-4768-af31-7e7de8063ed5]`
    - [UC folder-create](./planning.md) `[uc:uuid:0c58eb53-73fc-4e4d-97d4-dbe729cc0916]`

## Task Description

Deliver R40.37: an action invalid for the unit's TYPE/STATUS is NOT offered (hidden or disabled-with-reason), not clickable-then-refused. Capability lives ONCE in the SHARED universalActionBar, declared per-action (valid types+statuses), NOT per-view if-statements. Approve/Decline only at QA Review; container actions (+Add Diagram/Add folder/Import PUML) never on a Task; +Add Diagram only on the diagrams SPECIAL container; Add folder immediately MINTS a real persisted Folder scenario-unit (no mkdir/no fs dir; the itemview becomes the unit at once, atomicity = the unit write). Server guard REMAINS (defense-in-depth). Architect designs the applicability model FIRST (scenario-first #126).

## Context

Covers R40.37 (a3cdb98a) via UC universalActionBar.applicableActionsFor (1de961e7) + folder.createPhysicalWithUnit (0c58eb53). Chain (Class/Method/Impl) pending ARCHITECT applicability-model design. Server-side approve/decline guard (correct refusal Tron saw) stays as defense-in-depth — this task fixes the UI OFFERING, not the guard.

## Intention

Tron-ordered 2026-08-12: he hit Approve on Done Task 32.0, got the correct refusal, but the button should not have been offered. New ordered work = ACTIONABLE 0->1.

## Acceptance Criteria

- [ ] **(functional)** An action invalid for the current unit's TYPE or STATUS is NOT OFFERED — HIDDEN, or DISABLED carrying its reason — rather than clickable-then-refused. The server-side guard REMAINS as defense-in-depth (a guard is NEVER removed to fix a UI affordance); the two are complementary (prevention at the UI, backstop at the server).
- [ ] **(functional)** Approve and Decline are OFFERED only when the task status == 'QA Review' (Tron's exact case: on a Done task they are absent, not clickable-then-refused).
- [ ] **(functional)** Container actions ('+ Add Diagram', 'Add folder', 'Import PUML') are NOT offered on a Task unit (verbatim: 'do not make sens on tasks').
- [ ] **(functional)** '+ Add Diagram' is offered ONLY on the diagrams container; diagrams becomes a SPECIAL typed folder/CONTAINER (not a generic folder) — 'it should be a special Folder ... a container'.
- [ ] **(functional)** [TRON CLARIFICATION 2026-08-12, his ruling] 'physical' means a REAL PERSISTED unit ON DISK, NOT a filesystem directory: 'Add folder' IMMEDIATELY MINTS a real persisted Folder scenario-unit (as opposed to a synthetic/virtual tree node), and the itemview BECOMES that unit at once — NO mkdir, NO filesystem write; atomicity = the unit write. If the unit write FAILS, nothing changes and NO phantom itemview node appears. (AC renamed from AC-ADD-FOLDER-CREATES-PHYSICAL-FOLDER-AND-UNIT — 'PHYSICAL-FOLDER' read as filesystem; content-name per the letters-swap lesson.)
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron on phone, un-mockable, NEVER headless-green, TRON-ONLY] Tron verifies on his phone that the IMPOSSIBLE buttons are GONE (Approve absent on a Done task; container actions absent on a Task) AND that 'Add folder' creates the physical folder + unit + itemview live. AC-N-DEVICE convention so the approve-queue device-scan catches it when the covering task reaches QA Review.
- [ ] **(functional)** [TRON 2026-08-18, CAPTURE-ONLY he schedules] 'Open Task file' exists as a TASK DYNAMIC ACTION on the action bar (declared per-action like the others, R40.37 mechanism), NOT a plain inline link in the detail body as today. Verbatim: 'add a open Task file action as Task dynamic action.'
- [ ] **(functional)** [TRON 2026-08-18, CAPTURE-ONLY] Every task that is NOT the current task OFFERS 'Set as Current' and 'Set as next' as dynamic actions. Verbatim: 'the task is not the current task. so all not-current tasks should show the Set as Current and Set as next action'. Underlying assign capability = R40.17 (assign-task-as-current-or-next). ★ APPARENT-CONTRADICTION (NOT a regression): R40.18 defect-2 RETIRED Set-current/next on the DERIVED PIN (verified absent). Tron asks for them on NON-CURRENT TASKS. VISIBILITY (this AC — the button is OFFERED on non-current tasks per the matrix) is SETTLED; only the ACTION SEMANTICS (what Set-as-Current DOES) is open. ★ ACTION SEMANTICS HELD FOR TRON'S CALL (architect reconciliation 515260b8d, self-corrected by measuring the prior ruling): the earlier claim — that Set-as-Current writes an explicit steer CurrentSprint.currentTaskUuid via the designate seam (server.ts:1801) — is WITHDRAWN, because that designate mechanism IS the stored-winning-pin 2nd-source that R40.44 (7cb9617fb) RETIRED (/api/current-sprint/designate removed; the removal STANDS regardless). ★ SET-AS-CURRENT SEMANTICS RESOLVED + BUILT v0.8.105 (expert 215138bff; PO ruling + architect 515260b8d) = ADVANCE-BASED, NO stored pin: TaskPolicy makeCurrent intent advances Planned->In-Progress + stamps lastAdvancedAt (In-Progress->re-stamp; QA/Done->refuse) -> the DERIVED pin (max-lastAdvancedAt In-Progress) picks it + EMITS live cross-view. NOT designate/currentTaskUuid (that 2nd-source stays retired R40.44). SERVER POST /api/task/<uuid>/make-current owner-gated (VERIFIED 403 non-owner); /api/ior attaches model.pinRole (compute-on-read). Pin STAYS DERIVED = NOT a R40.18 regression, confirmed by build. ★ SET-AS-NEXT still DEFERRED — architect's set-next-semantics ruling pending (advance-based vs explicit nextBacklog); client decls+matrix ready, expert wires on the ruling. @390 owner-tap = Tron's device confirm (he's at the screen). ⏳ R40.37 CHAIN-WIRING NEEDED: the makeCurrent / open-task-file / pinRole code shipped v0.8.105 but is NOT yet in a scenario chain (Method/Impl/Test) — same shipped-chain-less pattern as the T37.26 formatter; architect maps -> I mint retroactive-to-shipped-code -> expert marks -> tester Tests, so R40.37 does not ship chain-less.
- [ ] **(functional)** [TRON 2026-08-18, CAPTURE-ONLY; MATRIX RULED by architect] Tron's two fixed cells: the already-NEXT task does NOT offer 'Set as next' (verbatim: 'obviously not the one which is already the next task'); the CURRENT task offers NEITHER Set-as-Current nor Set-as-next. ★ FULL MATRIX RULED (design-task-action-visibility-matrix-ruling.md @ de27341b4, sprint-40) — declared via the R40.37 appliesTo{when} mechanism with predicates isCurrent/isNext, onInvalid:'hide': CURRENT task = NEITHER (both hidden); NEXT task = Set-as-Current ONLY (set-next hidden, already-next); EVERY OTHER task = BOTH set-current + set-next; open-file = ALL tasks (nav/read action, no currency condition). Encoded: set-as-current appliesTo{types:['task'], when:!isCurrent}; set-as-next appliesTo{types:['task'], when:!isCurrent && !isNext}; open-file appliesTo{types:['task']}. Keyed on the DERIVED pin role, context-sensitive (NOT per-view if-statements). Tron's 2 cells match the ruling.
- [ ] **(functional)** [TRON 2026-08-18, CAPTURE-ONLY] Once the actions exist as DYNAMIC ACTIONS in the action bar, the detail rendering must NOT DUPLICATE them as inline clickable links — the ACTION BAR is the ONE action surface; the detail BODY renders DATA. Verbatim: 'the duplicated clickable links can then be removed in the details rendering'. Today the same actions (Scenario / Edit / Task file) render TWICE — action-bar buttons AND inline body links. ★ ORDERING DEPENDENCY (his 'can THEN be removed'): the inline links come out ONLY AFTER 'Open Task file' exists as a real action (AC-OPEN-TASK-FILE-DYNAMIC-ACTION) — removing the link first deletes the only path to the task file = a dead end. ★ SAME FAMILY as his morning DRY catch (sprint-name double-render, 'TWO implementations', R40.4): ONE THING, ONE PLACE — an action/datum has a single render home; a second render is the two-sources disease applied to ACTIONS. Name the family, not just the instance.

## Implementation

NOT STARTED (scenario-first). Architect designs the applicability model (per-action declaration in universalActionBar); expert builds; req mints chain + Test; scenario units on disk BEFORE implementation (#126).

## Subtasks

None (atomic; architect may split at design).
