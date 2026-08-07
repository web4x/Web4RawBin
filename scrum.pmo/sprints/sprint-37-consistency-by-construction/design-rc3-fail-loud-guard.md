# R-C3 — Fail-Loud Consistency Guard (FAIL-CLOSED on vacuous input)

**Author:** robbin-architect · 2026-08-07 (S37). PO-dispatched after R-C1. Generalizes the vacuous-pass fix the R-C7 BITE exposed into a cross-cutting invariant for EVERY S37 guard. Design → req mints → expert builds → I backstop. Roots: [[correct-by-construction-needs-gate-verification]] + [[false-low-worse-than-absent]].

**DOCTRINE:** every consistency check is FAIL-LOUD (refuses with a NAMED reason, never a bare false) AND FAIL-CLOSED on vacuous input (no-data / unresolvable / empty / 0-items / wrong-type / null-output = REFUSE, never silent pass). This is what makes "by-construction" REAL rather than asserted — a guard that passes on no-input guarantees nothing.

## MEASURED ground truth (disk, HEAD v0.8.65)
- **`ci:gates:raw`** = `trace:audit:strict && rule-pair:strict && check:sprint-md && check:camelcase && check:task-status` (via `with-node20.mjs`).
- **The BITE-exposed bug is ALREADY fixed** in `proveComplete` (migrate-boards.ts:51-58): an unresolvable uuid → `{complete:false, reason:"FAIL-CLOSED: uuid … does not resolve"}`; wrong `ior:class` → false+reason; `buildSprintOutput` null → false+reason. R-C3 does NOT re-fix it — R-C3 **generalizes this exact pattern** to every guard, because the PO's insight is that the same vacuous shape "likely exists elsewhere."
- **Guards in the S37 family:** `proveComplete` (R-C7, fail-closed ✓), `assertStatusConsistent` (R-C5 task-status.ts), `check:sprint-md` drift (R-C2), `resolveSprintPin` (R-C1, INV-C1-6 ✓), `trace-audit` dup/orphan/dangling (R27.2), `rule-pair`.

## THE INVARIANT — FAIL-CLOSED ON VACUOUS (cross-cutting, applies to EVERY guard)
Vacuous input = any of: input ref **unresolvable** (typo/deleted uuid) · file **missing or empty** · checklist **absent/malformed** · **0 items** where ≥1 is expected · **wrong `ior:class`** · **null/undefined output** · a positive assertion over an **empty collection**.

**On any vacuous input, a guard MUST REFUSE with a named reason — never silent-pass.** The killer shape is **vacuous truth**: `every([])===true`, `all-of-nothing`, "no offenders found (because nothing was scanned)". For a GATE, a positive claim over an empty/absent set defaults to **FAIL**, not pass ([[false-low-worse-than-absent]] — a false-low reads as clean and records nothing).

Concrete per-guard applications (audit each for the shape):
- `proveComplete` — unresolvable/wrong-type/null ✓ (already). Also: `gaps.length===0` on a sprint with **0 generated items** must NOT be `complete:true` (empty-generator = suspicious, not proven-complete).
- `assertStatusConsistent` — an **absent** checklist currently derives `Planned` (malformed-safe); for the DETECTOR that's a silent-clean read → must be recorded as a distinguishable note (a status=`Done` with NO checklist at all is a candidate FALSE-DONE, not silently `Planned`).
- `check:sprint-md` — a **missing board file** must be a named FAIL (`board absent for S<n>`), NOT skipped-as-match. `0 sprints checked` = FAIL (nothing was verified).
- `resolveSprintPin` — INV-C1-6 ✓ (every([])≠Done, unresolvable-task=refuse, empty-index=reason).
- `trace-audit` — **0 units scanned** ≠ pass; a walk that visits nothing must FAIL, not report "0 orphans (clean)".

## DESIGN
1. **Shared helper `refuseIfVacuous(value, {name, expect}): {ok:false, reason} | {ok:true}`** — called at the TOP of every guard. Encodes the checklist above (unresolvable→null, empty-collection, wrong-type, missing-file) → returns a NAMED refusal or ok. One helper, one place, reused (DRY; no per-guard ad-hoc null-checks that each get it subtly wrong).
2. **`consistency:strict` ci:gate** composing the S37 guards, any refusal fails the build: pin-consistency (R-C1 resolver output == committed pin) + dual-status (R-C5 `assertStatusConsistent --strict`) + board-drift (R-C2, missing-file=FAIL) + migration-refuse (R-C7 `proveComplete`). Fold into `ci:gates:raw`.
3. **Vacuous-BITE suite** — the gate that PROVES the invariant: for EACH guard, feed an unresolvable / empty / malformed / wrong-type input and assert it **REFUSES with a reason** (not pass). Plus a **meta-BITE**: a deliberately-vacuous-passing stub guard makes the suite go RED (proves the suite would catch a regression).

## INVARIANTS
- **INV-C3-1 fail-closed-on-vacuous:** every guard refuses+names on vacuous input.
- **INV-C3-2 no-vacuous-truth:** no positive assertion passes over an empty/absent set (`every([])`→FAIL for a gate).
- **INV-C3-3 named-reason:** every refusal carries a human reason string (not a bare `false`/`exit 1`) — so CI output says WHY.
- **INV-C3-4 composed-strict:** all S37 guards run in one ci:gate; any refusal fails the build.
- **INV-C3-5 BITE-per-vacuous-path:** each guard has a test feeding it vacuous input → must refuse (coverage, not one token check).

## GATE — the vacuous-BITE suite (distinct #126 Test, no cross-wire)
- Per guard × per vacuous path: unresolvable-uuid / empty-collection / missing-file / malformed-checklist / wrong-ior / null-output → REFUSE with reason.
- Meta-BITE: a stub guard that silent-passes vacuous input → suite RED (the suite can catch the regression class).
- Idempotent; `consistency:strict` green on the real clean tree, RED on any injected vacuous pass.

## CHAIN + sequence + deploy
- Chain: UC `guard.failClosedOnVacuous` → Class `ConsistencyGuard` → Method `assertNonVacuous` (+ per-guard adoption of `refuseIfVacuous`) → Impl → vacuous-BITE Test. req mints at build-go.
- Sequence: R-C3 after R-C1 (this). THEN R-C6.
- **Deploy:** scripts/CI-only (guards + ci:gates) → NO restart (unless a guard shares a server module).
