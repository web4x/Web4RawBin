# PRE-REGISTERED prediction — pin self-unstick "next" (robbin-planner, 2026-08-20)

Per PO (Tron directive #86). **Read-only audit + a prediction committed BEFORE the code exists**, so when the expert's fix ships we compare the pin's actual self-unstick against this. If they differ, we know immediately whether the DATA or the IMPLEMENTATION is wrong (same pre-registration discipline that made the badge verdict trustworthy). **NO flips, NO data corrections** — bad/absent data is REPORTED here, not fixed (correcting silently would change the demo outcome and destroy the comparison). Method: `scratchpad/buildorder-audit.mjs` (read-only, deterministic git-diff-style scan).

The adopted rule (PO-ratified): **next = first task in the current sprint by `(buildOrder asc, taskNumber asc)` whose derived status `< QA-Review` AND whose predecessors are all `>= QA-Review`; workable excludes QA-Review/Done; empty-in-sprint → sprint-number order.** The pin's current sprint = **Sprint 37** (currentTaskUuid `5acdcc4c` = T37.24, S37).

## (a) COVERAGE
- **Sprint 37: buildOrder present on 0/19 tasks (ENTIRELY ABSENT). taskNumber parseable 19/19.**
- **Sprint 40: buildOrder present on 0/16 tasks (ENTIRELY ABSENT). taskNumber parseable 16/16.**
- Graph-wide only 16 task units carry `buildOrder` at all — none in S37/S40.
- **Implication:** the rule's primary key is a no-op here; ordering is 100% name-parsed `taskNumber`. We are implicitly trusting `taskNumber order == build/dependency order`. Where they would differ, there is no explicit `buildOrder` to override — a latent risk, not a today-error.

## (b) INTEGRITY
- No duplicate taskNumbers (S37, S40). No duplicate buildOrders (n/a — none exist). No buildOrder-vs-taskNumber contradictions (n/a).
- Numbering is SPARSE (S37: 37.1-8, then 37.20-27, plus subtasks 37.4.1/2/3; S40: 40.1-12, 40.17/18/28/37). Gaps are expected (not every number used) and the rule handles them fine — **not** an integrity defect.

## (c) PREDECESSOR EVALUABILITY
- No explicit `dependsOn`/`predecessor` field on tasks → "predecessors" must be defined as **all lower-ordered tasks in the same sprint** (by taskNumber here). Evaluable for every task.
- ⚠ **COORDINATION-ROOT DEFECT (the load-bearing finding):** `Task 37.4` (`79fd2164`) is the MVC **coordination ROOT** (subtasks 37.4.1/2/3, all QA-Review). Its stored status is **Planned** (rollup-vestigial — a root's status should roll up from its subtasks, but does not today). So the rule sees 37.4 as workable (Planned) with predecessors 37.1-3 all QA-Review ⇒ **it SELECTS the coordination root as current.** A coordination root is not a leaf to "work on" — this is the same false-positive class I flagged in the understatement sweep (2026-08-18).

## PRE-REGISTERED PREDICTION — Sprint 37 (the pin's current sprint)

Ordered (taskNumber, since buildOrder absent) with derived status:
`37.1 QA · 37.2 QA · 37.3 QA · 37.4 Planned · 37.4.1 QA · 37.4.2 QA · 37.4.3 QA · 37.5 QA · 37.6 QA · 37.7 QA · 37.8 QA · 37.20 Planned · 37.21 Planned · 37.22 Planned · 37.23 Planned · 37.24 QA · 37.25 In-Progress · 37.26 QA · 37.27 Done`

Workable (`< QA-Review`) = 6: **37.4** (Planned, ROOT), 37.20, 37.21, 37.22, 37.23 (Planned), 37.25 (In-Progress).

- **RULE AS SPECIFIED (no root handling) → NEW CURRENT = `37.4` (79fd2164, Planned, coordination ROOT); NEXT = `37.20` (ae01f065, Planned).**
- **RULE WITH ROOT-EXCLUSION (or rollup status on roots) → NEW CURRENT = `37.20` (ae01f065, first workable LEAF); NEXT = `37.21` (1bf4acc5).**

**⇒ ACCEPTANCE-DEMO COMPARISON:** when the fix ships and the pin self-unsticks:
- unsticks to **37.4** → the rule/impl did NOT handle coordination-roots (needs root-exclusion or rollup-status) — data+rule gap, not the two-writer fix.
- unsticks to **37.20** → coordination-roots handled correctly; the intended outcome.
- unsticks to anything else → investigate (data drift since this pre-registration, or an impl bug).

## Reference — Sprint 40 (not the current sprint)
Workable = 1 (`40.37` Planned, leaf). Predicted NEW CURRENT = `40.37` (2e831ffd); NEXT = NONE (sprint otherwise all QA-Review → hands to sprint-number order). Clean, no coordination-root ambiguity.

## Recommended (NOT done — reported per PO)
1. The rule needs an explicit **coordination-root clause**: a task with subtasks is NOT independently workable; its status rolls up from subtasks (ties into invariant (e) "status DERIVED"). Without it the pin unsticks to 37.4.
2. buildOrder being absent is acceptable IF taskNumber == build order is validated per sprint; otherwise buildOrder must be populated (a separate visible fix with its own result, NOT a silent correction now).

---

## THREE OBSERVABLE PROOFS — consolidated demo acceptance (all PRE-REGISTERED before the code; PO 2026-08-20)

The #86 pin/CR fix ships with THREE live, pre-committed oracles. HOLD all inputs as-is (pin, 37.4 status, buildOrder, T40.1 checklist) — hand-correcting any of them destroys the proof it backs.

- **(i) PIN SELF-UNSTICK → `37.20`, not `37.4`.** With the current sprint (S37) both current candidates already QA-Review, the derived-next rule + rollup-parent status must land the pin on **37.20** (first workable LEAF). Unstick to **37.4** ⇒ coordination-root rollup NOT applied (rule/impl gap). [oracle detail above.]
- **(ii) T40.1 DERIVES TO TRON'S OWN SKETCH.** T40.1 (`7a956c21`) today = QA-Review `[x]` while carrying 5 OPEN CRs. Post-build, its DERIVED checklist must match the shape **Tron drew in the #86 directive** (per PO relay):
  ```
  - [x] Planned
  - [x] In Progress
    - [x] refinement
    - [ ] creating test cases
    - [ ] implementing
    - [ ] testing
  - [ ] QA Review
    - [ ] processing change requests
  - [ ] Done
  ```
  Acceptance = the DERIVED state matches the picture Tron drew (not our interpretation of his words). Any hand-correction of T40.1's checklist before the build voids this oracle.
- **(iii) BOTH HAPPEN IN THE GUI IN REALTIME, NO RELOAD.** Pin re-render + T40.1 badge/checklist re-render must occur IN-PLACE via the ONE VIEW BUS (`ViewBus.notify(viewBusKey({type,uuid}))`, v0.8.116 live-bridge) — the same live-MVC standard already proven for controls + detail + badge. A reload does not satisfy Tron.

Post-build planner lane: board regen → verify DERIVED render (do not hand-shape it) → re-run reverse-wire + checklist-chain audits → compare actual vs (i) and (ii). 0 Done till Tron.
