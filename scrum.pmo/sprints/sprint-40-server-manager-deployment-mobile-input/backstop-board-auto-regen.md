# Backstop verdict — campaign board auto-regen (architect, 2026-08-12)

PO-directed independent backstop on the board auto-regen design (wrap machine sections in a GENERATED region, `--write` via R37.8 guardedWriteRegion, precommit-wired regen, region-drift check). Measured the landed pieces + the T37.6 trigger it mirrors. State: the `--json` measurement source exists in `campaign-scoreboard.mjs`; the region writer (`campaign-scoreboard-region.ts`) and the hook wiring are **NOT landed yet** — so #1/#3/#5/#6 are verified against the design + the T37.6 precedent it reuses, and are requirements for when they land.

## ★★ #4 TRIGGER COVERAGE — GAP FOUND (the highest-value finding)
**Trigger (measured, `.githooks/pre-commit` + `precommit-regen-overview.ts`):** regen fires only when `git diff --cached --name-only` matches `^scenario/index/.*\.scenario\.json$` (staged scenario units) — the board-regen will mirror this.

**What the board reads (measured, `campaign-scoreboard.mjs` walk @69-74 + chain @100-135):** EVERY value derives from scenario-unit FIELDS — `markerPending`, `tests[]`+Test-unit `status==='pass'`, `statusChecklist`/`status`/`supersededBy`. So unit-borne inputs ARE covered: a status change, a Test unit, a markerPending flip *persisted on the Impl unit*, a supersede — all are `.scenario.json` edits → trigger fires. Good.

**BUT two board inputs are NOT scenario-unit files → the trigger misses them:**
- **GAP A — the script's own `BUILD_COUPLED` override map (`campaign-scoreboard.mjs:64`).** A hardcoded task-uuid set that moves tasks between `build-coupled` and `gate`/`marker` classification. Editing this map (or any classification logic in the script) changes board values with **zero** scenario-unit staged → trigger does not fire → **stale board.** The measurement LOGIC lives in the script, not in units.
- **GAP B — SOURCE `.ts` host-decl existence.** The script's own comment (60-65) admits it "cannot grep src for the host decl, so these are measured overrides": a build-coupled task's marker is real-vs-fictional based on whether its host decl EXISTS in a `.ts`. A source-only commit that builds the host decl changes the TRUE board value but stages no unit → trigger misses (this is precisely the "marker flip" class the PO suspected, and worse — the script can't even measure it).

**Reframe of the PO's named classes:** scenario-unit ✓, Test unit ✓, status change ✓, markerPending flip ✓ *once persisted on the unit* — all covered. The uncovered classes are (A) edits to the board's own measurement script/override-map and (B) src-`.ts` builds that flip a marker's reality. **A gate result is only ever a board input via `Test-unit.status`; if a gate flips pass/fail WITHOUT writing back to the Test unit, the board is blind to it regardless of trigger** — keep the unit the single source, else a perfect trigger still shows a stale value.

**FIX (named, not designed-through):**
1. Broaden the trigger to also fire on staged `scripts/campaign-scoreboard*.{mjs,ts}` → covers GAP A (a change to the measurement logic re-regens the board).
2. For GAP B, prefer eliminating the manual `BUILD_COUPLED` override by having the script AST-measure host-decl existence from src (classification becomes deterministic from unit+src), AND trigger on the marker's src globs; OR, if the override stays, **explicitly name the residual src-build lag as a known bound in the board itself** (never silent).
3. Assert the unit is the single source for gate results (Test-unit.status is written on every gate flip), so no board value lives outside a `.scenario.json` field.
A partially-covering trigger reads as "covered" while lagging — GAP A is concrete and cheap to close (one glob); GAP B must be closed or named.

## Other failure modes
- **#2 guardedWriteRegion refuses markerless — PASS by construction.** `owned-output-guard.ts:92`: `if (!existing.includes(regionMarker)) return false` → a markerless/hand-authored board is never clobbered; a first run cannot destroy the planner's curation.
- **#1 curated byte-preserve — PASS outside markers, PARTIAL for "accidentally inside".** The guard writes only between BEGIN/END and preserves outside byte-for-byte (C7); but it treats EVERYTHING between markers as generated — a curated section accidentally placed inside the region WOULD be overwritten and the guard cannot detect it. REQUIRE: an assertion that the region contains ONLY the 4 machine sections (headline/table/remaining-by-blocker/per-task), and that the 4 curated sections resolve outside — a positive check, not just placement discipline.
- **#3 precommit fail-closed — PASS pattern exists, board-wiring PENDING.** The overview regen is `|| { exit 1 }` fail-closed. REQUIRE the board-regen wiring use the SAME `|| exit 1` (a regen that fails open manufactures false confidence — worse than no hook).
- **#5 region-drift check goes RED + stub-must-fail — PENDING (writer not landed).** REQUIRE the `--check` compare regen-region vs committed-region and go RED on mismatch, with a stub-must-fail proving the CHECK itself fails when fed a hand-edited board (test the check, not just the writer).
- **#6 unresolved-pin honest render — PENDING.** REQUIRE the writer render an UNRESOLVED pin as count+cause, never a guessed current (the honest-render discipline; a guessed current is the silent-failure class again).

## Bottom line
Mechanism is sound (guardedWriteRegion refusal + region byte-preserve are by-construction). The load-bearing finding is **#4: the trigger under-covers — GAP A (the script's own override map, concrete) and GAP B (src-`.ts` marker reality, the script's own blind spot).** Close GAP A with a one-glob trigger widen; close or explicitly name GAP B. Wire the board regen fail-closed, add the region-content positive check (#1), and land the drift-check + unresolved-render (#5/#6) with stub-must-fail on the checks themselves.
