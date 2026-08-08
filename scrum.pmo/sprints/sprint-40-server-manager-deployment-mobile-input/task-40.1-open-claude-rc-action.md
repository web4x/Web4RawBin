<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.1: Action — Open Claude.ai RC (per-pane/agent deep link to the selected agent's remote-control session)

[task:uuid:7a956c21-5f37-4062-b921-9bdd5a461546]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.1 (Open Claude.ai RC action, per-pane deep link claude.ai/code/<session-id>). ACs MIRRORED from req R40.1 caab6d86 (requirements.md 9af2aa9f7); coveredRequirements resolves. In Progress: build-go GIVEN (PO); architect R40.1 design committed c01c9a23a (measured RC id-source + chain shape); req minting chain, expert building. Task.useCases wire from req's chain mint (UC 350ab353).

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.1 `[requirement:uuid:caab6d86-35b8-4865-acf4-d4210670e775]`
  - down
    - None (atomic task)

## Task Description

R40.1 (Tron-authorized S40). An ACTION that opens the Claude app or web page at the AGENT's RC (remote-control) session for the SELECTED pane. Per-pane/per-agent DEEP LINK: Claude Code sessions are addressable as claude.ai/code/<session-id>, so selecting robbinTeam2:0.0 and firing the action lands on THAT agent's RC session. Fits the selection-driven action bar (per-selection action). Reuse the existing action-bar + session-id addressing, NO fork. Scenario-first: req mints R40.1 (caab6d86) + ACs; architect designs the chain; expert implements; tester gates @390.

## Acceptance Criteria

- [ ] (visible-fireable) The action is visible AND fireable from the pane surface (the pane's own action affordance).
- [ ] (resolve-chain) Firing resolves the SELECTED pane -> its agent -> its session id -> the RC deep link (claude.ai/code/<session-id>).
- [ ] (app-else-web) Opens the Claude app if available, else the web page (app-if-available-else-web).
- [ ] (right-agent) Opens the RIGHT agent's RC: firing on pane 0.1 must NOT open 0.0's RC (per-pane isolation, no cross-pane leak).
- [ ] (device-gate) Verified @390 mobile REAL-WebKit: the action fires and opens the correct per-pane deep link.

## Subtasks

None (atomic task).
