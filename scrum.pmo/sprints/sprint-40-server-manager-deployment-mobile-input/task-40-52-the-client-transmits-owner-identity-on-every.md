<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.52: The client transmits owner identity on every

[task:uuid:f2b24cdb-c418-4c2e-8d0d-cbe69fbf38b9]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.52 (The client transmits owner identity on every). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.52; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(by-construction)** ONE SHARED, DEDICATED ownerActionFetch(url,opts) helper (owner-actions-ONLY, NOT a blanket fetch wrapper - the owner identity header is attached ONLY to owner actions, never leaked onto non-owner requests) merges headers[x-player-token] = RawBinClient.playerToken, and ALL 4 owner actions route through it - the 4 raw same-origin fetches in universal-actions.ts (make-current :138, designate :171, approve/decline ~:99) are REPLACED. NOT per-button: a per-call-site patch regresses the moment someone adds a button, so identity is attached at ONE shared choke point. Uses the token the client already holds (RawBinClient.playerToken), not a scratch-minted cookie.
- [ ] **(by-construction)** Reuses the EXISTING R40.45 server recognition path (ServerManagerGuard.playerTokenFrom -> resolveOwner branch-3 -> owner 05e58f81); server ALREADY accepts x-player-token so NO server change; the send-pattern is the proven precedent at server.ts:1130 (SM page shell). NO new trust surface, no new endpoint, no second identity mechanism.
- [ ] **(acceptance/real-path)** Acceptance MUST traverse the REAL USER PATH: a real page @390 headed/xvfb WebKit, NO manual/harness-minted cookie, an owner action returns 200 driven by the client own RawBinClient.playerToken - AND a non-owner token still 403s (fail-closed intact). Construction / local-emit / harness-session proofs are INADMISSIBLE.
- [ ] **(by-construction/reject)** A manual-cookie or harness-minted-session workaround is EXPLICITLY REJECTED as a solution - it proves the endpoint, not the feature. The UI itself must transmit the identity.
- [ ] **(evidence/certification-scope)** A harness-granted capability the PRODUCT lacks scopes any green to the ENDPOINT, never the FEATURE. The tester earlier got true-but-useless 200s because the harness minted a session NO UI can mint; a Test whose precondition is a harness-only capability must be certified as ENDPOINT-proven, FEATURE-unproven (stub-must-fail: a FEATURE-green claimed on a harness-minted session => RED).

## Subtasks
