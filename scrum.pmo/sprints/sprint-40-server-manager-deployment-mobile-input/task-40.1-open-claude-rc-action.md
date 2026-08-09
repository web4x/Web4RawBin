<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.1: Action — Open Claude.ai RC (per-pane/agent deep link to the selected agent's remote-control session)

[task:uuid:7a956c21-5f37-4062-b921-9bdd5a461546]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

QA-Review: R40.1 CHAIN-COMPLETE-TO-TEST (planner disk-verified) — Impl 45853b02 RcLinkResolver.resolveRcLink (OWN chain, markerPending=false, STRICT-AST verified rc-link-resolver.ts:14, fail-closed: bash-pane->NO LINK no synthesised URL) + Test c4f8a1d6 status=pass. PROVEN = 403-by-construction + fail-closed. All 4 In-Progress sub-steps [x]. ★ CERT-SCOPE PENDING (Tron owner-device QA): owner-page ACs = RC button VISIBLE+FIREABLE + pane->agent ISOLATION e2e (right-agent, no cross-pane leak) — NOT automatably proven (owner-page-gated). Done-gate [ ] — NOT Done w/o Tron sign-off (tron-qa-batch 6-check).

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
