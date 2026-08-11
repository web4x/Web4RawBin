# C4 — The MVC / View-Pipeline SHAPE (architecture)

**By:** robbin-architect 2026-08-11, per PO + Tron ("that's far away from MVC and a view pipeline"). This is the SHAPE that unifies C4.1–C4.8 (planner containerizing in parallel) — not patches. Grounded in the PO's measured analysis (analysis-c4-task-statusnext.md, 63fb728a8) + seams I re-measured. Design → req mints the chain scenario-first → expert wires → tester bites → I backstop.

## The one law
**Every task-status change flows `Model ← Controller → Pipeline → Views`, through a SINGLE controller entry, announced by a SINGLE event, and NOTHING bypasses the controller. Every view is a pure function of the model reachable ONLY through the pipeline, and any view that cannot prove it is current renders VISIBLY STALE.**

Data-flow (one line):
`act (agent/Tron) → statusNext[guard+evidence+tick+persist+emit] → deriveStatusEnum (Model truth) → notifyTransition{revision} → ( wss → client REVALIDATE-or-STALE-BADGE ) + ( pipeline → owned-board REGEN ) + ( agent NOTIFY )`

## Measured seams (the shape plugs into these, invents nothing)
- CONTROLLER: `task-fsm.ts` — TRANSITIONS + `guardTransition` + six `start*` + `tronApprove(unit,ref)` + `deriveStatusEnum` + `assertStatusConsistent`. All mutate `unit.model` IN MEMORY; **none persist; no single entry**.
- PERSIST: `ScenarioIndex.put` (the one disk-write chokepoint) — Task is committed-class → statusNext is a LEGITIMATE deliberate writer (opts into the class-guard, INV-CG2/3).
- CLIENT BROADCAST seam EXISTS: `wss`/`wsClients` (server.ts:3459) + `room.broadcast` pattern (:2009) — client notify RIDES this, no new socket.
- CLIENT VIEW: `model.ts` fetches `/api/model/tree` snapshot, refresh ONLY on `#refresh` (:40) / post-mutation `load()`; lazy-expand via `/api/trace/children`. NO ws-invalidation, NO focus/visibility revalidation.
- SERVER READ is already correct-on-read (server.ts:2503-2519) — the drift is that no surface is TOLD to re-read.

## CONTROLLER boundary — `statusNext` is the SOLE transition entry (C4.2 / C4.3)
`statusNext(idx, taskUuid, {actor, evidenceRef?, commitRef?})` — the ONE act that advances a task:
1. compute the next LEGAL state via TRANSITIONS + `guardTransition` (the six `start*` become INTERNAL step-appliers behind this one entry, never called ad-hoc).
2. **EVIDENCE-PRECONDITION**: REFUSE to advance past a step whose evidence is absent (the chain-edge for that step — reuses the checklist-chain-audit's real-chain-edge notion). A box ticked without evidence corrupts the exact signal Tron steers QA by → refuse, fail-loud.
3. **tick the CHECKLIST** for the step — NEVER hand-set the enum; `deriveStatusEnum` produces the status (status stays DERIVED, model-truth).
4. **PERSIST** via `ScenarioIndex.put` with the deliberate-opt flag (legitimate committed-class writer per the guard work).
5. **EMIT** one `TaskTransition{taskUuid, from, to, revision, at, actor}` — the ONLY place a transition is announced.
- **Single-source Done (C4.3):** `statusNext` OWNS the Done transition. R40.10 `approveByOwner` (server.ts:1456) DELEGATES — it records `approvedBy/approvedAt` as the EVIDENCE, then calls statusNext's Done step; it does NOT set Done itself. FSM `tronApprove` FOLDS INTO statusNext as the Done applier, not a parallel writer. **One Done-writer by construction** (kills the two-writer disease the analysis flagged).

## MODEL — self-heal on read (C4.1)
Units are truth; status DERIVED. On init/read the pin/board/task object VALIDATES: recompute to reality (re-derive) or REFUSE — never return a silently-drifted value (C2/C6 the measured instances). This is what feeds the pipeline a fresh-or-refused value, never a quietly-stale one.

## OBSERVER / NOTIFICATION contract (C4.6) — ONE emit, TWO transports, BOTH audiences
`notifyTransition(event)` is the single fan-out; `event.revision` is a **monotonic model-revision token** (the freshness key):
- **CLIENTS** — broadcast `TASK_CHANGED{taskUuid, revision}` over the EXISTING `wss`/`wsClients` (rides server.ts:3459). No polling, no new socket.
- **AGENTS** — emit to the agent channel (addLog audit sink + an SM-relayed scenario-change signal). The FSM has ZERO notify today; the contract adds the ONE emit point that both transports read.
Single-source: one event shape, one emit call — no surface discovers change independently.

## VIEW PIPELINE — both surfaces subscribe, neither is hand-driven (C4.4 + C4.5)
- **Generated boards (C4.4):** a pipeline stage SUBSCRIBES to `TaskTransition` → regenerates the OWNED board (reuses the C8 owned-output guard — never touch unmarked files). The regen is TRIGGERED by the event, not a human-run `generate-sprint-md`. (That disconnect is exactly why C2/C6 read Planned while the chain had shipped.)
- **Live client (C4.5):** `model.ts` SUBSCRIBES to the ws `TASK_CHANGED`, and on notify / `focus` / `visibilitychange` either REVALIDATES the affected subtree (re-fetch) OR **visibly marks it STALE**:
  - **Freshness token on the render:** each rendered node carries the `revision` it was fetched at; the client tracks the latest broadcast `revision`. `rendered.revision < latest` → the node shows a **STALE badge** until revalidated. This is how **C4's never-return-a-silently-drifted-value REACHES THE RENDER SURFACE** — a stale render is no longer indistinguishable from a fresh one; it is badged. (Directly fixes Tron's pin-swap-not-appearing.)

## AUDIT backstop — retained (C4.7)
`checklist-chain-audit` stays in ci:gates as the historical-debt + bypass backstop (+ the 35-WARN verify-owner-first triage). Prevention (statusNext records at the moment) does NOT replace audit (catches lag + any bypass). Complementary, not redundant.

## THE DOMINANCE PROPERTY — the no-bypass law, lint-PROVABLE (C4.8)
Stated as a uniqueness property, not "we checked the paths":
> **The Controller is the UNIQUE DOMINATOR of every task-status transition; each View is a pure function of the Model reachable ONLY through the Pipeline.**
Lint proves (each two-bite: plant a bypass → RED; lint-runs meta → weaken → RED), folds ci:gates:
1. **One controller** — no `model.status =` / no task-checklist tick on a Task unit OUTSIDE `statusNext` (grep-provable single writer).
2. **One Done-writer** — no path sets Done except statusNext; R40.10 must DELEGATE (a direct Done-set in approveByOwner → RED).
3. **No hand-authored owned view** — no write to a generator-owned board file outside the pipeline (rides C8 owned-output markers).
Behavioural bites cover paths that EXIST; the lint forbids paths that DO NOT EXIST YET (same dominance shape as INV-D1 / R40.19 HN4).

## Map to the C4.x containers (planner)
| Container | This shape provides |
|---|---|
| C4.1 Model self-heal | validate-on-read → fresh-or-refuse (feeds the pipeline) |
| C4.2 Controller entry | `statusNext` sole entry: guard+evidence+tick+DERIVE+persist+emit |
| C4.3 Single-source Done | statusNext OWNS Done; R40.10 approve DELEGATES; tronApprove folds in |
| C4.4 Pipeline (boards) | event-triggered owned-board regen (C8 guard), no manual script |
| C4.5 Pipeline (client) | ws-subscribe + focus/visibility revalidate OR stale-badge (revision token) |
| C4.6 Observer | one `notifyTransition{revision}`, two transports (wss clients + agents) |
| C4.7 Audit | checklist-chain-audit retained as backstop |
| C4.8 MVC boundary | dominance property + lint (unique controller / pure views / no bypass) |

## PO HARDENINGS (folded 2026-08-11) — A/B/C/D, (C) load-bearing
### (A) Freshness FAILS CLOSED on a missed event — absence of notification is NOT evidence of currency
The revision token is insufficient if the transport drops: a missed `TASK_CHANGED` (ws blip) silently returns to today's stale-believes-fresh. So:
- The `welcome`/(re)connect handshake (server.ts:3490 already sends `welcome`) PIGGYBACKS the current global model `revision`. On every (re)connect / `focus` / `visibilitychange`, the client RECONCILES `rendered.revision` vs the server's current `revision` — mismatch OR **unknown** (offline / can't confirm) → REVALIDATE or STALE-BADGE.
- **Rule: unconfirmed currency == STALE, never fresh** (same shape as NOT-RUN==RED). A gap in the ws sequence (monotonic `revision` skips) → treat as stale. The client NEVER assumes fresh because no event arrived.
- Bite: drop the ws / skip a revision → the open node must go STALE (RED if it renders fresh).

### (B) SCOPE the regen — affected sprint only, debounced
The event carries the affected sprint (taskUuid → its Sprint). The board pipeline regenerates ONLY that sprint's OWNED board(s), DEBOUNCED (coalesce a burst of transitions in one sprint into a single regen) — NOT all 144 `.md` per transition. C8 owned-output guard still gates writes. Cost-bounded so the pipeline stays enabled — **a guard people disable because it's expensive is worse than none.** Bite: two transitions in one sprint within the debounce window → exactly ONE regen, scoped to that sprint (RED if it regenerates unaffected sprints / fires per-event).

### (C) ★ ONE EVIDENCE PREDICATE, SHARED — the load-bearing single-source
statusNext's evidence-precondition ("has this step's evidence landed?") and `checklist-chain-audit` compute essentially the SAME question (chain reached shipped-Impl / two-keyed passing `Test`↔`Impl.tests[]` for that step). Implemented separately = **TWO DEFINITIONS OF EVIDENCE that can disagree** — the controller could refuse what the audit calls recorded, or advance what it calls unrecorded = the two-sources disease at the very heart of the fix. FIX: extract ONE predicate `evidenceForStep(unit, step): boolean` in a shared module; **BOTH** `statusNext` (prevention) AND `checklist-chain-audit` (backstop) CONSUME it — never two copies. This applies C4's own single-source law to the fix's internals. Bite: a second/divergent evidence definition → lint RED; the predicate is the sole authority both import (grep-provable single definition, two-bite).

### (D) R40.10 delegation must NOT break ITEM ZERO — positive-control bites
Approve is LIVE, gated GREEN, Tron's 13 verdicts run through it. The delegation edit (approveByOwner → calls statusNext's Done step instead of setting Done) needs POSITIVE-CONTROL bites (prove the good path still works, not just the negative no-2nd-writer):
- approve STILL records `approvedBy`/`approvedAt` (as the Done evidence) AND reaches Done end-to-end;
- decline STILL mints a reachable CR (BUG-A/r4010c);
- non-owner STILL 403.
- **tester RE-RUNS r4010 after the delegation edit.** The negative bite (no 2nd Done-writer) + these positive controls together = delegation without regression.

## Chain (verify-owner-first) — the shape's own traceability
R-C4 → NEW UCs per boundary (req mints scenario-first, distinct-intent, NO cross-wire): `taskController.statusNext` → Class `TaskController` (task-fsm.ts) → Method `statusNext` → Impl; `taskController.notifyTransition` → Method `notifyTransition` → Impl; `viewPipeline.revalidateOrMarkStale` → Class (client model) → Method → Impl; `mvcBoundary.assertControllerDominates` → Class `MvcBoundaryGuard` (new lint file) → Method → Impl. Single-source Done = a DELEGATION edit to R40.10 approve (no new Done Impl). **(C) shared evidence predicate** = NEW UC `evidence.evidenceForStep` → Class `StepEvidence` (shared module) → Method `evidenceForStep` → Impl, CONSUMED by BOTH statusNext AND checklist-chain-audit (the audit's existing chain-edge computation refactors to CALL this one predicate — do NOT leave a second copy; retire the inline one). This is the single-source unit that keeps the two evidence-askers from disagreeing. Each rides its C4.x container's ACs. I confirm uuids before expert wires; backstop @390 for the client stale-badge + flip Impls.
