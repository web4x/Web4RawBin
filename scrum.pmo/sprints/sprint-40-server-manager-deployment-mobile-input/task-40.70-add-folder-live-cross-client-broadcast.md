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

- [ ] **(live/create)** add-folder AND add-diagram (under a diagram) CREATE the unit AND the TREE VIEW shows it LIVE, with NO reload. Both actions, both surfaces (folder + diagram). The new node appears in the tree without a page refresh.
- [ ] **(live/broadcast)** The create is BROADCAST as a CROSS-CLIENT ws event (one bus, the R37.12 ViewBus/UNIT_CHANGED path) — not a local-only DOM insert on the acting client.
- [ ] **(live/EVERY-client-HARD)** ★ THE HARD PROPERTY (PO, the one our gates keep missing): EVERY connected client re-renders — proven by a SECOND, PASSIVE client updating from the BROADCAST ALONE. The ACTING client updating ITSELF locally is INADMISSIBLE as proof (a local emit passes a naive gate while a second client never gets it — exactly the live-MVC failure Tron saw). The gate MUST assert: with TWO real clients connected, client-A adds the folder/diagram and client-B (which took NO action) shows the new node from the ws broadcast — no reload, no local action on B. No gate may pass on a local/self emit.
- [ ] **(live/device)** Asserted on TRON'S surface @390, POST-BROADCAST (after the live event on the passive client), NEVER on initial load. An initial-load check would false-pass (the node is there on fetch); the defect is only visible after a LIVE add on a second client. The state-under-test (post-broadcast, second client, no reload) IS part of the assertion.
- [ ] **(T37.21-part2-user-visible@390)** TRON RULED 2026-09-01 — BOTH: the Add-folder action MINTS the folder scenario-UNIT **AND** CREATES the actual filesystem DIRECTORY (model and filesystem stay in step). Part 2 = FOUR checkable assertions: (a) the persisted UNIT exists; (b) a REAL DIRECTORY exists on disk (mkdir); (c) live-MVC tree update with NO reload [browser 1] (= AC-create-and-live-tree-no-reload); (d) a SECOND browser updates over WS [= AC-broadcast + AC-second-passive-client]. reload-to-see = FAIL; single-browser-only = FAIL. FAIL-CLEAN: if the dir already exists, the name is invalid, or mkdir succeeds but the mint fails, it must fail cleanly and leave NOTHING behind (a half-created folder is worse than a failed one). @390 screenshot-checkable: after Add-folder, BOTH the unit and a real directory exist + tree updates live + 2nd browser updates. stub-must-fail: unit-without-directory OR directory-without-unit => RED.

## Subtasks

None (atomic task; architect may split at design).
