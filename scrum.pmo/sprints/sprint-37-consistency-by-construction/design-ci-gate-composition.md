# CI gate-composition defect — architect ruling (2026-08-17)

Expert finished slice-1 (5667a8cf4) but `ci:gates` exits 1 on a PRE-EXISTING backlog. Ruling for the same package.json pass. Design only until the expert implements.

## Measured defect
`ci:gates:raw` (package.json:55) is a **~30-gate `&&` chain** beginning with `trace:audit:strict`, which exits 1 on a STANDING backlog (1711 orphans + one-class-per-file + impl-not-reachable; the expert measured none of its changed files are in the failures = not a regression, a standing condition). ⇒ **`&&` short-circuits on the first failure, so all ~29 gates AFTER `trace:audit:strict` NEVER EXECUTE.** Every gate we've carefully added (task-status, sprint-md, camelcase, consistency:strict, mutation-seam --strict, reverse-wire, …) is **decorative in CI** — passes when run alone, never runs in the chain. Root: `&&` is "stop-on-first-failure" (right for a dependent PIPELINE), applied to a SUITE of INDEPENDENT gates (wrong — a suite wants run-all/report-all/fail-if-any). A permanently-red FIRST gate silently disables the whole suite = existence≠connection (L5) at the CI level; same disease as the silently-deleted check:task-status, one level up.

## RULING — (a) run-all-then-fail AND (b) delta-count the red-always gate; (c) is separate
Both (a) and (b); (c) is its own item.

### (a) run-all-then-fail composition [MANDATORY — fixes the decorative-gates disease]
Replace the `&&` chain with a RUNNER (`scripts/run-gates.mjs`) that: reads the gate list as a **data array** (one source for "what gates exist"), EXECUTES every gate regardless of individual failures, captures each exit code + a one-line result (PASS/FAIL + the count where the gate emits one), prints a per-gate SUMMARY every run, and exits non-zero iff ANY gate failed. ⇒ every gate executes + reports EVERY run; one red gate cannot hide the other 29. `ci:gates` calls the runner instead of the `&&` string.

★ **ARRAY-GUARD (PO — REQUIRED; my array creates a NEW silent off-switch):** a data-array gate list means someone can silently DELETE a gate from the array and the suite happily reports "all pass" — exactly how `check:task-status` disappeared, relocated one level up into the runner. So the runner MUST self-verify: (i) assert the array is COMPLETE against package.json — every `check:*`/gate script in package.json MUST appear in the array, or the run FAILS naming the missing gate (the array can't silently under-cover the scripts); (ii) **stub-must-fail BITE: remove one gate from the array → the suite goes RED.** Without this, run-all-then-fail is a better chain with the SAME silent off-switch. (Existence≠connection again: the runner's completeness is itself a contract that must be enforced, not assumed.)

### (b) `trace:audit:strict` → DELTA report + COUNT + auto-strict-at-0 [because it is red-ALWAYS]
A gate that can NEVER pass enforces NOTHING — it only BLOCKS. Today 1711 orphans is red; adding a 1712th is STILL red → it catches ZERO regressions (can't distinguish 1711 from 1712). Convert it (this is the self-draining pattern from the sprint-name migration / R27.2 INV2 delta):
- Baseline the standing counts (orphans, one-class-per-file, impl-not-reachable).
- **FAIL on any INCREASE vs baseline (0-NEW delta gate)** — this CATCHES the regressions the red-always gate cannot, so it is strictly MORE enforcement than the status quo.
- **EMIT the counts every run** (no-silent-caps visibility) via the runner's line.
- **Auto-flip to strict-0** when a count reaches 0 (the counter IS the revisit trigger; self-draining, no silent defer).
- This does NOT weaken a passing gate — `trace:audit:strict` NEVER passed; a delta-report is a non-enforcing block converted into an enforcing counted report.

### (c) the 1711-orphan backlog = a SEPARATE tracked cleanup (candidate req)
Big, and it's the traceability/reverse-wire target area (likely overlaps the R40.39 type-index + reverse-wire debt — same graph-integrity family). Do NOT block the composition fix on it; (b)'s counted report makes it VISIBLE every run and drains it over time with the auto-flip. Flag to req/PO as its own item.

## ★ TYPECHECK GATE — `tsc --noEmit`, NOT a bespoke publish-lint (rules my own imaginary tripwire)
★ **My error, owned:** I ruled `publish` REQUIRED on the create-fns, reasoning "the compile error IS the tripwire — structural, not remembered." MEASURED now: there is NO `tsc`/typecheck in the chain (`build` = `node build.mjs` = esbuild, which STRIPS types without checking; vitest runs via tsx/esbuild — also no typecheck). ⇒ ~40 vitest callers omit `publish` and NOTHING catches it — **my tripwire was IMAGINARY** (a well-formed type contract with no execution path). Same L12 trap as the R40.18 predicate, on my own ruling: I asserted the tripwire without verifying its enforcement mechanism RUNS.
**RULING (agree with PO's lean — the ROOT fix):** add a **`tsc --noEmit` typecheck gate** to the array, NOT a hand-written publish-required lint.
- **Why tsc over a bespoke lint:** tsc enforces EVERY type contract at once (required-`publish` AND the ones we haven't thought of — which is the EXACT failure mode that just bit us). A per-contract lint only catches the contract we remembered → whack-a-mole; the next omission slips again. One general mechanism (the compiler) > N hand-written per-contract checks (L1/L2 single-source). It also makes my required-`publish` REAL rather than retracting it — the contract was right, the enforcement path was missing.
- **Ship as a DELTA report** (same family as trace:audit above): baseline = ALL current `tsc --noEmit` errors (the ~40 no-op-publish omissions + any other standing type-looseness), **FAIL on any INCREASE (0-new)**, EMIT the count each run, auto-strict-at-0. The ~40 no-op-publish test fixes then DRAIN the counter mechanically.
- **Impl note:** `tsc --noEmit` needs a tsconfig; none is used by the esbuild build — the expert adds a minimal typecheck tsconfig (or `tsc --noEmit --strict` over the src/test globs). It lands in the gate ARRAY so run-all executes it.
- ★ **Reject the "runtime-safe" comfort (PO, affirmed):** req called omitted-publish "runtime-SAFE (undefined → no-op emit)" — safe from CRASHING, yes, but a caller that omits publish emits NOTHING = **exactly the silent staleness this sprint exists to remove.** Runtime-safe ≠ behaviourally correct; the ~40 no-op-publish callers are behaviourally WRONG (they don't emit), and tsc forces them to pass publish → they emit → correct.

## ★ META-LESSON (PO named it): we VERIFY gate QUALITY and ASSUME gate EXECUTION
TWO defects in one hour of one shape: (1) the `&&` chain — gates well-formed but never executing behind a red leader; (2) required-`publish` — a well-formed type contract with no compiler to enforce it. A gate/tripwire is only real if its ENFORCEMENT MECHANISM actually RUNS — verify the execution PATH (the compiler runs, the gate is in the array, the array is complete, the chain runs), not just that the gate/contract is well-formed. **Everything here must land so it ACTUALLY EXECUTES** — an unreachable typecheck gate would be the same joke twice.

## Constraints satisfied (PO's)
- **Do not weaken any gate that CAN pass:** under run-all, every currently-passing gate stays hard-fail (fail-if-any); only `trace:audit:strict` (which never passed) changes, and to MORE enforcement (delta-catches-regressions).
- **Do not leave the chain permanently red:** after the fix `ci:gates` is GREEN when all passing gates pass AND `trace:audit` has 0-NEW; the standing 1711 no longer blocks. The chain CAN go green again.
- **Every gate executes every run, failure VISIBLE with a count:** guaranteed by (a) run-all + per-gate reporting, with (b)'s orphan counts emitted.

## Handoff
Expert implements (a) `run-gates.mjs` + (b) `trace:audit --report-delta` (baseline + fail-on-increase + emit-count + auto-strict-at-0) in the same package.json pass; re-run to confirm ci:gates GREEN (all passing gates pass, trace:audit 0-new). (c) → req mints the backlog-cleanup as its own item (graph-integrity family with R40.39). ★ A gate SUITE composes run-all/report-all/fail-if-any, NEVER `&&`; a red-always gate must be a delta/counted report or it silently disables everything behind it.
