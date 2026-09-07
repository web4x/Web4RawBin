<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.3: FAIL-LOUD guard asserts pin==board==files (ci:gates, drift-injection BITE) [R37.3]

[task:uuid:364785b1-6d6a-4b08-8c18-a282a32fbf9d]

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

HELD-FROM-BATCH (PO 2026-08-12, NOT Tron-signable): tester-diagnosed = GATE STALE/UNVERIFIABLE (status:pass over a currently-RED gate DET-3x, hollow-row class), FEATURE NOT IMPLICATED (no broken feature). Status stays QA-Review (not downgraded); do NOT approve until the gate is re-verified GREEN. --- QA-Review (units-win over stale Planned board): chain-complete-to-Test — Impl ee424581 refuseIfVacuous markerPending=false + Impl.tests[]=[caf74333] pass, BITE gate GREEN (rc3-consistency-guard-metabite, real drift-injection). All 4 In-Progress sub-steps [x]. Done-gate [ ] = Tron's act. Board re-derived from units (PO campaign-sync 2026-08-09).

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.3 `[requirement:uuid:1530c79c-39a6-40b7-8d2b-044d5583aa59]`
  - down
    - None (atomic task)

## Task Description

R37.3 (build 3rd). A FAIL-LOUD guard folded into ci:gates FAILS the build when the pointers/board/files disagree: (a) sprint-pin != computed-current; (a2) current-TASK-pointer != computed-active-task; (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match — extend check:sprint-md to FAIL on drift); (c) a task-status in a unit != its board checkbox. BOTH pointers (sprint + task) == board == files. The fail-loud is PROVEN by a real drift-injection BITE, NOT asserted.

## Acceptance Criteria

- [ ] **(functional)** The guard FAILS the build if (a) sprint-pin != computed-current-sprint-from-files, OR (a2) current-task-pointer != computed-active-task-from-files, OR (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match), OR (c) a task-status in a unit != its board checkbox. BOTH pointers (sprint + task) == board == files.
- [ ] **(functional)** The guard is folded into ci:gates — check:sprint-md is EXTENDED to FAIL on any drift (not merely report); a drifted state cannot pass CI ('no silent broken state').
- [ ] **(gate)** The fail-loud is PROVEN by a REAL drift-injection BITE, not asserted: planting sprint-pin!=files OR task-pointer!=files MUST make the guard exit non-zero with a clear message; planting board!=units MUST fail-loud; planting status!=checkbox MUST fail. A by-construction claim is false if only asserted (correct-by-construction-needs-gate-verification).
- [ ] **(gate)** TEST EXERCISES AC-BITE directly: inject each drift kind (sprint-pin-drift, TASK-pointer-drift, board-drift, status-drift) -> assert guard exits non-zero + clear message each; remove all drift -> assert guard passes (GREEN). The Test IS the BITE. Verify Impl.tests[] on disk before flip.
- [ ] **(vacuous)** FAIL-CLOSED on vacuous input (INV-C3-1): every S37 guard REFUSES with a named reason on any vacuous shape - unresolvable-uuid / missing-or-empty-file / absent-or-malformed-checklist / 0-items-where->=1-expected / wrong-ior-class / null-output / a positive assertion over an empty collection. NEVER a silent pass.
- [ ] **(vacuous)** NO vacuous truth (INV-C3-2): a positive assertion over an empty/absent set defaults to FAIL for a gate - every([])===true / all-of-nothing / '0 offenders because 0 were scanned' must NOT read as clean (false-low-worse-than-absent).
- [ ] **(vacuous)** Named reason (INV-C3-3): every refusal carries a human reason STRING (not a bare false / exit 1) so CI output says WHY it refused.
- [ ] **(dry)** ONE shared helper refuseIfVacuous(value,{name,expect}) is called at the TOP of every guard (DRY - no per-guard ad-hoc null-checks that each drift subtly); returns {ok:false,reason} | {ok:true}.
- [ ] **(ci)** A consistency:strict ci:gate (INV-C3-4) composes the S37 guards - pin (R37.1 resolver==committed pin) + dual-status (R37.5 assertStatusConsistent) + board-drift (R37.2, missing-file=FAIL) + migration-refuse (R37.7 proveComplete); ANY refusal fails the build; folded into ci:gates:raw.
- [ ] **(ci)** DUAL FLIP-CONDITION (INV-C3-6, RECORDED so nobody flips it early and re-REDs the fleet on legacy state): consistency:strict transitions from REPORT-ONLY-LOUD (surfaces every drift by name, NEVER blocks) to STRICT (build-blocking) ONLY when BOTH hold — (a) task dual-status drift == 0 graph-wide (status vs statusChecklist reconciled per R37.5 assertStatusConsistent; the 27 are reconciled, the 10 remaining legacy are EXCLUDED via the ruled FROZEN-LEGACY set — visible + named per R37.7 INV-C6-3, never silently dropped), AND (b) the sprint-pin resolves to <=1 Active sprint OR has received Tron's EXPLICIT current-sprint designation (R40.17 explicit-current, single-sourced — the escape hatch for the multi-Active ambiguity). The flip is a DELIBERATE gated transition, not a default: a premature flip while >1 Active OR drift>0 would re-RED the whole fleet on pre-existing legacy state (report-loud-first, strict-when-earned — the automate-before-gate discipline).
- [ ] **(gate)** META-BITE (gate-proves the gate-prover): the vacuous-BITE suite feeds EACH guard x EACH vacuous path (unresolvable/empty/missing-file/malformed/wrong-ior/null) and asserts REFUSE-with-reason (INV-C3-5 BITE-per-vacuous-path); PLUS a deliberately-vacuous-PASSING stub guard that MUST turn the suite RED - proving the suite would catch a silent-pass regression.

## Subtasks

None (atomic task).
