# R-C1 — Sprint Pin Resolver (current / last-completed / next-backlog COMPUTED from files)

**Author:** robbin-architect · 2026-08-07 (S37 consistency-by-construction). PO-dispatched after R-C2/R-C5. Builds on R-C5 `deriveStatusEnum` (landed). Design → req mints at build-go → expert builds → I backstop. Companion to [[consistency-by-construction]] doctrine.

**DOCTRINE:** the sprint pin is a GENERATED view of file state — it CANNOT be hand-set and CANNOT drift. Both the *which-sprint* pointer and the three slots are COMPUTED from each sprint's tasks. Replaces (a) the brittle name matcher and (b) the hand-set `Sprint.status` field.

## MEASURED ground truth (disk, HEAD v0.8.65)
- **Sprint unit shape:** `{ uuid, name, number:int, goal, status, requirements[], tasks:[uuid] }`. The `status` field is **HAND-SET** (e.g. Sprint 22 = "Planned") → the exact dual-status drift R-C5 cures for Tasks, one level up.
- **R-C5 `deriveStatusEnum(checklist)` is LANDED** (`src/ts/scenario/task-status.ts`, Method `f0f9eaa4`, Impl `8a032c42`): per-Task status = highest-order checked top-level box (`Planned < In Progress < QA Review < Done`), malformed-safe. R-C1 rolls this up per sprint — single-source, a sprint can't disagree with its own tasks.
- **The brittle matcher** = `CurrentSprint.ts:202-207`: `this.sprintName.match(/\d+/)` then fallback `norm(s.name).includes(key)`. Two failure modes, both PROVEN:
  - `"Sprint 31.1".match(/\d+/)` → **`31`** → collides Sprint 31 (not 33) = **the 33/31.1 drift**.
  - `.includes(key)` substring → any sprint whose name contains the key fuzzy-hits.
  - The pin is also **HAND-SET** (`setChain(sprintName)` / `focus`) — a passed-in name, not a computed fact.
- **Consumers** (measured): `CurrentSprint.ts` (client), `scripts/generate-sprint-md.ts`, `scripts/planner-drive.ts`, `scripts/trace-audit.ts`, `src/ts/server/server.ts`. → resolver must be a SHARED pure module (like `task-status.ts`).

## DESIGN — pure `resolveSprintPin(idx): { current, lastCompleted, nextBacklog }`
Each slot = `{ uuid, number, name } | null`. **Number-keyed throughout — never name-substring, never `/\d+/`.**

### 1. Sprint status by rollup (never the hand-set `Sprint.status`)
`deriveSprintStatus(sprint)` over `sprint.tasks[]`. Per-task status stays HONESTLY derived from the checklist via R-C5 `deriveStatusEnum` — the enum stays `{Planned|In Progress|QA Review|Done}`, UNCHANGED. Supersession is a **SEPARATE `supersededBy` field** (PO ruling B, 2026-08-07; the field 44 units already carry, e.g. `R30.32 supersededBy R30.34`), NOT a status value.

**TERMINAL-RESOLVED(task) = (`deriveStatusEnum(checklist) == Done`) OR (`task.supersededBy` present)** = "no open work". (A superseded task's OWN work was honestly never done → its derived status stays `In Progress`/`Planned`; `supersededBy` explains WHY it never will be, naming the superseding req/sprint.)
- **Active (In Progress)** — ≥1 task derives `In Progress` AND is NOT superseded.
- **CLOSED** — tasks non-empty AND *every* task is TERMINAL-RESOLVED (Done-or-supersededBy). Eligible for `last-completed`. Sub-label `Done` when all are `Done`; `Closed` when it mixes `Done` + `supersededBy`.
- **QA-pending** — no active In-Progress, ≥1 `QA Review`, not all terminal-resolved.
- **Planned** — all tasks `Planned` (or no tasks).

**★ Why the field, not a status enum-value (planner-measured, my earlier flag steered here):** writing `status='Superseded'` would make each such task a DRIFT offender (54→66) because `deriveStatusEnum(checklist)` would still return `In Progress`/`Planned` — the consistency sprint contradicting itself. The `supersededBy` field keeps status honestly checklist-derived: **R-C5 has nothing to clobber, `deriveStatusEnum` needs NO extension, the status vocabulary the sprint exists to unify stays unified.** NO cross-R-C5 change.

**★ Terminal-resolved does NOT collapse into `Done`** — a supersededBy task satisfies "no open work" for the *rollup* but is preserved DISTINCTLY in *display* (S18 = "7 Done · 12 Superseded", never "19 Done"). See INV-C1-7.

### 2. Three slots (the PO rules, made mechanical)
- **current** = the sprint with **In-Progress work** (`Active`). QA-pending-only does NOT qualify (S36). `INV`: at most ONE `Active` sprint (single-active build discipline) — if >1, **FAIL-LOUD** (ambiguous), never silently pick. If none Active → `current = null`.
- **last-completed** = the **highest-`number` fully-Done** sprint. QA-pending (S36) is NOT Done → excluded.
- **next-backlog** = the **lowest-`number` `Planned`** sprint with `number > current.number` (or `> lastCompleted.number` if no current). QA-pending is mid-flight, NOT backlog.

### 3. COMPUTED, never hand-set
Drop the `sprintName` argument path + the `/\d+/`/substring matcher. The `CurrentSprint` singleton's pin fields become **generated from the resolver** (like R-C2 board = generated); the hand-set `Sprint.status` field is **derived** (written = `deriveSprintStatus`, like R-C5 task status) or dropped — it can no longer disagree with the tasks.

## FIXTURES (golden tests)
**Fixture 1 (PO — three-slot):** S35 fully-Done · S36 QA-open (all remaining tasks `QA Review`, none `In Progress`) · S37 in-progress →
- **current = S37** (only `Active` sprint; S36's QA-pending does NOT qualify)
- **last-completed = S35** (highest fully-Done; S36 excluded = not all Done)
- **next-backlog = none** (no `Planned` sprint after S37)

**Fixture 2 (PO — terminal-resolved, mirrors the live S18 close):** S18 = **7 Done + 12 supersededBy** →
- sprint rolls up **CLOSED** (every task is Done-or-supersededBy) → eligible `last-completed`; agrees with the planner's close BY CONSTRUCTION.
- display shows **"7 Done · 12 Superseded"**, NEVER "19 Done" (INV-C1-7 no-collapse).
- if even ONE of the 12 were neither `Done` nor `supersededBy` (still In-Progress) → sprint = `Active`, NOT closed (guards a premature close).

Both are unreachable by the old matcher (`/\d+/` maps any `Sxx.y`→`xx`; `.includes` fuzzy-hits) — R-C1 keys on integer `number` + status rollup ONLY.

## INVARIANTS
- **INV-C1-1 COMPUTED-not-hand-set:** resolver reads only `{number, tasks[], task.statusChecklist}`; never consumes a hand-set `sprintName`/`Sprint.status` as source.
- **INV-C1-2 status-by-rollup:** sprint status = `deriveStatusEnum` rollup (reuses R-C5 single-source; sprint↔tasks can't disagree).
- **INV-C1-3 QA-pending ≠ current AND ≠ last-completed:** a QA-Review-only sprint is neither (S36 fixture) — the crux the old field got wrong.
- **INV-C1-4 single-current fail-loud:** >1 Active sprint = ambiguous → assert/flag (composes with R-C5 honesty audit), never silent-pick.
- **INV-C1-5 number-keyed:** every slot selection by integer `number` — kills the 33/31.1 name drift *by construction*.
- **INV-C1-7 terminal-resolved distinct (no status-invention):** `Done` and `supersededBy` both satisfy "no open work" for the CLOSED rollup, but display preserves each count DISTINCTLY — a supersededBy task is NEVER shown/counted as Done (its derived status stays honest; supersededBy is a separate field). Rollup uses terminal-resolved; display uses exact per-bucket counts (Done vs superseded).
- **INV-C1-6 FAIL-CLOSED on vacuous input** (PO cross-cutting, folds into R-C3): the resolver NEVER silent-passes on missing/vacuous data. (a) **`every([])===true` guard:** an EMPTY `tasks[]` must NOT roll up to `Done` (all-of-nothing is vacuously true) — Done requires `tasks.length>0 && all Done`; a 0-task sprint = `Planned` (defensible) but is FLAGGED if any pointer would depend on its emptiness. (b) **unresolvable task ref:** a uuid in `sprint.tasks[]` that doesn't resolve is NOT silently skipped (skipping could hide an In-Progress task → wrongly compute `Done`) → the rollup REFUSES that sprint with a named reason (`sprint S<n> references unresolvable task <uuid>`) and it cannot be `last-completed`. (c) **malformed checklist:** `deriveStatusEnum` returns `Planned` malformed-safe — fine for DERIVE, but the resolver records a "malformed-checklist" note so a gate can see it (a vacuous `Planned` must be distinguishable from a real one). (d) empty index / no sprints → all-null WITH a reason, never a bare null that reads as "resolved to nothing".

## GATE — distinct BITE Test (#126, no cross-wire)
- **Golden:** fixture S35/S36/S37 → current=S37 / last=S35 / next=none.
- **DRIFT-BITE:** rename a sprint or add a `31.1`-style suffix → resolver output UNCHANGED (number-keyed) = proves it can't drift on name.
- **QA-pending-BITE:** flip S37's In-Progress task to `QA Review` → S37 NOT current (current=null/next active) = INV-C1-3.
- **Fully-Done-BITE:** complete S36's QA tasks → last-completed advances S35→S36.
- **Ambiguity-BITE:** two Active sprints → fail-loud (INV-C1-4), not a silent pick.
- **Idempotent** + (if written) `Sprint.status == deriveSprintStatus`.

## CHAIN + sequence + deploy
- Chain: UC `sprintPin.resolveFromFiles` → Class `SprintPinResolver` (shared pure module beside `task-status.ts`) → Method `resolveSprintPin` → Impl → distinct BITE Test. req mints at build-go.
- Sequence: R-C1 depends on R-C5 `deriveStatusEnum` (LANDED). THEN R-C3 guard, THEN R-C6.
- **Deploy:** shared pure module. If it feeds the CLIENT `CurrentSprint.ts` render → client bundle → **real restart** (measure consumer wiring at build). If scripts/CI-only → no restart. Expert confirms the consumer set at build.
