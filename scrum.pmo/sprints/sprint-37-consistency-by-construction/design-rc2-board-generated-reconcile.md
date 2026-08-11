# R37.2 — Board GENERATED view + one-time reconcile-all (architect design, 2026-08-07)

**Basis:** doctrine `session/knowledge-base/consistency-by-construction.md` (ARON/TRON) + scope `scrum.pmo/consistency-guard-scope.md` (planner). Unit eec7ebb7. S37 build-order FIRST. TRON-authorized strategic increment (the guard sprint); R37.2 = reflect-reality bookkeeping made structural.

## Principle (DRY, from the doctrine)
**The scenario UNITS on disk are the ONE source of truth. The board (planning.md, task-*.md, requirements.md, sprints.overview.md) is a GENERATED VIEW.** A generated view cannot drift from its source — so the fix for 29 sprints of drift is not hand-editing 29 boards, it is **regenerating every board from its units in one pass** (reconcile-all). The drift exists because md copies were hand-edited away from their units; regeneration overwrites the hand-edit with the unit-derived truth.

## Measured drift (planner, disk 2026-08-07)
- Active S33/34/35/36 boards **byte-match** `generate-sprint-md --check` ✓.
- **29 older sprints DRIFT:** 24 `requirements.md`, a handful `planning.md`/`task-*.md` — hand-maintained copies disagree with their units.

## R37.2 scope (2 parts)
- **(a) GUARANTEE board = generated view** — the board is ALREADY generated (`generate-sprint-md`); R37.2 confirms there is NO hand-authoring path that is treated as truth (md carries the `GENERATED … DO NOT HAND-EDIT` header; truth flows units→md only).
- **(b) ONE-TIME reconcile-all** — regenerate EVERY sprint's views from its units in ONE run, clearing the 29-sprint historical drift. NOT hand-fixed (that would be CMM2 vigilance again).

## ★ HARD INVARIANTS (the safety envelope — these bound the reconcile-all)
- **INV-C1 (units untouched — direction is units→md ONLY):** reconcile-all READS scenario units and WRITES md views. It MUST NOT write/mutate any scenario unit. => sprint-unit statuses + Task-unit statuses + prod scenario data are BYTE-UNCHANGED (git-clean on scenario/index after the run). This satisfies PO constraint (d): does NOT disturb sprint-unit statuses (S33-36 close = separate TRON governance) nor prod data.
- **INV-C2 (idempotent / round-trip byte-stable):** running reconcile-all twice yields ZERO changes on the 2nd run (`git diff` empty). Requires the generator to be DETERMINISTIC (stable ordering, no timestamps/random) — the R32.7-puml byte-identical discipline applied to md.
- **INV-C3 (generated-only surface):** reconcile-all writes ONLY generated view files (planning.md, task-*.md, requirements.md, sprints.overview.md under scrum.pmo/sprints/). It does NOT touch code, prod scenario/index, MODEL_STORE, or any non-generated doc.
- **INV-C4 (no status invention):** the regenerated md reflects EXACTLY the unit statuses as they are — reconcile-all NEVER flips a task Done/Reopened/etc. (that is planner audit + the honesty gate, a SEPARATE act). It only makes the VIEW match the units. A drifted board where the UNIT itself is wrong is NOT R37.2's job (that is the S33-36 honesty audit under the correction).

## Measured mechanics (architect + Explore, disk 2026-08-07)
- **Generator (single):** `scripts/generate-sprint-md.ts` — `generatePlanningMd` (:85), `generateRequirementsMd` (:137, R30.18), `generateTaskMd` (:55). Single source = the **Sprint unit** (`model.tasks[]`→Task units, `model.requirements[]`→Requirement units). `normalize()` (:50, LF+single trailing NL) → deterministic.
- **`--check --all`** (`checkSprint` :250, in npm `check:sprint-md` → `ci:gates:raw`) byte-compares generated==committed, `exit 1` on drift. RAN IT: **8/37 byte-match, 29 DRIFT** (sprints 01-29-ish; 24 requirements.md + a few planning/task-md). S33-36 currently CLEAN (already reconciled under the correction).
- **Write path** `generateSprint` (:207) with **OWNED-OUTPUT guard** (:223-241) — overwrites ONLY files starting with `GENERATED_HEADER`; never clobbers `design-*.md`/`*.puml`/`PO-vision.md`. Never writes units (reads units → writes md).
- **CRUX (dual status):** a Task carries TWO independent fields — `model.status` (→planning checkbox, :119) AND `model.statusChecklist` free-text (→task-md `## Status`, :67). Nothing keeps them in sync → status can disagree WITHIN the source.
- **GAP:** `sprints.overview.md` is NOT generated (hand-maintained narrative: WIP=1, CURRENT-SPRINT block; no generator, no `--check`).

## R37.2 IMPL-SHAPE (expert-buildable)
### (b) ONE-TIME reconcile-all = run the EXISTING generator in WRITE mode over ALL sprints
The board is already generated; the reconcile-all is a **one-shot regenerate-all**, NOT new logic:
| # | Step | Detail |
|---|------|--------|
| 1 | **Ensure a WRITE `--all`** | `--check --all` already iterates all 37 sprints (`checkSprint`). Confirm/add the symmetric **write** `--all` = loop `generateSprint` over every sprint (trivial; mirror the check loop). Run: `node scripts/with-node20.mjs npx tsx scripts/generate-sprint-md.ts --all` (write, no `--check`). |
| 2 | **Regenerate all 29 drifted boards from units** | writes ONLY generated md (planning/requirements/task-*), OWNED-OUTPUT-guarded; scenario units UNTOUCHED (INV-C1). Clears the drift in ONE pass. |
| 3 | **Verify green** | `check:sprint-md` (=`--check --all`) then reports 37/37 byte-match. |
| 4 | **Commit atomically** | one commit = the 29 sprints' regenerated md. scrum.pmo docs only → **NO code/prod change, NO version bump, NO restart** (INV-C3). |

### (a) GUARANTEE board = generated view
Already structural via the `GENERATED … DO NOT HAND-EDIT` header + OWNED-OUTPUT guard + `check:sprint-md` in `ci:gates`. R37.2 confirms this holds; R37.3 (separate task) makes `check:sprint-md --all` FAIL the build on ANY drift (it already does `exit 1` — R37.3 just guarantees it stays wired in ci:gates and extends coverage).

### ★ TWO GOVERNANCE-SENSITIVE FLAGS (kept OUT of R37.2 by design)
1. **Dual status field (`status` vs `statusChecklist`) — do NOT collapse in R37.2.** Reconcile-all regenerates from BOTH fields AS-IS (status→checkbox, statusChecklist→task-md Status) — it MUST NOT pick a winner, because that could FLIP a task's displayed Done-ness (e.g. Task 95: status='In Progress' but statusChecklist all-checked) = a status invention (violates INV-C4) + collides with the S33-36 honesty audit. **Consolidating to ONE status field is a SEPARATE follow-on** (candidate R37.3/planner-audit), surfaced to PO/req — NOT R37.2.
2. **`sprints.overview.md` generator — DEFER to a follow-on.** It's the remaining hand-maintained seam, but it needs a NEW generator (source = Sprint units number/name/status/goal) + a preserved-narrative OWNED-region for the WIP/CURRENT-SPRINT block (mirror the header guard) + a new `--check` in ci:gates. That is a distinct piece; the one-time reconcile-all (planning/requirements/task-md via the existing generator) is the immediate high-value drift-clear and must NOT be blocked on the overview generator. RECOMMEND R37.2-part-2 (or fold into R37.3).

## GATE (drift-injection BITE — fail-loud PROVEN not asserted, per scope + [[correct-by-construction-needs-gate-verification]])
1. **BITE-1 (guard bites):** hand-edit a checkbox in a committed `planning.md` (board != units) → `check:sprint-md` (`--check --all`) MUST `exit 1` fail-loud on that sprint. (Proves the generated==committed guard actually detects drift.)
2. **RECONCILE clears it:** run the write `--all` reconcile-all → `check:sprint-md` then reports **37/37 byte-match** (0 drift).
3. **INV-C2 idempotent:** run reconcile-all a 2nd time → `git diff` EMPTY (byte-stable round-trip).
4. **INV-C1 units-untouched:** after reconcile-all, `git status --short scenario/index` = CLEAN (no unit/prod mutated); only scrum.pmo md changed.
5. **INV-C4 no-status-invention:** spot-check a sample of the 29 sprints — each task's regenerated checkbox == its unit `model.status`, and task-md `## Status` == its `model.statusChecklist`, verbatim (regen reflects the fields, never flips them).
6. **BITE-2 (unit-side):** edit a Task unit `status` → reconcile-all → the board checkbox reflects the NEW status (proves units→md flows), and re-running is idempotent.

## CHAIN (scenario-first #126; req mints at build-go)
- UC `sprintBoard.reconcileAll` → Class `SprintViewGenerator` (EXISTING, scripts/generate-sprint-md.ts) → Method `generateAll`/write-`--all` → Impl → **Test = the BITE** (plant drift → check fails; reconcile → 37/37; idempotent; units-clean). The reconcile-all itself is a one-time RUN (migration-class, like the `backfill-*.ts` precedent) — its acceptance = BITE green + post-run `check:sprint-md` 37/37 + `scenario/index` git-clean.
- **verify-owner-first:** the Test is DISTINCT-intent (board-drift bite), do NOT cross-wire onto an existing generator Test.

## BUILD-GO / posture
- **NO code beyond a possible tiny write-`--all` addition** (if the write path is per-sprint-only today); the reconcile is a RUN. **Docs-only → NO version bump, NO restart, NO prod/MODEL_STORE touch** (INV-C1/C3).
- **Does NOT close/flip S33-36 sprint-unit statuses** (separate TRON governance) nor invent task statuses (INV-C4) — R37.2 only makes the VIEW match the units.
- Sequence (planner scope): R37.2 reconcile-all FIRST → then R37.1 pin-resolver → R37.3 fail-loud CI guard (+ dual-status consolidation + sprints.overview generator, the 2 flagged follow-ons) → R37.4 self-heal.
- req mints the chain at build-go; expert runs reconcile-all + adds write-`--all` if needed; I backstop (BITE fail-loud + 37/37 + idempotent + units-clean).
