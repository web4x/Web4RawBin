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

- [ ] **(functional)** A SCRIPTED deploy exists: one command does pull + build + VERIFY served==committed==SW==HEAD, replacing the manual Ctrl-C + npm start. After it runs, the prod-serving process is running the JUST-committed build (no stale old-build lag). If any of served/committed/SW/HEAD disagree, the script FAILS LOUD (does not silently serve stale).
- [ ] **(invariant)** A STANDING served!=committed MONITOR runs continuously (the R31.7 agreement invariant as a LIVE ALERT): if the served version/hash ever diverges from committed==HEAD (i.e. a push happened but the serve didn't reload), it ALERTS IMMEDIATELY - the lag is visible at once, not found later via a stale page. Testable: inject a skew (commit without redeploy) -> the monitor fires.
- [ ] **(invariant)** Prod topology is PINNED: exactly ONE prod-serving checkout and exactly ONE restart-driver (architect). The expert commits to a CLONE and does NOT deploy - no ambiguity about which checkout serves or who restarts. Prevents the 'someone else's checkout served an old/other build' class of lag/confusion.
- [ ] **(meta)** BUILD-AUTHORIZED (2026-08-10) under Tron's standing campaign directive (finish S30++ tasks -> QA); chain minted scenario-first before the expert lands scripts/deploy.mjs. (Was NEXT/NOT-NOW.)
- [ ] **(invariant)** INV-D1: gate-by-construction — there is NO exit-0 path that ships without the post-deploy device-gate having run GREEN. This is the property that UN-BLOCKS R40.25's AC-8 (the gate stops being skippable). Enforced BOTH ways: a behavioural META-BITE (a normal deploy CANNOT complete un-gated — covers existing paths) AND a STATIC LINT (every exit-0 downstream of the gate — prevents future ones); the lint carries two bites: plant-a-bypass -> RED, and lint-itself-runs -> RED (non-vacuous).
- [ ] **(invariant)** INV-D2: NO skip/bypass flag EVER. There is no --force / --skip-gate / env override. Shipping un-gated is only ever RECORDED as served-but-UNVERIFIED (R40.25), never silenceable. (Prohibition written into the requirement so a future agent does not add a bypass.)
- [ ] **(invariant)** INV-D3: atomic + fail-loud — the deploy never half-completes; on any step failure it fails LOUD and leaves the previous live state intact, never a partial/broken serve.
- [ ] **(invariant)** INV-D4: exactly ONE deploy path when done — no divergent manual vs scripted routes; the scripted path is THE path.
- [ ] **(invariant)** INV-D5: dry-run FIRST, and the EXISTING restart path stays available until the scripted deploy has succeeded >=1 time live (safe cutover, no big-bang).
- [ ] **(invariant)** INV-D6: served==committed comparison RIDES R30.28 (b6946e59.assertVersionAtHead) — NOT a second copy. Distinct intent: R30.28 is the ship-time GUARANTEE; R31.14 is orchestration + drift MONITOR + pinned topology.
- [ ] **(invariant/net-new (PO))** What is SERVED must have been VERIFIED. Deploying an UNVERIFIED fix onto prod is a DEFECT, not merely 'recorded as unverified' — 0.8.180 was an unverified fix shipped onto a working-with-a-hole prod and made it STRICTLY WORSE. BOTH DIRECTIONS ARE DEFECTS: committed-but-not-served AND served-but-not-verified. Strengthens R40.25/INV-D2 from 'record served-but-unverified' to 'a deploy whose device-gate has not run GREEN is REFUSED, fail-loud' (the un-verified path does not reach prod).
- [ ] **(coverage/fold-R40.76)** The served==committed guard covers BOTH halves — the SERVER version AND the CLIENT loaded-bundle marker: a source-only client commit does NOT ship until dist is rebuilt AND served, and the guard MEASURES the served client bundle marker independently of the server version. Folds R40.76 (client-half coverage gap) in as NOW-SCHEDULED, not deferred — instance E1 (4-round hunt) is precisely this gap biting.
- [ ] **(evidence/like-R31.7-R40.91)** The guard/monitor output CARRIES the MEASURED values — served version, committed version (HEAD), and the client loaded-bundle marker — as evidence, NOT a bare pass/fail (same evidence-not-boolean discipline as R31.7 single-source version + R40.91 measured guard). A user/agent can read the three numbers and see the skew directly.
- [ ] **(meta/satisfaction-fail-closed (R40.54))** An AUTHORIZED-BUT-UNBUILT invariant is INDISTINGUISHABLE FROM NO INVARIANT (PO finding: R31.14 build-authorized 2026-08-10, never activated, so today's 4 committed-not-served fixes went uncaught). This requirement is NOT satisfied until the monitor/gate is OBSERVABLY RUNNING (heartbeat + CI asserts liveness), never merely 'authorized' or 'built'. Same satisfaction-fail-closed discipline as R40.54; same meta-pattern as committed-but-not-served (a thing that exists but does not RUN is not shipped).

## Subtasks

None (atomic task).
