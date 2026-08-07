<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 37 Requirements — Consistency by Construction

## Requirements

- [ ] **R-C1 — Pin is COMPUTED from files (never hand-set)**
  [requirement:uuid:91486de1-0cdd-4d57-b07e-9a5ce945702a]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  BOTH the CurrentSprint pin AND the current-TASK pointer ('📌 Current: Task N') are DERIVED by a resolver from the scenario units on disk (sprint = the sprint carrying active in-progress work; task = the active in-progress task) — NEITHER has a hand-editable stored value. 'Advance' becomes RUNNING the resolver. Fixes BOTH measured stale pointers: the 3-sprint-stale sprint-pin (S33 while work is on S36) AND the ~5-sprint-stale task-pointer ('Task 31.1'). Same drift class — one stale pointer proves vigilance fails; both must be computed.
  **Acceptance criteria:**
  - [ ] **(functional)** BOTH the CurrentSprint pin AND the current-task pointer are DERIVED by a resolver from the scenario units on disk; NEITHER has a hand-editable stored value the resolver can disagree with.
  - [ ] **(functional)** The current-task pointer ('📌 Current: Task N') is COMPUTED from the task units' status on disk (the active in-progress task), NEVER hand-set — the ~5-sprint-stale 'Task 31.1' pointer is a hand-set drift of the SAME class as the stale sprint-pin, and is eliminated the same by-construction way.
  - [ ] **(functional)** 'Advance the pin' (skill-expert duty) = RUNNING the resolver, NOT editing a value; a hand-set value is overridden by the recompute.
  - [ ] **(functional)** The computed sprint-pin == the sprint carrying active work (today S36, not stale S33, no 34/35 skip) AND the computed task-pointer == the active in-progress task on disk (not the measured ~5-sprint-stale 'Task 31.1').
  - [ ] **(gate)** TEST EXERCISES AC-computed+AC-task-pointer+AC-matches-files: arrange units so active work = sprint N / task T, run the resolver -> sprint-pin==N AND task-pointer==T deterministically; plant a stale hand-set sprint-pin OR task-pointer -> the recompute overrides BOTH. Verify Impl.tests[] on disk before flip.

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
  A FAIL-LOUD guard folded into ci:gates FAILS the build when the pointers/board/files disagree: (a) sprint-pin != computed-current-sprint-from-files; (a2) current-task-pointer != computed-active-task-from-files; (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match — extend check:sprint-md to FAIL on drift, not just report); (c) a task-status in a unit != its board checkbox. BOTH pointers (sprint + task) == board == files. The fail-loud is PROVEN by a real drift-injection BITE, NOT asserted.
  **Acceptance criteria:**
  - [ ] **(functional)** The guard FAILS the build if (a) sprint-pin != computed-current-sprint-from-files, OR (a2) current-task-pointer != computed-active-task-from-files, OR (b) ANY sprint's planning.md/task-md/requirements.md != regenerated (round-trip byte-match), OR (c) a task-status in a unit != its board checkbox. BOTH pointers (sprint + task) == board == files.
  - [ ] **(functional)** The guard is folded into ci:gates — check:sprint-md is EXTENDED to FAIL on any drift (not merely report); a drifted state cannot pass CI ('no silent broken state').
  - [ ] **(gate)** The fail-loud is PROVEN by a REAL drift-injection BITE, not asserted: planting sprint-pin!=files OR task-pointer!=files MUST make the guard exit non-zero with a clear message; planting board!=units MUST fail-loud; planting status!=checkbox MUST fail. A by-construction claim is false if only asserted (correct-by-construction-needs-gate-verification).
  - [ ] **(gate)** TEST EXERCISES AC-BITE directly: inject each drift kind (sprint-pin-drift, TASK-pointer-drift, board-drift, status-drift) -> assert guard exits non-zero + clear message each; remove all drift -> assert guard passes (GREEN). The Test IS the BITE. Verify Impl.tests[] on disk before flip.

- [ ] **R-C4 — Objects self-heal (validate on init/read, never run silently drifted)**
  [requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  The pin and board objects VALIDATE on init/read: they reflect reality (recompute from files) or REFUSE to run drifted — they never return a silently-drifted value. Consistency is a property of the objects, not of anyone's vigilance.
  **Acceptance criteria:**
  - [ ] **(functional)** The pin/board objects VALIDATE on init/read -> either recompute to reflect reality, or REFUSE to run when drifted.
  - [ ] **(functional)** The objects NEVER return a silently-drifted value — always fail-loud or self-correct on read.
  - [ ] **(gate)** TEST EXERCISES AC-validate-on-init+AC-never-silent: construct a drifted pin/board object -> it recomputes to reality OR throws/refuses (never returns silently-wrong). Verify Impl.tests[] on disk before flip.
