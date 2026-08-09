<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C5: Dual-status reconcile — one truth (status vs statusChecklist), no Done-ness flip [R-C5]

[task:uuid:97e8a6ad-46db-440f-a9be-cfb97ca64df4]

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

QA-Review (units-win over stale Planned board): chain-complete-to-Test — Impl d86f0309 assertStatusConsistent markerPending=false + Impl.tests[]=[30d4b44a] pass, BITE gate GREEN (rc5-taskstatus-bite, fail-loud offender-naming). All 4 In-Progress sub-steps [x]. Done-gate [ ] = Tron's act. Board re-derived from units (PO campaign-sync 2026-08-09).

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R-C5 `[requirement:uuid:03fd79ff-da54-4c91-b542-cbf330cd22aa]`
  - down
    - None (atomic task)

## Task Description

R-C5 (architect-surfaced during R-C2 design). A Task unit carries TWO independent status fields — model.status (-> planning checkbox) AND model.statusChecklist (free-text -> task-md '## Status') — which can DISAGREE WITHIN the source (e.g. Task 95: status='In Progress' but statusChecklist all-checked). R-C5 makes a task's status ONE truth WITHOUT flipping its displayed Done-ness (disagreements are surfaced for the honesty audit, never silently reconciled to Done = a status invention). Kept OUT of R-C2 (which regenerates from BOTH fields as-is, INV-C4).

## Acceptance Criteria

- [ ] (functional) A Task's status is ONE truth: model.status and model.statusChecklist are reconciled (or one derived from the other) so they CANNOT disagree within a unit.
- [ ] (functional) The reconcile MUST NOT flip a task's displayed Done-ness (a status='In Progress' + all-checked checklist is SURFACED for the honesty audit, NOT silently flipped to Done) - no status invention, honors R-C2 INV-C4.
- [ ] (functional) A FAIL-LOUD detector assertStatusConsistent asserts status==deriveStatusEnum(statusChecklist) for EVERY Task and exit 1 LISTING every offender, FLAGGING the dangerous status='Done' && Done-box-UNCHECKED subset as FALSE-DONE priority. Folds into ci:gates. The list IS the owner-resolve worklist (resolution flows checklist->status, never reverse).
- [ ] (functional) The 1 malformed (non-string) statusChecklist found on disk is handled safely: deriveStatusEnum and the detector do NOT crash on it - it is flagged for repair-to-template, not silently mis-derived.
- [ ] (functional) status/statusChecklist disagreements are surfaced to the planner honesty audit (the UNIT is the thing to fix, not the view); ties to the S33-36 honesty correction.
- [ ] (gate) TEST = false-Done BITE (distinct-intent, exercises its own AC): plant status='Done' on a task whose checklist Done-box is [ ] -> assertStatusConsistent MUST exit 1 naming it FALSE-DONE; a task with status==deriveStatusEnum(checklist) -> passes; setting status=deriveStatusEnum on a fresh edit keeps them equal (by-construction, no new drift). Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
