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
- [ ] ⏳ [Task 37.20: ONE shared DnD drop contract — buffer carries the scenario unit (not a URL/webitem), file-drags-as-file, details render, fleet-wide every drop target](./task-37.20-shared-dnd-drop-contract.md)
- [ ] ⏳ [Task 37.21: Room Members/Files become real Folder scenario-units with sunburst detail (rides R40.16, no dup)](./task-37.21-room-collections-real-folder-units.md)
- [ ] ⏳ [Task 37.22: IOR carries a clear origin (class+host+path) for cross-instance DnD, reconciled with federated ior@host (no fork)](./task-37.22-ior-clear-origin.md)
- [ ] ⏳ [Task 37.23: Server-manager root discovered from ssh config on disk (like otmux tree items), not hardcoded WODA.prod](./task-37.23-discovered-server-manager-root.md)
- [ ] 🧪 [Task 37.24: Realtime-MVC live-update slice — a routed write appears live in item + detail + pin @390](./task-37.24-realtime-mvc-live-update-slice.md)
- [ ] 📝 [Task 37.25: Realtime-MVC ONE VIEW BUS — unify to a single view bus + views subscribe-on-render, live-update coverage gated @390 (R37.12)](./task-37.25-realtime-mvc-one-view-bus.md)
- [ ] 🧪 [Task 37.26: Sprint/task-name FORMATTER — item shows EXACTLY 'Sprint <n>: <title>' / 'Task <n>.<m>: <title>' everywhere @390 (R40.4-phase-2)](./task-37.26-sprint-task-name-formatter.md)
- [ ] 🧪 [Task 37.27: Sprint/task-name MIGRATION — strip embedded numbers to the single attribute, PHASED S37-first (R40.4-phase-2)](./task-37.27-sprint-task-name-migration.md)
