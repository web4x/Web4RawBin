<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 37 Planning — Consistency by Construction

## Sprint Goal

Files = the ONE source of truth; the CurrentSprint pin + the sprint boards (planning.md/task-mds/requirements.md) are GENERATED views that CANNOT drift; a FAIL-LOUD guard asserts pin==board==files, folded into ci:gates. Consistency owned by DESIGN, not vigilance (CMM4, not CMM2). R37.1 pin computed-from-files, R37.2 board generated + one-time reconcile-all (clears 29-sprint drift), R37.3 fail-loud ci-guard (drift-injection BITE), R37.4 objects self-heal. Build order R37.2->R37.1->R37.3->R37.4.

**Status:** Planned

## Tasks

- [ ] 🧪 [Task 37.1: Pin is COMPUTED from files (never hand-set) [R37.1]](./task-37.1-pin-computed-from-files.md)
- [ ] 🧪 [Task 37.2: Board is a GENERATED view + one-time reconcile-all [R37.2]](./task-37.2-board-generated-reconcile-all.md)
- [ ] 🧪 [Task 37.3: FAIL-LOUD guard asserts pin==board==files (ci:gates, drift-injection BITE) [R37.3]](./task-37.3-fail-loud-guard-bite.md)
- [ ] ⏳ [Task 37.4: Objects self-heal (validate on init/read, never run silently drifted) [R37.4]](./task-37.4-objects-self-heal.md)
- [ ] 🧪 [Task 37.5: Dual-status reconcile — one truth (status vs statusChecklist), no Done-ness flip [R37.5]](./task-37.5-dual-status-reconcile.md)
- [ ] 🧪 [Task 37.6: sprints.overview.md is a GENERATED view (with preserved-narrative region) [R37.6]](./task-37.6-sprints-overview-generated.md)
- [ ] 🧪 [Task 37.7: Legacy hand-authored boards MIGRATED to generated (units-completeness-proven, zero loss) [R37.7]](./task-37.7-legacy-board-migration.md)
- [ ] 🧪 [Task 37.8: Generated-output writes route through a shared owned-output guard — never clobber/delete an UNMARKED (hand-authored) file, fail-closed [R37.8]](./task-37.8-owned-output-delete-guard.md)
- [ ] 🧪 [Task 37.4.1: MODEL self-heal on read — ANY unit object validates on init/read (fresh-or-refuse), never returns a silently-drifted value (feeds the pipeline)](./task-37.4.1-model-self-heal-on-read.md)
- [ ] 🧪 [Task 37.4.2: CONTROLLER — one generic unitController.apply for ANY unit mutation (validate-via-registered-policy → apply → persist → emit); Task FSM = policy #1, statusNext = thin facade](./task-37.4.2-controller-statusnext.md)
- [ ] 🧪 [Task 37.4.3: CONTROLLER is the UNIQUE DOMINATOR of any unit mutation; single-source Done delegation — R40.10 approve DELEGATES, tronApprove folds in (no second writer)](./task-37.4.3-controller-single-source-done.md)
