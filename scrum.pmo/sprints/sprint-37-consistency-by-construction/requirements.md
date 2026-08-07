<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 37 Requirements — Consistency by Construction

## Requirements

- [ ] **R-C1 — Pin is COMPUTED from files (never hand-set)**
  [requirement:uuid:91486de1-0cdd-4d57-b07e-9a5ce945702a]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  BOTH the CurrentSprint pin AND the current-TASK pointer ('📌 Current: Task N') are DERIVED by a resolver from the scenario units on disk (sprint = the sprint carrying active in-progress work; task = the active in-progress task) — NEITHER has a hand-editable stored value. 'Advance' becomes RUNNING the resolver. Fixes BOTH measured stale pointers: the 3-sprint-stale sprint-pin (S33 while work is on S36) AND the ~5-sprint-stale task-pointer ('Task 31.1'). Same drift class — one stale pointer proves vigilance fails; both must be computed. The pin's THREE SLOTS are all computed: CURRENT = sprint with in-progress work (QA-pending-only is NOT current), LAST-COMPLETED = highest fully-Done, NEXT-BACKLOG = next Planned — the by-construction answer to the open-for-QA ambiguity (a human should never have to ask 'is this sprint still current').
  **Acceptance criteria:**
  - [ ] **(functional)** BOTH the CurrentSprint pin AND the current-task pointer are DERIVED by a resolver from the scenario units on disk; NEITHER has a hand-editable stored value the resolver can disagree with.
  - [ ] **(functional)** The current-task pointer ('📌 Current: Task N') is COMPUTED from the task units' status on disk (the active in-progress task), NEVER hand-set — the ~5-sprint-stale 'Task 31.1' pointer is a hand-set drift of the SAME class as the stale sprint-pin, and is eliminated the same by-construction way.
  - [ ] **(functional)** The three CurrentSprint slots are COMPUTED from unit/task state, NEVER hand-set: CURRENT = the sprint carrying IN-PROGRESS work (a sprint open ONLY on QA-pending items is NOT current — e.g. S36 today, open only for QA); LAST-COMPLETED = the highest fully-Done sprint; NEXT-BACKLOG = the next Planned sprint. This is the by-construction answer to 'is an open-for-QA sprint still current' — the resolver decides, never a human.
  - [ ] **(gate)** TEST EXERCISES AC-three-slots: feed a fixture where S36 is open ONLY on QA-pending items AND S37 has in-progress work -> the resolver returns current=S37, last-completed=S35, next-backlog=S38-or-none. Deterministic from unit/task state; no hand-set slot. Verify Impl.tests[] on disk before flip.
  - [ ] **(functional)** 'Advance the pin' (skill-expert duty) = RUNNING the resolver, NOT editing a value; a hand-set value is overridden by the recompute.
  - [ ] **(functional)** The computed sprint-pin == the sprint carrying active work (today S36, not stale S33, no 34/35 skip) AND the computed task-pointer == the active in-progress task on disk (not the measured ~5-sprint-stale 'Task 31.1').
  - [ ] **(gate)** TEST EXERCISES AC-computed+AC-task-pointer+AC-matches-files: arrange units so active work = sprint N / task T, run the resolver -> sprint-pin==N AND task-pointer==T deterministically; plant a stale hand-set sprint-pin OR task-pointer -> the recompute overrides BOTH. Verify Impl.tests[] on disk before flip.

- [ ] **R-C2 — Board is a GENERATED view + one-time reconcile-all**
  [requirement:uuid:eec7ebb7-5dd3-431f-9700-a50429c3de03]
  > Tron AUTHORIZED Sprint 37 = consistency-by-construction (2026-08-07, via robbin-po); files = the ONE source of truth, pin+board = GENERATED views that cannot drift, a FAIL-LOUD guard asserts pin==board==files.
  planning.md + task-mds + requirements.md are GENERATED from scenario units (existing generate-sprint-md) — never hand-maintained. A ONE-TIME reconcile-all regenerates EVERY sprint's views from its units, clearing the 29-sprint historical drift (24 requirements.md + a few planning/task-md) in ONE pass — not hand-fixed per file.
  **Acceptance criteria:**
  - [ ] **(functional)** planning.md + task-mds + requirements.md are GENERATED from the sprint's scenario units (generate-sprint-md); the header marks them generated, no hand-maintenance.
  - [ ] **(functional)** A one-time reconcile-all regenerates every GENERATOR-OWNED board (files carrying the GENERATED_HEADER) from its units in ONE pass, clearing the drift in the boards the generator owns — NOT hand-fixed per file. It does NOT clobber legacy hand-authored boards (no header) — the OWNED-OUTPUT data-loss invariant; those are migrated under R-C7.
  - [ ] **(functional)** After reconcile-all + the R-C7 S21-29 backfills, ALL IN-SCOPE boards (S21-S29 post-backfill + the already-generated S19/S20/S23/S30-S37) byte-match generate-sprint-md --check — a REAL number (e.g. ~20/20 in-scope), NOT a fake 37/37. The 17 S01-S18 legacy hand-authored boards are EXPLICITLY FROZEN + LABELLED legacy and EXCLUDED from checkSprint scope (no-silent-caps, tracked under R-C7). check:sprint-md acceptance = in-scope + generated boards only.
  - [ ] **(gate)** TEST EXERCISES AC-reconcile-all+AC-post-clean: on the drifted set (the 29 sprints), run reconcile-all -> --check --all reports GREEN/byte-match for every sprint. Verify Impl.tests[] on disk before flip.
  -> sprintBoard.reconcileAll [uc:uuid:bf1cf902-5b41-4ed5-960b-3806ad498cf1]

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

- [ ] **R-C5 — Dual-status reconcile — one truth (status vs statusChecklist), no Done-ness flip**
  [requirement:uuid:03fd79ff-da54-4c91-b542-cbf330cd22aa]
  > (S37 consistency-by-construction, Tron-auth #76) — architect-surfaced during R-C2 design, PO-approved as a distinct req.
  A Task unit carries TWO independent status fields — model.status (-> planning checkbox) AND model.statusChecklist (free-text -> task-md '## Status') — which can DISAGREE WITHIN the source (e.g. Task 95: status='In Progress' but statusChecklist all-checked). R-C5 makes a task's status ONE truth WITHOUT flipping its displayed Done-ness (disagreements are surfaced for the honesty audit, never silently reconciled to Done = a status invention). Kept OUT of R-C2 (which regenerates from BOTH fields as-is, INV-C4).
  **Acceptance criteria:**
  - [ ] **(functional)** A Task's status is ONE truth: model.status and model.statusChecklist are reconciled (or one derived from the other) so they CANNOT disagree within a unit.
  - [ ] **(functional)** The reconcile MUST NOT flip a task's displayed Done-ness (a status='In Progress' + all-checked checklist is SURFACED for the honesty audit, NOT silently flipped to Done) — no status invention, honors R-C2 INV-C4.
  - [ ] **(functional)** A FAIL-LOUD detector assertStatusConsistent asserts status==deriveStatusEnum(statusChecklist) for EVERY Task and exit 1 LISTING every offender, FLAGGING the dangerous status='Done' && Done-box-UNCHECKED subset as FALSE-DONE priority (the honesty-audit target). Folds into ci:gates. The list IS the owner-resolve worklist (resolution flows checklist->status, never reverse).
  - [ ] **(functional)** The 1 malformed (non-string) statusChecklist found on disk is handled safely: deriveStatusEnum and the detector do NOT crash on it — it is flagged for repair-to-template, not silently mis-derived.
  - [ ] **(functional)** status/statusChecklist disagreements are surfaced to the planner honesty audit (the UNIT is the thing to fix, not the view); ties to the S33-36 honesty correction.
  - [ ] **(gate)** TEST = false-Done BITE (distinct-intent, exercises its own AC): plant status='Done' on a task whose checklist Done-box is [ ] -> assertStatusConsistent MUST exit 1 naming it FALSE-DONE; a task with status==deriveStatusEnum(checklist) -> passes; setting status=deriveStatusEnum on a fresh edit keeps them equal (by-construction, no new drift). Verify Impl.tests[] on disk before flip.
  -> taskStatus.deriveAndAssert [uc:uuid:2a840e93-8b20-4b50-97ef-38d7cab1df53]

- [ ] **R-C6 — sprints.overview.md is a GENERATED view (with preserved-narrative region)**
  [requirement:uuid:9339cc3b-8035-403b-8bef-8c08df15edc2]
  > (S37 consistency-by-construction, Tron-auth #76) — architect-surfaced during R-C2 design, PO-approved as a distinct req.
  sprints.overview.md is currently a HAND-MAINTAINED narrative (WIP=1, CURRENT-SPRINT block) — the remaining un-generated board seam. R-C6 makes it a GENERATED view: the sprint table (number/name/status/goal) is generated from the Sprint units, with a PRESERVED-narrative OWNED-region (the WIP/CURRENT-SPRINT human block survives regeneration, mirroring the header guard), + a new --check folded into ci:gates so it cannot drift.
  **Acceptance criteria:**
  - [ ] **(functional)** The sprints.overview.md sprint-table (number/name/status/goal per sprint) is GENERATED from the Sprint units, not hand-maintained.
  - [ ] **(functional)** A PRESERVED-narrative OWNED-region (the WIP / CURRENT-SPRINT human block) survives regeneration untouched (mirror the GENERATED-header/OWNED-output guard) — the generator writes the table region, preserves the narrative region.
  - [ ] **(functional)** A new --check for sprints.overview.md is folded into ci:gates (fails on drift like the other boards) — the overview joins the pin==board==files guard (R-C3).
  - [ ] **(gate)** TEST EXERCISES AC-generated+AC-preserved-narrative: regenerate sprints.overview.md -> the sprint-table reflects the Sprint units AND the preserved-narrative region is byte-untouched; injecting table-drift -> --check FAILS. Verify Impl.tests[] on disk before flip.

- [ ] **R-C7 — Legacy hand-authored boards MIGRATED to generated (units-completeness-proven, zero loss)**
  [requirement:uuid:6ccbef4e-4630-408d-8178-b8af73710759]
  > (S37 consistency-by-construction, Tron-auth #76) — expert-surfaced during R-C2 run, PO-approved as the safe legacy-migration req; EXECUTION needs Tron-auth (data-loss).
  The ~20 legacy hand-authored requirements.md + ~10 planning.md (pre-R30.18, no GENERATED_HEADER) are MIGRATED to generated views so the whole board becomes generated (closing the drift-seam R-C2 could not touch). DATA-LOSS-SENSITIVE: for each legacy board, its scenario UNITS must be PROVEN to carry ALL the file's content BEFORE any clobber; where they do not, the units are BACKFILLED from the file FIRST (the file is that content's source of record until migrated). Idempotent + reversible, ZERO content loss. Explicitly TRACKED (no-silent-caps). TRON BOUNDED (2026-08-07): backfill S21-S29 ONLY (~119 gaps) to generated+guarded; FREEZE S01-S18 as labelled legacy (excluded from checkSprint, tracked, no-silent-caps); the 11 already-PASS are fine. Per-sprint --prove names the exact gaps; backfill those -> re-prove -> --apply one-sprint-atomic. Runs one sprint at a time, each only after its units-completeness is proven; genuine narrative stays hand-authored. Makes R-C2 37/37 REAL as an IN-SCOPE number.
  **Acceptance criteria:**
  - [ ] **(safety)** Before ANY clobber of a legacy hand-authored board, its scenario UNITS are PROVEN to carry ALL the file's content (per-sprint units-completeness check); NO file is overwritten until completeness is proven for that sprint.
  - [ ] **(safety)** Where the units do NOT carry all the content, the units are BACKFILLED from the file FIRST (content flows file->units, the file being that content's source of record until migrated) — THEN the generator owns the view. Content that exists only in the file is NEVER deleted.
  - [ ] **(safety)** GENUINE narrative content (human prose that is NOT unit-derived — e.g. design rationale, notes) STAYS hand-authored in a preserved region (mirrors R-C6's preserved-narrative OWNED-region); the migration generates the unit-derived portions and PRESERVES genuine narrative, never flattening it into a lossy generated view.
  - [ ] **(safety)** The migration is idempotent (re-run = no-op) and REVERSIBLE ONE-SPRINT-AT-A-TIME (each sprint's pre-migration file is recoverable via git before moving to the next); ZERO content loss end-to-end, provable by diffing pre-file content against post-generated + units.
  - [ ] **(functional)** BOUNDED SCOPE (Tron ruling 2026-08-07): IN-SCOPE = S21-S29 (~119 named gaps backfilled to generated+guarded; S23 already PASSES). S01-S18 = FROZEN LEGACY hand-authored — NOT backfilled, EXCLUDED from checkSprint, and EXPLICITLY LABELLED legacy (visible + tracked, no-silent-caps — never silently dropped). The 11 already-PASS boards (S19/S20/S23/S30-S37) are fine. Worklist = expert gap report ed9beb540 (scrum.pmo/board-migration-gap-report.md), the exact named items per sprint.
  - [ ] **(governance)** TRON-AUTHORIZED EXECUTABLE (2026-08-07): the migration RUNS (not just tracked), one sprint at a time; each sprint migrates ONLY after its units-completeness is PROVEN (per-sprint gate, not a team-wide block). The architect designs the procedure + per-sprint classification.
  - [ ] **(gate)** BITE TEST (distinct-intent, exercises AC-units-completeness): plant a units-INCOMPLETE sprint (units missing some file content) -> the migration REFUSES to write that sprint (fail-loud, no clobber); a units-COMPLETE sprint -> migrates + --check byte-matches + original content fully present (post-generated + units) + reversible. Verify Impl.tests[] on disk before flip.
  -> board.migrateProvenComplete [uc:uuid:c8c3d81e-4ec4-48e7-9769-842e93879897]
