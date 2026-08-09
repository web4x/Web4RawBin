# Campaign Inventory — Sprint 37 (C1–C7) + Sprint 40 (T40.1–T40.12)

**Authoritative per-task chain-state, measured FROM THE SCENARIO UNITS ON DISK, not the board MD.**
Where the board (`planning.md` / task-MD) and the units disagree, **the units win** and it is called out.

- Author: robbin-planner (audit). Read-only measurement. **Zero status flips. No requirements/board MD touched.**
- Method: read each Task unit (`model.status` + `model.statusChecklist`), then walked each `coveredRequirements[]` → UseCase → Method → Implementation (`markerPending`, `tests[]`) → Test (`model.status`), and cross-checked `test/visual/` gate files + `git log`.
- Test `status` legend on disk: `pass`/`PASS`/`GREEN` = recorded green; `None`/`superseded` = not green.
- **Target = QA-Review** (NOT Done — Done is Tron's act). Gap categories: **(a) BUILD** no impl · **(b) MARKER** strict-AST flip (markerPending still true) · **(c) GATE** no gate GREEN · **(d) TWO-KEY** chain-complete-to-Test not both-directions-verified · **(e) BLOCKED-ON-TRON-DEVICE**.

---

## Sprint 37 — "Consistency by Construction" (unit `b86b53cc`, sprint status = Planned)

Sprint-37 task-UUIDs read from the sprint unit `model.tasks[]`; C-numbers mapped by task name.

| Task | uuid | model.status | checklist reached | Impl (markerPending) | Test (status) | Gate file | Real status | Needs → QA-Review |
|------|------|--------------|-------------------|----------------------|---------------|-----------|-------------|-------------------|
| C1 | 458b6b1c | Planned | Planned only | af97137f **false** | 3519018d pass, fc28b6f1 pass | rc1-sprintpin-resolver-gate.ts (+rc1refine) | chain-complete-to-Test, marker flipped, BITE gates GREEN | **(d) TWO-KEY** |
| C2 | 4bc1b3d5 | Planned | Planned only | b31ae393 **false** | — (Impl.tests EMPTY, no Test unit) | none | impl (generateAll) landed, reconcile-all PARTIAL, no Test | **(c) GATE + create Test** (test-cases missing; reconcile-all residual) |
| C3 | 364785b1 | Planned | Planned only | ee424581 **false** | caf74333 pass | rc3-consistency-guard-metabite.ts | chain-complete-to-Test, marker flipped, BITE GREEN | **(d) TWO-KEY** |
| C4 | 79fd2164 | Planned | Planned only | — (R-C4 has 0 UCs, no impl) | — | none | nothing on disk | **(a) BUILD** |
| C5 | 97e8a6ad | Planned | Planned only | d86f0309 **false** | 30d4b44a pass | rc5-taskstatus-bite-gate.ts | chain-complete-to-Test, marker flipped, BITE GREEN | **(d) TWO-KEY** |
| C6 | 32061171 | Planned | Planned only | 1f38e07e **false** | — (Impl.tests EMPTY, no Test unit) | none | impl (generateOverview) landed + marker placed, no Test | **(c) GATE + create Test** |
| C7 | bb31965b | In Progress | implementing [x], creating-test-cases [~], testing [ ] | 73f045d8 **false** | 0870c78b pass | rc7-migrate-board + rc7b/c/d/e/f (6 BITE gates) | chain-complete-to-Test, marker flipped, extensive BITE GREEN | **(d) TWO-KEY** (finish testing) |

**S37 header count:** near-QA (chain-complete-to-Test, only two-key left) = **4** (C1, C3, C5, C7) · need test+gate = **2** (C2, C6) · need build = **1** (C4).

### S37 per-task detail

- **C1 — "Pin is COMPUTED from files (never hand-set) [R-C1]"** (req `91486de1`). UC `6c016f6a` sprintPin.resolveFromFiles → Impl `af97137f` SprintPinResolver.resolveSprintPin (3-slot, number-keyed), markerPending=false. Two Tests pass: `3519018d` (frozen-excluded + cancelled-terminal refinement) + `fc28b6f1` (golden-pin + drift-invariance + ambiguity BITE). Gate `rc1-sprintpin-resolver-gate.ts` + META-BITE retrofit (commit `c9d18a7de`). **BOARD-vs-UNITS: board = Planned; units = implemented + tested + gated.** Only tester two-key remains.
- **C2 — "Board is a GENERATED view + one-time reconcile-all [R-C2]"** (req `eec7ebb7`). UC `bf1cf902` sprintBoard.reconcileAll → Impl `b31ae393` SprintViewGenerator.generateAll, markerPending=false, **Impl.tests EMPTY, NO Test unit, no gate file.** Commit `5b2630552` "reconcile-all … (partial; honest residual)" + `cf850d26e`. Suspect confirmed: generated-view half-done, reconcile-all migration is the residual. Needs a Test + gate GREEN (and the reconcile-all completion).
- **C3 — "FAIL-LOUD guard asserts pin==board==files [R-C3]"** (req `1530c79c`). UC `029574bd` guard.failClosedOnVacuous → Impl `ee424581` ConsistencyGuard.refuseIfVacuous, markerPending=false. Test `caf74333` pass (vacuous-path battery BITE). Gate `rc3-consistency-guard-metabite.ts`. **BOARD-vs-UNITS: board = Planned; units = chain-complete-to-Test.** Two-key remains.
- **C4 — "Objects self-heal (validate on init/read) [R-C4]"** (req `c8615e9f`). **Req has ZERO useCases, no Method, no Impl, no Test.** Genuine BUILD from scratch. Board = Planned is accurate here.
- **C5 — "Dual-status reconcile — one truth (status vs statusChecklist) [R-C5]"** (req `03fd79ff`). UC `2a840e93` taskStatus.deriveAndAssert → Impl `d86f0309` TaskStatus.assertStatusConsistent, markerPending=false. Test `30d4b44a` pass (fail-loud offender-naming BITE). Gate `rc5-taskstatus-bite-gate.ts`. **BOARD-vs-UNITS: board = Planned; units = chain-complete-to-Test.** Two-key remains. (R-C5 audit is the surface that keeps the live 5/6-Active-sprints drift visible — see pin commits `c0626c835`/`3e789db9e`.)
- **C6 — "sprints.overview.md is a GENERATED view (preserved-narrative region) [R-C6]"** (req `9339cc3b`). UC `833d3525` overview.generatePreserved → Impl `1f38e07e` SprintOverviewGenerator.generateOverview, markerPending=false, **Impl.tests EMPTY, NO Test unit, no gate file.** Commit `cf850d26e` "first --write of the generated sprints.overview.md index — FAIL→ok". Suspect confirmed: R-C6 write landed and marker IS placed; two-key NOT reachable because there is no Test unit and no gate yet. Needs Test + gate GREEN.
- **C7 — "Legacy boards MIGRATED to generated (zero loss) [R-C7]"** (req `6ccbef4e`). UC `c8c3d81e` board.migrateProvenComplete → Impl `73f045d8` BoardMigrator.applyMigration (proven-only, idempotent), markerPending=false. Test `0870c78b` pass (5-gate BITE: proveComplete-refuse + applyMigration). Six gate files present (`rc7`, `rc7b`–`rc7f`). Checklist: creating-test-cases [~], testing [ ] — the only S37 task past "Planned only". Needs tester two-key / finish testing to reach QA-Review.
