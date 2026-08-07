<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 37 Requirements — Consistency by Construction

## Requirements

- [ ] **R-C1 — Pin is COMPUTED from files (never hand-set)**
  [requirement:uuid:91486de1-0cdd-4d57-b07e-9a5ce945702a]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  The CurrentSprint pin is DERIVED by a resolver from the scenario units on disk (the sprint carrying the active in-progress work) — it has NO hand-editable stored value. 'Advance the pin' becomes RUNNING the resolver, not editing a value. Fixes the measured 3-sprint stale pin (S33 while work is on S36).
  **Acceptance criteria:**
  - [ ] **(functional)** A currentSprint resolver DERIVES the pin from the scenario units on disk (the sprint the active work is on); there is NO hand-editable stored pin value the resolver can disagree with.
  - [ ] **(functional)** 'Advance the pin' (skill-expert duty) = RUNNING the resolver, NOT editing a value; a hand-set value is overridden by the recompute.
  - [ ] **(functional)** The computed pin == the sprint carrying the active in-progress work on disk (today S36, not the stale S33) — no 34/35 skip.
  - [ ] **(gate)** TEST EXERCISES AC-computed+AC-matches-files: arrange units so active work is on sprint N, run the resolver -> pin==N deterministically; plant a stale/hand-set pin -> the recompute overrides it to N. Verify Impl.tests[] on disk before flip.

- [ ] **R-C2 — Board is a GENERATED view + one-time reconcile-all**
  [requirement:uuid:eec7ebb7-5dd3-431f-9700-a50429c3de03]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  planning.md + task-mds + requirements.md are GENERATED from scenario units (existing generate-sprint-md) — never hand-maintained. A ONE-TIME reconcile-all regenerates EVERY sprint's views from its units, clearing the 29-sprint historical drift (24 requirements.md + a few planning/task-md) in ONE pass — not hand-fixed per file.
  **Acceptance criteria:**
  - [ ] **(functional)** planning.md + task-mds + requirements.md are GENERATED from the sprint's scenario units (generate-sprint-md); the header marks them generated, no hand-maintenance.
  - [ ] **(functional)** A one-time reconcile-all regenerates EVERY sprint's views from its units in ONE pass, clearing the 29-sprint historical drift — NOT hand-fixed per file.
  - [ ] **(functional)** After reconcile-all, generate-sprint-md --check --all byte-matches for ALL sprints (0 drift remaining).
  - [ ] **(gate)** TEST EXERCISES AC-reconcile-all+AC-post-clean: on the drifted set (the 29 sprints), run reconcile-all -> --check --all reports GREEN/byte-match for every sprint. Verify Impl.tests[] on disk before flip.

- [ ] **R-C3 — FAIL-LOUD guard asserts pin==board==files (in ci:gates, drift-injection BITE)**
  [requirement:uuid:1530c79c-39a6-40b7-8d2b-044d5583aa59]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  A FAIL-LOUD guard folded into ci:gates FAILS the build when pin/board/files disagree: (a) pin != computed-current-from-files; (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match — extend check:sprint-md to FAIL on drift, not just report); (c) a task-status in a unit != its board checkbox. The fail-loud is PROVEN by a real drift-injection BITE, NOT asserted.
  **Acceptance criteria:**
  - [ ] **(functional)** The guard FAILS the build if (a) pin != computed-current-sprint-from-files, OR (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match), OR (c) a task-status in a unit != its board checkbox.
  - [ ] **(functional)** The guard is folded into ci:gates — check:sprint-md is EXTENDED to FAIL on any drift (not merely report); a drifted state cannot pass CI ('no silent broken state').
  - [ ] **(gate)** The fail-loud is PROVEN by a REAL drift-injection BITE, not asserted: planting pin!=files MUST make the guard exit non-zero with a clear message; planting board!=units MUST make it fail-loud; planting status!=checkbox MUST fail. A by-construction claim is false if only asserted (correct-by-construction-needs-gate-verification).
  - [ ] **(gate)** TEST EXERCISES AC-BITE directly: inject each drift kind (pin-drift, board-drift, status-drift) -> assert guard exits non-zero + clear message each; remove all drift -> assert guard passes (GREEN). The Test IS the BITE. Verify Impl.tests[] on disk before flip.

- [ ] **R-C4 — Objects self-heal (validate on init/read, never run silently drifted)**
  [requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  The pin and board objects VALIDATE on init/read: they reflect reality (recompute from files) or REFUSE to run drifted — they never return a silently-drifted value. Consistency is a property of the objects, not of anyone's vigilance.
  **Acceptance criteria:**
  - [ ] **(functional)** The pin/board objects VALIDATE on init/read -> either recompute to reflect reality, or REFUSE to run when drifted.
  - [ ] **(functional)** The objects NEVER return a silently-drifted value — always fail-loud or self-correct on read.
  - [ ] **(gate)** TEST EXERCISES AC-validate-on-init+AC-never-silent: construct a drifted pin/board object -> it recomputes to reality OR throws/refuses (never returns silently-wrong). Verify Impl.tests[] on disk before flip.
