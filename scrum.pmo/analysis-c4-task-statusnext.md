# C4 / R37.4 — THE ISSUE: progress is never recorded at the moment it happens

**Origin:** Tron looked at Task 37.2 on his device and said *"full refinement has happened but is not reflected in the task."* He was right. This document is the analysis behind it, to be folded into **R37.4 / T-C4 (Objects self-heal — validate on init/read, never run silently drifted)**, which is the existing requirement that covers this work.

## The defect, precisely

A task's status is DERIVED from its checklist. Agents did the work, built and credited the traceability chain, and shipped the implementation — but **nobody ever ticked the checklist**. So the status derived to `Planned` while the chain had reached a shipped Impl. The board returned a **silently-drifted value**, which is exactly what R37.4 forbids.

Confirmed instances: **C2** (reconciled 70123010e) and **C6** (reconciled 5172291fc) — both landed honestly at *In Progress 2/4*.

## What ALREADY EXISTS (do not re-build — ride it)

`src/ts/scenario/task-fsm.ts` is a real state machine:

- **7 states:** Planned → Refining → CreatingTestCases → Implementing → Testing → QAReview → Done
- A **TRANSITIONS table** plus `guardTransition`, so illegal moves are already blocked
- **Per-step mutators:** `startRefinement`, `startCreatingTestCases`, `startImplementing`, `startTesting`, `requestQAReview`, `tronApprove(unit, tronCommitRef)`, `resetToPlanned`, `canTransition`
- Alongside it: `deriveStatusEnum` (the single-source status derivation) and `assertStatusConsistent` (the fail-loud detector)
- Imported by `skills.ts`, re-exported from `scenario/index.ts` — **it is not dead code**

## What is MISSING — the three things Tron named

1. **No single "next"** — it is six separate `start*` calls; nothing advances to the next *legal* state in one act.
2. **No view re-render** — regeneration lives in a separate manual script. This is exactly why C2's board went stale under him.
3. **No agent notification** — zero broadcast / notify / emit in the FSM.
4. **Persistence unclear** — the functions mutate a `ScenarioUnit` in memory; writing it goes through the `ScenarioIndex.put` path.

⇒ The recurring pattern: **the mechanism is built, the wiring isn't.**

## ⚠ RISK THIS EXPOSED — two writers for one transition

`tronApprove` already exists in the FSM, **and** R40.10's approve endpoint records `approvedBy` / `approvedAt`. If both can set `Done`, that is **two sources for one transition** — the two-sources disease. Whatever is built must declare which one OWNS the Done transition and make the other DELEGATE, never duplicate.

## ACCEPTANCE CRITERIA to fold into R37.4

- [ ] (functional) A **single advance entry point** (`statusNext`) moves a task to the next LEGAL state via the existing TRANSITIONS table — not six separate calls.
- [ ] (functional) It **PERSISTS** the scenario unit (via the `ScenarioIndex.put` path; coordinate with the class-guard work — this is a legitimate committed-class writer).
- [ ] (functional) It triggers the generated **VIEWS to re-render**, so the board cannot go stale the way C2's did.
- [ ] (functional) It **NOTIFIES the agents** (the FSM has no notification today).
- [ ] (functional) Status stays **DERIVED**: `statusNext` ticks the CHECKLIST and lets `deriveStatusEnum` produce the status — it NEVER hand-sets the enum.
- [ ] (functional) **EVIDENCE-PRECONDITION**: it must REFUSE to advance past a step whose evidence is absent. A box ticked without evidence corrupts the exact signal Tron steers QA by.
- [ ] (functional) **SINGLE-SOURCE with R40.10 approve**: the req must state which mechanism owns the `Done` transition; the other delegates. No second writer.
- [ ] (functional) Objects **validate on init/read** — recompute to reality or REFUSE; never return a silently-drifted value (R37.4's original AC, now with a measured instance behind it).
- [ ] (gate) STUB-MUST-FAIL: break the advance/derive path and the gate must go RED. Name the FAMILY: **under-recorded-progress**.
- [ ] (gate) Evidence-precondition bite: attempt to advance a step with absent evidence → MUST refuse.

## The audit half already shipped (do not duplicate it)

`scripts/checklist-chain-audit.mjs` (8f42e13e8) is **registered in ci:gates** (16 gates; `check:task-status` intact). It compares **checklist-vs-CHAIN** — the pair the old status-vs-checklist detector structurally could not see (stored == derived == 0 drift while the chain had shipped). Coverage counts **only on a real chain-edge** (two-keyed `Impl.tests[]` ↔ `Test.implementations[]`, status pass); a prose mention or cross-credit never counts, and that rule is bite-guarded.

Board-wide scan of **511 tasks**: **FAIL = 0** (C2/C6 read green because they were RECONCILED, *not* because they were born clean — the class is real and recurs), **WARN = 35** awaiting per-task verify-owner-first triage.

⇒ **Detector = AUDIT (catches the lag). `statusNext` = PREVENTION (records progress at the moment it happens).** They are complementary; the detector remains the backstop for historical debt and any bypass.

---

# THE ARCHITECTURAL DIAGNOSIS (Tron): THIS IS NOT MVC, AND THERE IS NO VIEW PIPELINE

Tron's words: *"thats faaaaar away from mvc and a view pipeline as you initially wanted to deliver."* He is right, and it explains why every symptom recurs.

| MVC role | What we actually have | Consequence |
|---|---|---|
| **MODEL** | Scenario units are truth; status DERIVED via `deriveStatusEnum` ✓ | The only healthy layer |
| **CONTROLLER** | `task-fsm.ts` exists (states + TRANSITIONS + guards) but is **not wired to persistence**, has **no single entry**, and **two writers can set Done** (FSM `tronApprove` vs R40.10 approve) | Transitions happen ad-hoc or not at all; progress goes unrecorded |
| **VIEW (generated boards)** | Regenerated by a **MANUAL script** (`generate-sprint-md`) | C2/C6 read `Planned` while the chain had shipped |
| **VIEW (live client tree)** | A **fetched snapshot**, lazy-expanded, **no invalidation** | Tron's pin swap did not appear until Refresh |
| **PIPELINE / OBSERVER** | **Does not exist** — no notify, no invalidation, no propagation | Every surface drifts independently and silently |
| **SELF-HEAL (C4)** | Server recomputes-on-read ✓ · client render does **not** | A stale render is indistinguishable from a fresh one |
| **AUDIT (backstop)** | `checklist-chain-audit` shipped + wired in ci:gates ✓ | Catches the lag after the fact — a backstop, not a pipeline |

**The root is structural, not a set of bugs:** state changes have no single path through a controller, and views have no subscription to the model. So every fix so far has been a patch on one surface while the others keep drifting.

# C4 SUBTASKS — the full decomposition (PO scope definition)

Each subtask carries: dual parent/child links to T-C4, its own ACs, a gate with **stub-must-fail**, and the family name **under-recorded-progress / silent-drift**.

- **C4.1 — MODEL self-heal on read.** Pin/board/task objects VALIDATE on init/read: recompute to reality or REFUSE. Never return a silently-drifted value. (C4's original core AC, now with C2/C6 as measured instances.)
- **C4.2 — CONTROLLER: single transition entry (`statusNext`).** One advance path via the existing TRANSITIONS table; ticks the **checklist** and lets the status DERIVE (never hand-sets the enum); **PERSISTS** through the `ScenarioIndex.put` path; **evidence-precondition REFUSES** to advance past a step whose evidence is absent.
- **C4.3 — CONTROLLER: single-source Done.** Declare which mechanism OWNS the `Done` transition (`statusNext`/FSM vs R40.10 approve); the other DELEGATES. Lint/bite so a second writer cannot reappear.
- **C4.4 — VIEW PIPELINE (generated boards).** A model change PROPAGATES to the owned generated views — no manual regeneration step. Reuses the C8 owned-output guard (never touch unmarked files); C2's write-path defect is in scope for the pipeline's correctness.
- **C4.5 — VIEW PIPELINE (live client).** The open view REVALIDATES on notify / focus / visibility-change, or **visibly marks itself stale**. Never silently render old slots as current. (Measured: `model.ts` lazy-expand + `#refresh` only.)
- **C4.6 — NOTIFICATION / OBSERVER.** The transition emits a change event that reaches BOTH the agents and the clients. (Measured: zero broadcast/notify/emit in `task-fsm.ts` today.)
- **C4.7 — AUDIT backstop retained.** `checklist-chain-audit` stays in ci:gates as the historical-debt-and-bypass backstop, plus the 35-WARN verify-owner-first triage. Prevention does not replace audit.
- **C4.8 — MVC BOUNDARY by construction.** An architectural statement + lint: views are never hand-authored where a generator owns them, and no transition path may bypass the controller. State it as a **dominance/uniqueness property a linter can prove**, not as "we checked the paths" — behavioural bites cover paths that exist, the lint prevents paths that do not exist yet.

**Sequencing note:** C4.6 + C4.5 are what Tron *feels* (his pin swap not appearing); C4.2 + C4.3 are what prevents the recurrence; C4.1 is the guarantee; C4.4 fixes the board surface; C4.8 keeps it from decaying. C4.7 already exists and only needs to be kept.

---

# ★★ DRY AMENDMENT (Tron, BEFORE any build): GENERIC MECHANISM + PLUGGED-IN POLICY

Tron: *"we are working in an environment of all classes scenario-unit model based and hundreds of different view formats. make sure you DRY."*

**The design as approved is TASK-SHAPED and therefore NOT DRY.** `statusNext` / `TASK_CHANGED` / a sprint-board regenerator solve it for `ior:class:Task` only. With every class a scenario unit and hundreds of view formats, that shape multiplies into N controllers, N events and N regenerators — the same disease at scale.

## The split: ONE mechanism, MANY policies, MANY projections

| Layer | GENERIC (build once) | CLASS/FORMAT-SPECIFIC (plug in) |
|---|---|---|
| **Model** | Any scenario unit (`ior:class:*`), unit revision | — |
| **Controller** | ONE mutation entry: validate → apply → **persist** → **emit**. Generic for any unit. | The **Task FSM** (7 states, TRANSITIONS, guards) is ONE registered **policy**, not the mechanism. Other classes register their own rules or none. |
| **Evidence** | ONE predicate interface, consumed by controller AND audit | Per-class evidence rules (Task's step-evidence is the first) |
| **Event** | **ONE generic change event** — `UNIT_CHANGED { ior, uuid, revision }` — NOT `TASK_CHANGED`. Any subscriber filters by class/uuid. | — |
| **Pipeline** | ONE **projection registry**: view formats REGISTER against the model; the pipeline invokes the affected projections, scoped + debounced. | Each view format is a registered **projection** (sprint `.md`, requirements.md, planning.md, puml, MDA tree, trace tree, detail drawers, WebItem formats …). Adding format N+1 must need **no new plumbing**. |
| **Freshness** | ONE revision/`revalidate-or-mark-stale` capability usable by ANY view | — |
| **Dominance lint** | **No unit write bypasses the controller** (generic), not merely "no status write outside statusNext" | — |

## DRY = also do not duplicate what already exists — RIDE it

- **`renderFacet`** (R36.1/2) — the facet-lens is already built ONCE and reused by all projections. The pipeline must reuse that pattern, not fork per format.
- **`deriveViewKind`** (R40.23) — view-kind derivation is already single-sourced; projections consume it, never re-derive.
- **`universalActionBar` / action units** (R40.5) — verbs are already de-duplicated onto a shared bar; transitions surface as ACTION UNITS, not bespoke buttons.
- **existing `wss`/`wsClients`** — one transport, already chosen; no second socket.
- **C8 `guardedWrite`/`guardedDelete`** — the ONE write/delete chokepoint for owned outputs; every projection writes through it.
- **`generate-sprint-md`** — becomes a REGISTERED PROJECTION, not a special case the pipeline knows about by name.

## Consequences for C4.1–C4.8 (ACs must be restated generically)

- **C4.2** is a GENERIC unit-transition controller; `statusNext` is its Task-policy façade — the same entry serves any class.
- **C4.4** is the PROJECTION REGISTRY + scoped/debounced invocation; the sprint board is projection #1, not the subject.
- **C4.5** is a GENERIC revalidate-or-stale capability any view inherits; the MDA tree is the first consumer.
- **C4.6** emits `UNIT_CHANGED` for ANY unit; Task is the first payload.
- **C4.8**'s dominance property is generic: the controller is the UNIQUE dominator of unit mutation.

**Acceptance test of the DRY claim (state it as an AC):** adding a NEW class policy or a NEW view format must require **registration only — zero changes to the controller, the event, or the pipeline.** If format N+1 needs plumbing edits, it is not DRY and the design has failed its own law.
