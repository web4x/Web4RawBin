# CI gate-composition defect — architect ruling (2026-08-17)

Expert finished slice-1 (5667a8cf4) but `ci:gates` exits 1 on a PRE-EXISTING backlog. Ruling for the same package.json pass. Design only until the expert implements.

## Measured defect
`ci:gates:raw` (package.json:55) is a **~30-gate `&&` chain** beginning with `trace:audit:strict`, which exits 1 on a STANDING backlog (1711 orphans + one-class-per-file + impl-not-reachable; the expert measured none of its changed files are in the failures = not a regression, a standing condition). ⇒ **`&&` short-circuits on the first failure, so all ~29 gates AFTER `trace:audit:strict` NEVER EXECUTE.** Every gate we've carefully added (task-status, sprint-md, camelcase, consistency:strict, mutation-seam --strict, reverse-wire, …) is **decorative in CI** — passes when run alone, never runs in the chain. Root: `&&` is "stop-on-first-failure" (right for a dependent PIPELINE), applied to a SUITE of INDEPENDENT gates (wrong — a suite wants run-all/report-all/fail-if-any). A permanently-red FIRST gate silently disables the whole suite = existence≠connection (L5) at the CI level; same disease as the silently-deleted check:task-status, one level up.

## RULING — (a) run-all-then-fail AND (b) delta-count the red-always gate; (c) is separate
Both (a) and (b); (c) is its own item.

### (a) run-all-then-fail composition [MANDATORY — fixes the decorative-gates disease]
Replace the `&&` chain with a RUNNER (`scripts/run-gates.mjs`) that: reads the gate list as a **data array** (one source for "what gates exist"), EXECUTES every gate regardless of individual failures, captures each exit code + a one-line result (PASS/FAIL + the count where the gate emits one), prints a per-gate SUMMARY every run, and exits non-zero iff ANY gate failed. ⇒ every gate executes + reports EVERY run; one red gate cannot hide the other 29. `ci:gates` calls the runner instead of the `&&` string. (The gate array also kills the "a gate silently drops out of the string" failure mode — adding/removing a gate is an array edit, greppable.)

### (b) `trace:audit:strict` → DELTA report + COUNT + auto-strict-at-0 [because it is red-ALWAYS]
A gate that can NEVER pass enforces NOTHING — it only BLOCKS. Today 1711 orphans is red; adding a 1712th is STILL red → it catches ZERO regressions (can't distinguish 1711 from 1712). Convert it (this is the self-draining pattern from the sprint-name migration / R27.2 INV2 delta):
- Baseline the standing counts (orphans, one-class-per-file, impl-not-reachable).
- **FAIL on any INCREASE vs baseline (0-NEW delta gate)** — this CATCHES the regressions the red-always gate cannot, so it is strictly MORE enforcement than the status quo.
- **EMIT the counts every run** (no-silent-caps visibility) via the runner's line.
- **Auto-flip to strict-0** when a count reaches 0 (the counter IS the revisit trigger; self-draining, no silent defer).
- This does NOT weaken a passing gate — `trace:audit:strict` NEVER passed; a delta-report is a non-enforcing block converted into an enforcing counted report.

### (c) the 1711-orphan backlog = a SEPARATE tracked cleanup (candidate req)
Big, and it's the traceability/reverse-wire target area (likely overlaps the R40.39 type-index + reverse-wire debt — same graph-integrity family). Do NOT block the composition fix on it; (b)'s counted report makes it VISIBLE every run and drains it over time with the auto-flip. Flag to req/PO as its own item.

## Constraints satisfied (PO's)
- **Do not weaken any gate that CAN pass:** under run-all, every currently-passing gate stays hard-fail (fail-if-any); only `trace:audit:strict` (which never passed) changes, and to MORE enforcement (delta-catches-regressions).
- **Do not leave the chain permanently red:** after the fix `ci:gates` is GREEN when all passing gates pass AND `trace:audit` has 0-NEW; the standing 1711 no longer blocks. The chain CAN go green again.
- **Every gate executes every run, failure VISIBLE with a count:** guaranteed by (a) run-all + per-gate reporting, with (b)'s orphan counts emitted.

## Handoff
Expert implements (a) `run-gates.mjs` + (b) `trace:audit --report-delta` (baseline + fail-on-increase + emit-count + auto-strict-at-0) in the same package.json pass; re-run to confirm ci:gates GREEN (all passing gates pass, trace:audit 0-new). (c) → req mints the backlog-cleanup as its own item (graph-integrity family with R40.39). ★ A gate SUITE composes run-all/report-all/fail-if-any, NEVER `&&`; a red-always gate must be a delta/counted report or it silently disables everything behind it.
