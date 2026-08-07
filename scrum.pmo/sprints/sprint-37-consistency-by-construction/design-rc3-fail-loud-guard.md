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

## ★ R-C3 ADDITION — 8-char prefix-collision: FORWARD guard + RETRO-audit sweep (PO 2026-08-07)
The prefix-collision class bit twice (the earlier `f2f84ce3` episode + §4 `3542dcb3`). A forward guard alone is HALF a fix — it stops new corruption while old corruption keeps silently crediting. Both halves land here.

### Forward guard (INV-C3-6 — fail-closed full-uuid resolution)
- Any `resolveUnit(id)` / chain-op lookup takes a FULL 36-char uuid. A prefix matching **>1 unit → THROW named** ("ambiguous prefix P matches N units — full uuid required"); matching 0 → throw; exactly 1 → allowed but the WRITE must store the full uuid. Never silently pick ([[false-low-worse-than-absent]], same family as INV-C1-8 no-name-parse).
- **Stored chain refs are full uuids:** `ownerIor`/`method`/`class`/`implementations[]`/`tests[]`/`useCases[]` — a trace-audit assertion FAILS on any ref shorter than a full uuid.
- **grep-lint/collision BITE:** any two units sharing an 8-char prefix are reported (latent-collision pairs); a chain op that resolved a colliding prefix without a full uuid fails.

### Retro-audit sweep (INV-C3-7 — runnable, fail-loud, CLASSIFYING) — MEASURED blast radius
A runnable script (fold into `trace-audit` or `scripts/collision-artifact-audit.ts`), fail-loud with per-category counts. ★ **It must CLASSIFY, not just count** — a naive type-mismatch over-reports because R30.11 shared-impl + historical owner-conventions are LEGITIMATE. Three buckets per finding: **CONFIRMED-CORRUPTION / LEGIT-PATTERN / NEEDS-REVIEW** (fail-closed: uncertain → review, never auto-labelled corruption; never auto-fixed — the sweep MEASURES so req/expert fix bounded batches with full uuids). **I ran the sweep now — real blast radius (graph = 5271 units):**
- **A. foreign entries in `Method.implementations[]`: 1069 raw → 980 name-MISMATCH (CONFIRMED-CORRUPTION: an impl whose name/owner is a genuinely different method, e.g. `renderObject` impl on the `chainExcludesSelf` method) + 89 same-name (NEEDS-REVIEW: R30.11-shared vs stale dup).** Across 185 methods. This is the big one — the §4 aae6 case is 1 of ~185.
- **B. foreign entries in `tests[]`** — same shape (Test.ownerIor / name mismatch); measure in the run.
- **C. self-referencing `ownerIor`: 0** (clean — CONFIRMS the §4 "self-ref" was a prefix artifact, not real).
- **D. UC→wrong-type:** `UC.method→non-Method = 0` (clean); `UC.class→non-Class = 8` (CONFIRMED-CORRUPTION).
- **E. owner→wrong-type:** `UC.owner→non-Requirement = 239 → {Sprint:186, Task:53}` (only 169/538 UCs are Req-owned). NEEDS-REVIEW/RULING: 186 UC→Sprint is too systematic to be all collision — likely a historical nav-owner convention vs the §4 BUG1/Sprint20 corruption; the audit surfaces it for a PO ruling, does NOT auto-repoint. `Method.owner→non-Class = 5`, `Impl.owner→non-Method = 10` (likely CONFIRMED-CORRUPTION, small).
- **F. 8-char prefix-collision pairs: 18** (latent — forward guard prevents new; audit lists existing so tooling uses full uuids).
- Output = counts + samples + bucket per category; `--strict` fails CI on CONFIRMED-CORRUPTION > 0 (after the bounded fixes land), REPORT-ONLY until then (delta discipline, like R-C2 INV2). The 980 + 8 + 10 + 5 confirmed = the true blast radius to fix; the 89 + 239 = human-ruling first (don't damage legit sharing/convention).

## CHAIN + sequence + deploy
- Chain: UC `guard.failClosedOnVacuous` → Class `ConsistencyGuard` → Method `assertNonVacuous` (+ per-guard adoption of `refuseIfVacuous`) → Impl → vacuous-BITE Test. req mints at build-go.
- Sequence: R-C3 after R-C1 (this). THEN R-C6.
- **Deploy:** scripts/CI-only (guards + ci:gates) → NO restart (unless a guard shares a server module).
