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
- [x] 🏁 [Task 37.27: Sprint/task-name MIGRATION — strip embedded numbers to the single attribute, PHASED S37-first (R40.4-phase-2)](./task-37.27-sprint-task-name-migration.md)
- [ ] ⏳ [Task 37.28: Truth-decay / no-freshness-invariant family — coordination root (6 per-class freshness guards + cross-cutting Arm-B/meta/prose-ungated)](./task-37-28-truth-decay-freshness-family.md)
- [ ] ⏳ [Task 37.28.1: boot-state (sprint/version) freshness guard — state-removal OR currency-lint boot==HEAD](./task-37-28-1-boot-state.md)
- [ ] ⏳ [Task 37.28.2: derived-slot (NEXT/CURRENT) freshness guard — DERIVE from single source, drop stored overrides](./task-37-28-2-derived-slot.md)
- [ ] ⏳ [Task 37.28.3: deploy-instruction (DEPLOY-STATE.md) freshness guard — derive-from-branch-reality OR stamp+render-stale](./task-37-28-3-deploy-instruction.md)
- [ ] ⏳ [Task 37.28.4: req-satisfaction freshness guard — DERIVE satisfied from a tracked covering task, never a stored flag](./task-37-28-4-req-satisfaction.md)
- [ ] ⏳ [Task 37.28.5: guard-coverage freshness guard — coverage DERIVES from guard-in-ci:gates + substep present](./task-37-28-5-guard-coverage.md)
- [ ] ⏳ [Task 37.28.6: constraint-cycle (structural) freshness guard — cycle + no-satisfying-path detection over the blocker graph](./task-37-28-6-constraint-cycle.md)
- [ ] ✅ [Task 37.13: Naming is canon by construction — the be](./task-37-13-naming-is-canon-by-construction-the-be.md)
- [ ] ⏳ [Task 37.14: Identifiers are measured-random v4 by co](./task-37-14-identifiers-are-measured-random-v4-by-co.md)
- [ ] ⏳ [Task 37.15: Store-once theme-only names — a stored n](./task-37-15-store-once-theme-only-names-a-stored-n.md)
- [ ] ⏳ [Task 37.16: The board never marks a task RIPE on a S](./task-37-16-the-board-never-marks-a-task-ripe-on-a-s.md)
- [ ] ⏳ [Task 37.17: Gates must not encode a SNAPSHOT of the ](./task-37-17-gates-must-not-encode-a-snapshot-of-the.md)
- [ ] ⏳ [Task 37.18: A gate resolves an artifact the SAME WAY](./task-37-18-a-gate-resolves-an-artifact-the-same-way.md)
- [ ] ⏳ [Task 37.19: New req-specific Class units root to the](./task-37-19-new-req-specific-class-units-root-to-the.md)
