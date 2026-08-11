# R37.1 — Sprint Pin Resolver (current / last-completed / next-backlog COMPUTED from files)

**Author:** robbin-architect · 2026-08-07 (S37 consistency-by-construction). PO-dispatched after R37.2/R37.5. Builds on R37.5 `deriveStatusEnum` (landed). Design → req mints at build-go → expert builds → I backstop. Companion to [[consistency-by-construction]] doctrine.

**DOCTRINE:** the sprint pin is a GENERATED view of file state — it CANNOT be hand-set and CANNOT drift. Both the *which-sprint* pointer and the three slots are COMPUTED from each sprint's tasks. Replaces (a) the brittle name matcher and (b) the hand-set `Sprint.status` field.

## MEASURED ground truth (disk, HEAD v0.8.65)
- **Sprint unit shape:** `{ uuid, name, number:int, goal, status, requirements[], tasks:[uuid] }`. The `status` field is **HAND-SET** (e.g. Sprint 22 = "Planned") → the exact dual-status drift R37.5 cures for Tasks, one level up.
- **R37.5 `deriveStatusEnum(checklist)` is LANDED** (`src/ts/scenario/task-status.ts`, Method `f0f9eaa4`, Impl `8a032c42`): per-Task status = highest-order checked top-level box (`Planned < In Progress < QA Review < Done`), malformed-safe. R37.1 rolls this up per sprint — single-source, a sprint can't disagree with its own tasks.
- **The brittle matcher** = `CurrentSprint.ts:202-207`: `this.sprintName.match(/\d+/)` then fallback `norm(s.name).includes(key)`. Two failure modes, both PROVEN:
  - `"Sprint 31.1".match(/\d+/)` → **`31`** → collides Sprint 31 (not 33) = **the 33/31.1 drift**.
  - `.includes(key)` substring → any sprint whose name contains the key fuzzy-hits.
  - The pin is also **HAND-SET** (`setChain(sprintName)` / `focus`) — a passed-in name, not a computed fact.
- **Consumers** (measured): `CurrentSprint.ts` (client), `scripts/generate-sprint-md.ts`, `scripts/planner-drive.ts`, `scripts/trace-audit.ts`, `src/ts/server/server.ts`. → resolver must be a SHARED pure module (like `task-status.ts`).

## DESIGN — pure `resolveSprintPin(idx): { current, lastCompleted, nextBacklog }`
Each slot = `{ uuid, number, name } | null`. **Number-keyed throughout — never name-substring, never `/\d+/`.**

### 1. Sprint status by rollup (never the hand-set `Sprint.status`)
`deriveSprintStatus(sprint)` over `sprint.tasks[]`. Per-task status stays HONESTLY derived from the checklist via R37.5 `deriveStatusEnum` — the enum stays `{Planned|In Progress|QA Review|Done}`, UNCHANGED. Supersession is a **SEPARATE `supersededBy` field** (PO ruling B, 2026-08-07; the field 44 units already carry, e.g. `R30.32 supersededBy R30.34`), NOT a status value.

**TERMINAL-RESOLVED(task) = (`deriveStatusEnum(checklist) == Done`) OR (`task.supersededBy` present)** = "no open work". (A superseded task's OWN work was honestly never done → its derived status stays `In Progress`/`Planned`; `supersededBy` explains WHY it never will be, naming the superseding req/sprint.)
- **Active (In Progress)** — ≥1 task derives `In Progress` AND is NOT superseded.
- **CLOSED** — tasks non-empty AND *every* task is TERMINAL-RESOLVED (Done-or-supersededBy). Eligible for `last-completed`. Sub-label `Done` when all are `Done`; `Closed` when it mixes `Done` + `supersededBy`.
- **QA-pending** — no active In-Progress, ≥1 `QA Review`, not all terminal-resolved.
- **Planned** — all tasks `Planned` (or no tasks).

**★ Why the field, not a status enum-value (planner-measured, my earlier flag steered here):** writing `status='Superseded'` would make each such task a DRIFT offender (54→66) because `deriveStatusEnum(checklist)` would still return `In Progress`/`Planned` — the consistency sprint contradicting itself. The `supersededBy` field keeps status honestly checklist-derived: **R37.5 has nothing to clobber, `deriveStatusEnum` needs NO extension, the status vocabulary the sprint exists to unify stays unified.** NO cross-R37.5 change.

**★ Terminal-resolved does NOT collapse into `Done`** — a supersededBy task satisfies "no open work" for the *rollup* but is preserved DISTINCTLY in *display* (S18 = "7 Done · 12 Superseded", never "19 Done"). See INV-C1-7.

### 2. Three slots (the PO rules, made mechanical)
- **current** = the sprint with **In-Progress work** (`Active`). QA-pending-only does NOT qualify (S36). `INV`: at most ONE `Active` sprint (single-active build discipline) — if >1, **FAIL-LOUD** (ambiguous), never silently pick. If none Active → `current = null`.
- **last-completed** = the **highest-`number` fully-Done** sprint. QA-pending (S36) is NOT Done → excluded.
- **next-backlog** = the **lowest-`number` `Planned`** sprint with `number > current.number` (or `> lastCompleted.number` if no current). QA-pending is mid-flight, NOT backlog.

### 3. COMPUTED, never hand-set
Drop the `sprintName` argument path + the `/\d+/`/substring matcher. The `CurrentSprint` singleton's pin fields become **generated from the resolver** (like R37.2 board = generated); the hand-set `Sprint.status` field is **derived** (written = `deriveSprintStatus`, like R37.5 task status) or dropped — it can no longer disagree with the tasks.

## FIXTURES (golden tests)
**Fixture 1 (PO — three-slot):** S35 fully-Done · S36 QA-open (all remaining tasks `QA Review`, none `In Progress`) · S37 in-progress →
- **current = S37** (only `Active` sprint; S36's QA-pending does NOT qualify)
- **last-completed = S35** (highest fully-Done; S36 excluded = not all Done)
- **next-backlog = none** (no `Planned` sprint after S37)

**Fixture 2 (PO — terminal-resolved, mirrors the live S18 close):** S18 = **7 Done + 12 supersededBy** →
- sprint rolls up **CLOSED** (every task is Done-or-supersededBy) → eligible `last-completed`; agrees with the planner's close BY CONSTRUCTION.
- display shows **"7 Done · 12 Superseded"**, NEVER "19 Done" (INV-C1-7 no-collapse).
- if even ONE of the 12 were neither `Done` nor `supersededBy` (still In-Progress) → sprint = `Active`, NOT closed (guards a premature close).

Both are unreachable by the old matcher (`/\d+/` maps any `Sxx.y`→`xx`; `.includes` fuzzy-hits) — R37.1 keys on integer `number` + status rollup ONLY.

## INVARIANTS
- **INV-C1-1 COMPUTED-not-hand-set:** resolver reads only `{number, tasks[], task.statusChecklist}`; never consumes a hand-set `sprintName`/`Sprint.status` as source.
- **INV-C1-2 status-by-rollup:** sprint status = `deriveStatusEnum` rollup (reuses R37.5 single-source; sprint↔tasks can't disagree).
- **INV-C1-3 QA-pending ≠ current AND ≠ last-completed:** a QA-Review-only sprint is neither (S36 fixture) — the crux the old field got wrong.
- **INV-C1-4 single-current fail-loud:** >1 Active sprint = ambiguous → assert/flag (composes with R37.5 honesty audit), never silent-pick.
- **INV-C1-5 number-keyed:** every slot selection by integer `number` — kills the 33/31.1 name drift *by construction*.
- **INV-C1-7 terminal-resolved distinct (no status-invention):** `Done` and `supersededBy` both satisfy "no open work" for the CLOSED rollup, but display preserves each count DISTINCTLY — a supersededBy task is NEVER shown/counted as Done (its derived status stays honest; supersededBy is a separate field). Rollup uses terminal-resolved; display uses exact per-bucket counts (Done vs superseded).
- **INV-C1-6 FAIL-CLOSED on vacuous input** (PO cross-cutting, folds into R37.3): the resolver NEVER silent-passes on missing/vacuous data. (a) **`every([])===true` guard:** an EMPTY `tasks[]` must NOT roll up to `Done` (all-of-nothing is vacuously true) — Done requires `tasks.length>0 && all Done`; a 0-task sprint = `Planned` (defensible) but is FLAGGED if any pointer would depend on its emptiness. (b) **unresolvable task ref:** a uuid in `sprint.tasks[]` that doesn't resolve is NOT silently skipped (skipping could hide an In-Progress task → wrongly compute `Done`) → the rollup REFUSES that sprint with a named reason (`sprint S<n> references unresolvable task <uuid>`) and it cannot be `last-completed`. (c) **malformed checklist:** `deriveStatusEnum` returns `Planned` malformed-safe — fine for DERIVE, but the resolver records a "malformed-checklist" note so a gate can see it (a vacuous `Planned` must be distinguishable from a real one). (d) empty index / no sprints → all-null WITH a reason, never a bare null that reads as "resolved to nothing".

## ★ DRY ADDENDUM — ONE `sprintNumOf`, explicit consumer set, no-name-parse invariant (expert-flagged 2026-08-07)
The brittle-name class has now bitten **TWICE**, proving name-parsing is unsafe in principle: (1) `"Sprint 31.1".match(/\d+/)` → **31** collides S31 (the pin, CurrentSprint.ts:202); (2) `"…M2…".` free-text parse → **2** misreads S36 as sprint 2 (check:sprint-md). The expert's correct fix already exists but LOCALLY (generate-sprint-md.ts:328) — a **duplicated parser is a second place to drift**.

- **Promote `sprintNumOf` to THE shared resolver** (beside `resolveSprintPin`): `sprintNumOf(unit) = Number.isFinite(model.number)&&>0 ? model.number : (/sprint-(\d+)/i on sourceFile||slug) ?? -1`. **model.number authoritative; sourceFile/slug `sprint-NN` fallback; the free-text NAME is NEVER parsed.**
- **CONSUMER SET (explicit — all import the ONE `sprintNumOf`/`resolveSprintPin`, zero local parsers):**
  - `src/ts/scenario/CurrentSprint.ts` (replace the `:202-203` `name.match(/\d+/)` matcher).
  - `scripts/generate-sprint-md.ts` / `check:sprint-md` (delete the local `:328` copy, import the shared one).
  - `scripts/migrate-boards.ts` (R37.7 migrator — sprint identity for proveComplete/frozen-scope).
  - `scripts/trace-audit.ts` (any sprint-number use).
  - Any future consumer → imports it; never re-parses.
- **INV-C1-8 no-name-parse (single-source):** NO module derives a sprint number from the free-text `name`. The ONLY sprint-identity source is the shared `sprintNumOf` (model.number + sourceFile/slug fallback). Enforceable by a grep-lint BITE: a `name`-based `\d`/`match(/\d+/)` for sprint number ANYWHERE in the consumer set = FAIL (a second parser = a second drift site).

## ★ R37.1 REFINEMENT — frozen-scope exclusion + cancelledReason-terminal (the REAL pin unblocker, planner-measured 2026-08-07)
The resolver was built (`sprint-pin-resolver.ts`, `8ab2edb96`, Impl `af97137f`) and the planner ran it live: **14 sprints count Active (goal = 1 = S37)**, and — decisively — **closing the 49 non-frozen stale-Actives does NOT unblock the pin**, because **8 FROZEN pre-S19 sprints are ALSO Active** (S10=3/S11=3/S12=1/S13=7/S14=2/S15=8/S16=8/S17=33 = 65 In-Progress tasks). After a perfect 49-grind: S37 + 8 frozen = 9 Active → INV-C1-4 ambiguity throw → pin STILL FAILS. The S01-18 FREEZE (Tron: don't touch the data) therefore CONFLICTS with the pin — and the fix must be BY CONSTRUCTION, NOT by mutating frozen data.

**Two measured root causes + fixes (impl-edit of the existing resolver — NO new units; UC/Method/Impl `af97137f` unchanged):**

### FIX 1 — frozen sprints are NOT pin candidates (structural, explicit, can't drift)
`resolveSprintPin` (~:108) filters `rows` by `status==='Active'` over ALL sprints, including frozen. **Root:** a frozen sprint with ≥1 In-Progress task counts Active. **Fix:** the pin's universe = CURRENT-ERA sprints only; frozen sprints are historical, excluded from ALL three slots (current/last/next) AND from the ambiguity/unresolvable throws.
- Define ONE shared explicit boundary `FROZEN_LEGACY_MAX = 18` + `isCurrentEra(num) = num > FROZEN_LEGACY_MAX`, exported from a single module and imported by BOTH the resolver and R37.6's FROZEN_LEGACY (single-source, [[one-parser-one-source]] — the frozen boundary must never be defined twice). It is an explicit constant/allow-list, NOT a heuristic (never "old dates") → cannot drift.
- `resolveSprintPin`: `const rows = allRows.filter(r => isCurrentEra(r.num))` BEFORE computing active/closed/next + before the throws. Frozen sprints' In-Progress tasks are frozen-in-amber, not "active work"; they never make the pin ambiguous. (The 49 non-frozen stale-Actives still need the honesty grind to reach exactly 1 — this fix handles the 8 frozen that the grind structurally cannot.)

### FIX 2 — cancelledReason is terminal (alongside supersededBy/Done)
`deriveSprintStatus` (~:78) treats ONLY `supersededBy` (+Done) as terminal → a task with `cancelledReason` (planner's `450cb98a`) falls through to `deriveStatusEnum` → counts In-Progress → keeps S20 Active. **Fix:** TERMINAL-RESOLVED(task) = `derived==Done` OR `supersededBy` present OR **`cancelledReason` present**. Mirror the supersededBy branch: a `counts.cancelled` bucket, `continue` before the switch, `terminalAll = total>0 && done+superseded+cancelled === total`. `cancelledReason` is the same class as `supersededBy` (ruling B): status stays honestly checklist-derived, a separate field marks terminal — NO enum change, NO R37.5 clobber. Counted DISTINCTLY (INV-C1-7 extends: Done · Superseded · Cancelled).

## GATE — distinct BITE Test (#126, no cross-wire)
- **Golden:** fixture S35/S36/S37 → current=S37 / last=S35 / next=none.
- **DRIFT-BITE:** rename a sprint / add a `31.1` suffix / put `M2` in the name → resolver output UNCHANGED (number-keyed) = proves neither the `31.1→31` nor the `M2→2` bite can recur.
- **NO-NAME-PARSE grep-lint BITE (INV-C1-8):** scan the consumer set for a sprint-number parse off `name` → must find ZERO (the shared `sprintNumOf` is the only source; a re-introduced local parser fails the gate).
- **FROZEN-EXCLUSION BITE (INV-C1-9):** 8 frozen sprints (S10-17) with In-Progress tasks + S37 Active → pin resolves `current=S37`, NOT an ambiguity throw. Remove the `isCurrentEra` filter → it throws (proves the filter is load-bearing). And after frozen-exclusion + the 49-grind → exactly 1 Active (S37) → pin succeeds.
- **CANCELLED-TERMINAL BITE (INV-C1-10):** a task with `cancelledReason` (450cb98a) → its sprint is NOT kept Active by it (counts terminal/Closed, not In-Progress); S20 no longer Active from the cancelled task.
- **QA-pending-BITE:** flip S37's In-Progress task to `QA Review` → S37 NOT current (current=null/next active) = INV-C1-3.
- **Fully-Done-BITE:** complete S36's QA tasks → last-completed advances S35→S36.
- **Ambiguity-BITE:** two Active sprints → fail-loud (INV-C1-4), not a silent pick.
- **Idempotent** + (if written) `Sprint.status == deriveSprintStatus`.

## CHAIN + sequence + deploy
- Chain: UC `sprintPin.resolveFromFiles` → Class `SprintPinResolver` (shared pure module beside `task-status.ts`) → Method `resolveSprintPin` → Impl → distinct BITE Test. req mints at build-go.
- Sequence: R37.1 depends on R37.5 `deriveStatusEnum` (LANDED). THEN R37.3 guard, THEN R37.6.
- **Deploy:** shared pure module. If it feeds the CLIENT `CurrentSprint.ts` render → client bundle → **real restart** (measure consumer wiring at build). If scripts/CI-only → no restart. Expert confirms the consumer set at build.
