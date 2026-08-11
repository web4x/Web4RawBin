# C4 / R-C4 — THE ISSUE: progress is never recorded at the moment it happens

**Origin:** Tron looked at Task C2 on his device and said *"full refinement has happened but is not reflected in the task."* He was right. This document is the analysis behind it, to be folded into **R-C4 / T-C4 (Objects self-heal — validate on init/read, never run silently drifted)**, which is the existing requirement that covers this work.

## The defect, precisely

A task's status is DERIVED from its checklist. Agents did the work, built and credited the traceability chain, and shipped the implementation — but **nobody ever ticked the checklist**. So the status derived to `Planned` while the chain had reached a shipped Impl. The board returned a **silently-drifted value**, which is exactly what R-C4 forbids.

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

## ACCEPTANCE CRITERIA to fold into R-C4

- [ ] (functional) A **single advance entry point** (`statusNext`) moves a task to the next LEGAL state via the existing TRANSITIONS table — not six separate calls.
- [ ] (functional) It **PERSISTS** the scenario unit (via the `ScenarioIndex.put` path; coordinate with the class-guard work — this is a legitimate committed-class writer).
- [ ] (functional) It triggers the generated **VIEWS to re-render**, so the board cannot go stale the way C2's did.
- [ ] (functional) It **NOTIFIES the agents** (the FSM has no notification today).
- [ ] (functional) Status stays **DERIVED**: `statusNext` ticks the CHECKLIST and lets `deriveStatusEnum` produce the status — it NEVER hand-sets the enum.
- [ ] (functional) **EVIDENCE-PRECONDITION**: it must REFUSE to advance past a step whose evidence is absent. A box ticked without evidence corrupts the exact signal Tron steers QA by.
- [ ] (functional) **SINGLE-SOURCE with R40.10 approve**: the req must state which mechanism owns the `Done` transition; the other delegates. No second writer.
- [ ] (functional) Objects **validate on init/read** — recompute to reality or REFUSE; never return a silently-drifted value (R-C4's original AC, now with a measured instance behind it).
- [ ] (gate) STUB-MUST-FAIL: break the advance/derive path and the gate must go RED. Name the FAMILY: **under-recorded-progress**.
- [ ] (gate) Evidence-precondition bite: attempt to advance a step with absent evidence → MUST refuse.

## The audit half already shipped (do not duplicate it)

`scripts/checklist-chain-audit.mjs` (8f42e13e8) is **registered in ci:gates** (16 gates; `check:task-status` intact). It compares **checklist-vs-CHAIN** — the pair the old status-vs-checklist detector structurally could not see (stored == derived == 0 drift while the chain had shipped). Coverage counts **only on a real chain-edge** (two-keyed `Impl.tests[]` ↔ `Test.implementations[]`, status pass); a prose mention or cross-credit never counts, and that rule is bite-guarded.

Board-wide scan of **511 tasks**: **FAIL = 0** (C2/C6 read green because they were RECONCILED, *not* because they were born clean — the class is real and recurs), **WARN = 35** awaiting per-task verify-owner-first triage.

⇒ **Detector = AUDIT (catches the lag). `statusNext` = PREVENTION (records progress at the moment it happens).** They are complementary; the detector remains the backstop for historical debt and any bypass.
