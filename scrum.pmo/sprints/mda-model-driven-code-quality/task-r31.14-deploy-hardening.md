<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-R31.14: Deploy-hardening — scripted deploy + served!=committed monitor + pinned prod topology (S32 backlog, scheduled AFTER R32.5)

[task:uuid:03f5d536-e76f-42a9-a7a8-f2279433db5d]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

SCHEDULED AFTER R32.5 (go-live milestone) per PO — NOT dispatched now. Route when scheduled: architect designs deploy-script + monitor + pinned-topology → expert implements (on a clone, does not deploy) → tester gates (push → scripted deploy → served==committed within N s; monitor fires on injected skew) → chain mints onto the built fix.

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R31.14 `[requirement:uuid:167ef4a5-abf3-429f-8f4e-e7def91b657a]` (re-homed S31→S32, team-discovery)
  - down
    - None (atomic task)

## Task Description

The recurring PUSH-vs-SERVE deploy lag: a commit is pushed but the prod-serving process keeps running the OLD build until a MANUAL Ctrl-C + npm start — served != committed until someone notices. Operational complement to the R31.7/R31.13 clean-deploy pair (clean ARTIFACT) — R31.14 = the DEPLOY actually SERVES that artifact. Three parts: (a) SCRIPTED deploy (pull+build+VERIFY served==committed==SW==HEAD, no manual restart); (b) STANDING served!=committed MONITOR (R31.7 invariant as a live alert); (c) PINNED prod TOPOLOGY (exactly ONE prod checkout + ONE restart-driver=architect; expert commits to a CLONE, does NOT deploy).

## Context

2nd-occurrence of the push-vs-serve lag → it gets a proper task. Skew mitigated meanwhile (PO measures /api/config each ship + architect verifies served==committed each deploy); the served!=committed auto-monitor makes it correct-by-construction.

## Intention

Architect-flagged runbook gap (team-discovery, NOT a Tron quote). Re-homed S31(closed)→S32(active) per PO (req commit 4ee8cc22d); altId stays R31.14 — honest provenance: gap found in S31, builds in S32.

## Acceptance Criteria

- [ ] AC-scripted-deploy: A SCRIPTED deploy exists — one command does pull + build + VERIFY served==committed==SW==HEAD, replacing manual Ctrl-C + npm start; if any of served/committed/SW/HEAD disagree it FAILS LOUD (no silent stale serve).
- [ ] AC-served-vs-committed-monitor: A STANDING served!=committed MONITOR runs continuously (R31.7 invariant as a LIVE ALERT); if served version/hash diverges from committed==HEAD it ALERTS IMMEDIATELY. Testable: inject a skew (commit without redeploy) → monitor fires.
- [ ] AC-pinned-topology: Prod topology is PINNED — exactly ONE prod-serving checkout + exactly ONE restart-driver (architect); expert commits to a CLONE and does NOT deploy (no ambiguity about which checkout serves / who restarts).
- [ ] AC-scheduled-next: Captured scenario-first, SCHEDULED NEXT/NOT-NOW — NOT dispatched for build until AFTER R32.5 go-live (PO schedules); the chain (UC→Class→Method→Impl→Test) mints onto the built fix when scheduled.

## Subtasks

None (atomic task).
