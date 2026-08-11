# R37.3 — Fail-Loud Consistency Guard (FAIL-CLOSED on vacuous input)

**Author:** robbin-architect · 2026-08-07 (S37). PO-dispatched after R37.1. Generalizes the vacuous-pass fix the R37.7 BITE exposed into a cross-cutting invariant for EVERY S37 guard. Design → req mints → expert builds → I backstop. Roots: [[correct-by-construction-needs-gate-verification]] + [[false-low-worse-than-absent]].

**DOCTRINE:** every consistency check is FAIL-LOUD (refuses with a NAMED reason, never a bare false) AND FAIL-CLOSED on vacuous input (no-data / unresolvable / empty / 0-items / wrong-type / null-output = REFUSE, never silent pass). This is what makes "by-construction" REAL rather than asserted — a guard that passes on no-input guarantees nothing.

## MEASURED ground truth (disk, HEAD v0.8.65)
- **`ci:gates:raw`** = `trace:audit:strict && rule-pair:strict && check:sprint-md && check:camelcase && check:task-status` (via `with-node20.mjs`).
- **The BITE-exposed bug is ALREADY fixed** in `proveComplete` (migrate-boards.ts:51-58): an unresolvable uuid → `{complete:false, reason:"FAIL-CLOSED: uuid … does not resolve"}`; wrong `ior:class` → false+reason; `buildSprintOutput` null → false+reason. R37.3 does NOT re-fix it — R37.3 **generalizes this exact pattern** to every guard, because the PO's insight is that the same vacuous shape "likely exists elsewhere."
- **Guards in the S37 family:** `proveComplete` (R37.7, fail-closed ✓), `assertStatusConsistent` (R37.5 task-status.ts), `check:sprint-md` drift (R37.2), `resolveSprintPin` (R37.1, INV-C1-6 ✓), `trace-audit` dup/orphan/dangling (R27.2), `rule-pair`.

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
2. **`consistency:strict` ci:gate** composing the S37 guards, any refusal fails the build: pin-consistency (R37.1 resolver output == committed pin) + dual-status (R37.5 `assertStatusConsistent --strict`) + board-drift (R37.2, missing-file=FAIL) + migration-refuse (R37.7 `proveComplete`). Fold into `ci:gates:raw`.
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

## ★ R37.3 ADDITION — 8-char prefix-collision: FORWARD guard + RETRO-audit sweep (PO 2026-08-07)
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
- **E. owner→wrong-type:** `UC.owner→non-Requirement = 239 → {Sprint:186, Task:53}` (only 169/538 UCs are Req-owned). ★ **PO RULING (recorded inline, 2026-08-07): 186 UC→Sprint is TOO SYSTEMATIC to be collision = a LEGACY CONVENTION → do NOT auto-repoint, do NOT bulk-migrate this pass.** Three parts: (1) **CANONICAL RULE going forward — a UseCase's owner MUST be a Requirement** (nav-to-Sprint is a VIEW concern, not ownership); (2) **FORWARD-GUARD** new/edited UCs against it (fail-closed family, folds with INV-C3-6) so the convention can't spread; (3) the 239 = **VISIBLE, COUNTED DEBT in this needs-review bucket** — a deliberate reviewed migration later beats mass-repointing 239 ownership links now (mass-mutating a historical convention is how you break a graph). The **§4/BUG1 Sprint20 case is DIFFERENT — that one IS corruption on a live chain, fixed specifically** (repoint UC 8dc64273 → BUG1 2d5f151e, in the §4 untangle). `Method.owner→non-Class = 5` + `Impl.owner→non-Method = 10` = CONFIRMED-CORRUPTION (fix in the repair).
- **F. 8-char prefix-collision pairs: 18** (latent — forward guard prevents new; audit lists existing so tooling uses full uuids).
- Output = counts + samples + bucket per category; `--strict` fails CI on CONFIRMED-CORRUPTION > 0 (after the bounded fixes land), REPORT-ONLY until then (delta discipline, like R37.2 INV2). The 980 + 8 + 10 + 5 confirmed = the true blast radius to fix; the 89 + 239 = human-ruling first (don't damage legit sharing/convention).

## ★ REPAIR spec — confirmed-corruption set (≈1003), for the expert
Mechanical, full-uuid only, fail-loud, idempotent, backup + pre/post counts, `--strict` AFTER (delta). `scripts/repair-collision-artifacts.ts --dry-run|--apply`. **Fixes ONLY the CONFIRMED set; NEVER touches the 89 same-name (R30.11 review), the 239 UC→Sprint/Task (E convention debt), or the 18 prefix pairs.** Runs on a clean tree so git is the backup; one atomic revertible commit.

Per-category repair (each VERIFY-OWNER-FIRST, MOVE-not-drop — the R27.2 union lesson):
1. **A — 980 foreign `Method.implementations[]` entries.** For each foreign impl `X` on wrong method `M`: resolve `X.ownerIor → M'` (X's TRUE method). If `M'` doesn't already list `X` → ADD it to `M'.implementations[]` FIRST, then REMOVE `X` from `M.implementations[]`. Net: every Impl ends on exactly ONE (its true-owner) method — 0 orphaned. Key ONLY on name-MISMATCH + ownerIor (a genuinely foreign impl); a same-name entry is left for review (never mistake an R30.11 shared-impl for corruption).
2. **D — 8 `UC.class→non-Class`.** Set `UC.class = resolve(UC.method).ownerIor` (the Class that owns the UC's Method — the class IS derivable from the method's owner). Fail-closed if `UC.method` is itself broken → SKIP + report needs-manual.
3. **Method.owner 5 (`Method.ownerIor→non-Class`).** Repoint to the Class whose `methods[]` lists this Method (or, if none, the name-matched Class `Foo` for `Foo.bar`). Fail-closed if ambiguous → skip+report.
4. **Impl.owner 10 (`Impl.ownerIor→non-Method`).** Repoint to the Method whose `implementations[]` lists this Impl (or name-matched). Fail-closed if ambiguous → skip+report.

**REPAIR INVARIANTS (gate before --apply, assert after):**
- **No Impl orphaned:** every Impl still owned by exactly one Method that lists it (before==after distinct-impl-on-true-method count).
- **No unit deleted:** repair edits REFS only; total unit count conserved (5271==5271).
- **Confirmed-corruption → 0:** the 4 categories (980+8+5+10) go to 0; **needs-review (89) + convention debt (239) + prefix pairs (18) UNCHANGED** (assert they're untouched — the repair must not have moved them).
- **Fail-closed:** any entry whose correct target can't be determined (unresolvable/ambiguous) is SKIPPED + reported `needs-manual`, NEVER guessed.
- **Idempotent:** re-run --apply = 0 changes.
- **BITE:** inject a known foreign-impl → repair relocates it to its true method; a planted R30.11 same-name shared-impl is NOT touched; re-run idempotent; post-run audit confirmed-corruption==0 while 89/239/18 unchanged. Then the audit's `--strict` on confirmed-corruption turns on (delta discipline).

## ★ SHARED CLASSIFIER CONTRACT (audit + repair import the SAME module — resolves the 715-vs-980 divergence)
The audit and the expert's repair diverged on nearly every category (A 715/980, MO 19/5, IO 13/10, SN 5/89, EC 245/239, PP 67/18). **Do NOT hand-reconcile the numbers** (the R27.2 62-vs-45 / 87-vs-11.2 lesson) — export ONE module `collision-classify.ts` with per-category predicates that BOTH the audit and `repair-collision-artifacts.ts` import, over the SAME unit-set. Then counts CANNOT drift; if they do, it's real data change, not definition drift. Canonical definitions (FAIL-CLOSED toward SAFETY — when unsure, DON'T auto-mutate):
- **`name-token(unit)` = `unit.model.name.replace(/^impl:/,'').trim().split(/\s+/)[0]`** (the method-qualified token, e.g. `RbDetailView.chainExcludesSelf`). ONE definition — the SN 5-vs-89 gap is exactly this token rule; lock it.
- **foreign impl in `Method M`.implementations[]** = the impl is not owned by `M`. Sub-classify (mutually exclusive):
  - **MOVE-able** (~707): name-token(impl) ≠ name-token(M) AND `impl.ownerIor` resolves to a **Method** `M'`. → auto-move to `M'`.
  - **SAME-NAME / leave** (~89): name-token(impl) == name-token(M) → R30.11-shared-or-dup → LEAVE (fail-closed: never move a same-named impl — that's how you damage legit sharing).
  - **UNRESOLVED-owner / manual** (~259): `impl.ownerIor` doesn't resolve → can't determine target → REPORT needs-manual, do NOT touch.
- **owner mismatch** — split into TWO buckets (the MO/IO/EC divergence was merging them):
  - **WRONG-TYPE** (repoint): `ownerIor` RESOLVES to a unit of the wrong type (Method→non-Class, Impl→non-Method, UC→non-Req). Repairable by repoint. (the smaller resolving-wrong counts.)
  - **MISSING/unresolvable** (orphan): `ownerIor` empty or resolves to nothing → SEPARATE `orphan` bucket → assign-owner is a DIFFERENT fix, report, do NOT auto-repoint. (the larger remainder — my fail-closed 20/154/369 lumped these in; they are NOT repair-1003.)
- **UC.class mismatch** (8): `UC.class` resolves to non-Class → repoint via `resolve(UC.method).ownerIor`.
- **prefix collision**: report **18 GROUPS** (and **67 member-units**) — both numbers, labelled; the guard's count is groups, the blast is members.
- **★ ORPHAN-OWNER (NEW distinct debt item, PO 2026-08-07) — its own predicate, own count, own line, NOT a repair-1003 remainder.** `isOrphanOwner(unit)` = `ownerIor` empty OR dangling (resolves to nothing). MEASURED distinct-UNIT count = **289** (UseCase 130 + Method 15 + Implementation 144). This is a DIFFERENT fix (assign-the-correct-owner, often via the reverse link `Class.methods[]`/`Method.implementations[]` or name-match) and a LARGER set than the auto-repair — it MUST be counted separately, or a green "repair-1003 confirmed→0" report hides 289 orphaned units in the denominator (the marker-stack disease applied to ourselves). Gets its own eventual repair spec.
- **★ COUNTING BASIS must be declared + consistent (or it re-diverges):** foreign-impl MOVE-able is counted as **list-ENTRIES** (an impl listed on N methods = N); ORPHAN-OWNER and PP-members are counted as **distinct UNITS**. The shared module labels each count `entries` vs `units` (the 259-entries vs 144-units gap for the same impls is exactly this basis question — like PP groups-vs-members). Lock the basis per category.
- **The TRUE auto-repair set** = MOVE-able foreign-impl (≈707 entries) + UC.class (8) + owner-WRONG-TYPE-corruption (**15** = Method 5 + Impl 10) — **NOT the imprecise "1003"** (which folded in same-name 89, unresolved-manual, and missing-owner). ★ Note: `UC.owner→non-Req = 239` is **100% Sprint(186)+Task(53), 0 other** → entirely the ruled legacy-convention DEBT, NOT corruption to repoint. The shared module produces the exact numbers; both import it; `--strict` after the BITE passes against IT.

## CHAIN + sequence + deploy
- Chain: UC `guard.failClosedOnVacuous` → Class `ConsistencyGuard` → Method `assertNonVacuous` (+ per-guard adoption of `refuseIfVacuous`) → Impl → vacuous-BITE Test. req mints at build-go.
- Sequence: R37.3 after R37.1 (this). THEN R37.6.
- **Deploy:** scripts/CI-only (guards + ci:gates) → NO restart (unless a guard shares a server module).
