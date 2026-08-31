<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.70: Add-folder/add-diagram is MVC-live in the tree + cross-client broadcast — a SECOND PASSIVE client re-renders from the broadcast ALONE (no reload)

[task:uuid:800fa79d-a280-4d22-89e2-10b4da10f655]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

R40.70 (542946c4, Tron verbatim). When a user adds a folder OR a diagram (under a diagram), the create must (1) CREATE the unit, (2) MVC-LIVE add it to the TREE VIEW with NO reload, and (3) BROADCAST a cross-client ws event on the ONE bus (R37.12 ViewBus/UNIT_CHANGED) so EVERY connected client re-renders — not just the acting one. ★ THE HARD PROPERTY (AC-c, the one our gates keep missing): proof is a SECOND, PASSIVE client re-rendering from the BROADCAST ALONE — the ACTING client updating ITSELF locally is INADMISSIBLE, and a local-emit-only build MUST make the two-client gate RED (required RED stub). RANKS WITH / LIKELY SAME ROOT AS the open live-MVC failure Tron reported (current-task change: data changed but view only updated after RELOAD, next slot unchanged, gate GREEN / device NO) — same one-view-bus family (R37.12 + R40.57 cross-view agreement). PLAN-first per Tron 'plan it'; expert builds on the one-bus broadcast path, tester gates with TWO real clients @390.

## Context

Covers R40.70 (542946c4) via UC f9572bd8 (treeAdd.liveBroadcastEveryClient). Same one-view-bus root as R37.12 (ViewBus/UNIT_CHANGED) + R40.57 (cross-view agreement, consumer-vs-consumer). The admissible proof = the two-real-clients passive-rerender gate + the required local-emit-RED stub; a local/self emit is NOT proof.

## Intention

Tron verbatim ('mvc live adds it to the tree view and casts it as cross client ws event so all clients rerender') — his last specified requirement had no task. Covering task (#126) for R40.70; the live-MVC/one-bus family, ranked with the current-task reload-only failure.

## Acceptance Criteria

- [ ] add-folder AND add-diagram (under a diagram) CREATE the unit AND the TREE VIEW shows it LIVE with NO reload — both actions, both surfaces, no page refresh. (stub-must-fail: create requires a reload to show -> RED)
- [ ] The create is BROADCAST as a CROSS-CLIENT ws event on the ONE bus (R37.12 ViewBus/UNIT_CHANGED), NOT a local-only DOM insert on the acting client. (stub-must-fail: local-only insert, no ws broadcast -> RED)
- [ ] ★ HARD PROPERTY: EVERY connected client re-renders — proven by a SECOND, PASSIVE client re-rendering the new node from the BROADCAST ALONE. Acting-client-self-update is INADMISSIBLE as proof. GATE: with TWO real clients, client-A adds the folder/diagram and client-B (took NO action, no reload) shows the new node from the ws broadcast. REQUIRED RED STUB: a local-emit-only build (acting client updates, no real cross-client broadcast) -> the two-client gate goes RED (passive client shows nothing).
- [ ] Asserted on TRON'S surface @390, POST-BROADCAST on the passive client (never on initial load — an initial-load check false-passes; the defect is only visible after a LIVE add on a second client). The post-broadcast/second-client/no-reload state IS part of the assertion.

## Subtasks

None (atomic task; architect may split at design).
