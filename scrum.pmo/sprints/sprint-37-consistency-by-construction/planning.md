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
