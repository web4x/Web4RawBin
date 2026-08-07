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
`deriveSprintStatus(sprint)` over `sprint.tasks[]` using R-C5 `deriveStatusEnum(task.statusChecklist)`. **Terminal-resolved set `T = {Done, Superseded, Obsolete, Cancelled}`** = "no open work" (PO ruling 2026-08-07):
- **Active (In Progress)** — ≥1 task derives `In Progress`.
- **CLOSED** — tasks non-empty AND *every* task ∈ `T` (Done-or-terminal). Eligible for `last-completed`. Sub-label `Done` when all are `Done`; `Closed` when the set mixes Done + Superseded/Obsolete/Cancelled.
- **QA-pending** — no `In Progress`, ≥1 `QA Review`, not all ∈ `T`.
- **Planned** — all tasks `Planned` (or no tasks).

**★ Terminal statuses do NOT collapse into `Done`** — a Superseded task satisfies "no open work" for the *rollup* but is preserved DISTINCTLY in *display* (S18 = "7 Done · 12 Superseded", never "19 Done"). Collapsing = status-invention (forbidden). See INV-C1-7.

**★ REPRESENTATION FLAG (measured — coordinate with R-C5 owner / planner before the S18 close hardens):** `Superseded` does NOT exist on disk today (S18 = 11 In-Progress / 7 Done / 1 Planned; 12 *unchecked* `- [ ] done` boxes). R-C5's enum is only `Planned|In Progress|QA Review|Done`. For R-C1 rollup and R-C5 to AGREE, terminal statuses MUST be **checklist-expressible** (a checked `- [x] Superseded` top-box) so `deriveStatusEnum` returns them from the single source. If instead `Superseded` is set only as `model.status`, R-C5's "status = deriveStatusEnum(checklist)" will CLOBBER it and the false-Done detector will misfire. → **deriveStatusEnum must be extended to recognize the terminal top-boxes** (terminal wins over the progression ladder). This is a cross-R-C5 change; flag to whoever owns the S18 close + R-C5 build.

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

**Fixture 2 (PO — terminal-resolved, mirrors the live S18 close):** S18 = **7 Done + 12 Superseded** →
- sprint rolls up **CLOSED** (every task ∈ `T`) → eligible `last-completed`; agrees with the planner's close BY CONSTRUCTION.
- display shows **"7 Done · 12 Superseded"**, NEVER "19 Done" (INV-C1-7 no-collapse).
- if even ONE of the 12 were still `In Progress` (not yet superseded) → sprint = `Active`, NOT closed (guards a premature close).

Both are unreachable by the old matcher (`/\d+/` maps any `Sxx.y`→`xx`; `.includes` fuzzy-hits) — R-C1 keys on integer `number` + status rollup ONLY.

## INVARIANTS
- **INV-C1-1 COMPUTED-not-hand-set:** resolver reads only `{number, tasks[], task.statusChecklist}`; never consumes a hand-set `sprintName`/`Sprint.status` as source.
- **INV-C1-2 status-by-rollup:** sprint status = `deriveStatusEnum` rollup (reuses R-C5 single-source; sprint↔tasks can't disagree).
- **INV-C1-3 QA-pending ≠ current AND ≠ last-completed:** a QA-Review-only sprint is neither (S36 fixture) — the crux the old field got wrong.
- **INV-C1-4 single-current fail-loud:** >1 Active sprint = ambiguous → assert/flag (composes with R-C5 honesty audit), never silent-pick.
- **INV-C1-5 number-keyed:** every slot selection by integer `number` — kills the 33/31.1 name drift *by construction*.
- **INV-C1-7 terminal-resolved distinct (no status-invention):** `T={Done,Superseded,Obsolete,Cancelled}` all satisfy "no open work" for the CLOSED rollup, but display preserves each count DISTINCTLY — a Superseded task is NEVER shown/counted as Done. Rollup uses the terminal SET; display uses the exact per-status counts.
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
