<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.45: Live-on-advance = BOTH halves (sanctioned se

[task:uuid:257b54f0-7dd8-4cc3-8ad4-99aeac6a4d36]

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

Deliver + verify requirement R40.45 (Live-on-advance = BOTH halves (sanctioned se). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.45; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(path-half)** (i) Agent status/checklist writes route THROUGH the seam via a UDS/skill endpoint IN THE RUNNING SERVER process -> UnitController.apply -> emit -> live. An agent tick reaches the running server (NOT a CLI), so the WS broadcast reaches connected clients (the emit's target is the live transport).
- [ ] **(gate-half)** (ii) A GATE flags an out-of-seam task-status file-edit (mutation-seam-lint / status-drift family) so a file-edit BYPASS is DETECTABLE, never silent-stale. NEITHER HALF ALONE WORKS: the path enables live; the gate makes a bypass visible.
- [ ] **(rejection)** REJECTED by-construction: NO server fs.watch bridge to re-emit on disk changes — a 2nd emit source = the two-source disease + race hazards. Emit stays SINGLE-SOURCE (the seam). Record the rejection so it is not re-proposed.
- [ ] **(scope)** FAMILY = ALL task-status writes AND ALL live views, not just the pin (the MVC generalization over R37.11 controller + R37.12 view-bus). Any agent/human status advance through the sanctioned path emits live to every subscribed view.
- [ ] **(doctrine)** Grounds the liveness law (req-discovered): 'the data is correct' is NOT 'the user saw it move'. A mutation emits LIVE only through the process holding the client connection (the running server); a CLI tick (publish=noop) persists data but broadcasts nothing. This req is what makes an AGENT tick actually live rather than reload-only.
- [ ] **(verify)** Verify: an agent tick via the endpoint appears LIVE (no reload) on a connected client @390; an out-of-seam file-edit is flagged RED by the gate; no fs.watch emit path exists.
- [ ] **(verify)** [DECLINE-REASON, Tron 2026-08-18 realtime-MVC approve-flow; TRON-ORDERED FIX-IT-NOW 2026-08-18 (no longer capture-only — expert+architect building)] On APPROVE (and any status advance) the view updates LIVE across ALL surfaces — the TREE ROW and the BOARD, not only the detail panel — with NO manual Refresh. DEFECT OBSERVED: T37.27's genuine Tron approve updated the detail panel but the tree row did NOT update (partial-live reads as stale exactly where Tron is looking). The emit must reach EVERY subscribed surface (the concrete instance of AC-family-all-writes); a view live on some surfaces but not others is not live. @390 real-device.

## Subtasks
