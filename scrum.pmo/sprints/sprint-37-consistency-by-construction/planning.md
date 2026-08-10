<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 37 Planning — Consistency by Construction

## Sprint Goal

Files = the ONE source of truth; the CurrentSprint pin + the sprint boards (planning.md/task-mds/requirements.md) are GENERATED views that CANNOT drift; a FAIL-LOUD guard asserts pin==board==files, folded into ci:gates. Consistency owned by DESIGN, not vigilance (CMM4, not CMM2). R-C1 pin computed-from-files, R-C2 board generated + one-time reconcile-all (clears 29-sprint drift), R-C3 fail-loud ci-guard (drift-injection BITE), R-C4 objects self-heal. Build order R-C2->R-C1->R-C3->R-C4.

**Status:** Planned

## Tasks

- [ ] [Task C1: Pin is COMPUTED from files (never hand-set) [R-C1]](./task-c1-pin-computed-from-files.md)
- [ ] [Task C2: Board is a GENERATED view + one-time reconcile-all [R-C2]](./task-c2-board-generated-reconcile-all.md)
- [ ] [Task C3: FAIL-LOUD guard asserts pin==board==files (ci:gates, drift-injection BITE) [R-C3]](./task-c3-fail-loud-guard-bite.md)
- [ ] [Task C4: Objects self-heal (validate on init/read, never run silently drifted) [R-C4]](./task-c4-objects-self-heal.md)
- [ ] [Task C5: Dual-status reconcile — one truth (status vs statusChecklist), no Done-ness flip [R-C5]](./task-c5-dual-status-reconcile.md)
- [ ] [Task C6: sprints.overview.md is a GENERATED view (with preserved-narrative region) [R-C6]](./task-c6-sprints-overview-generated.md)
- [ ] [Task C7: Legacy hand-authored boards MIGRATED to generated (units-completeness-proven, zero loss) [R-C7]](./task-c7-legacy-board-migration.md)
- [ ] [Task C8: Generated-output writes route through a shared owned-output guard — never clobber/delete an UNMARKED (hand-authored) file, fail-closed [R-C8]](./task-c8-owned-output-delete-guard.md)
