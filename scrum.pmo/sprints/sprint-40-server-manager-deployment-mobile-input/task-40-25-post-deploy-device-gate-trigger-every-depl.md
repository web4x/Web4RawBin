<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.25: Post-deploy device-gate trigger — every depl

[task:uuid:efef7f6a-d97a-469a-876c-156e121ad8bb]

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

Deliver + verify requirement R40.25 (Post-deploy device-gate trigger — every depl). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.25; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(reuse-lane)** A post-deploy step invokes the EXISTING gate:device:live lane against LIVE prod automatically after restart + served==committed. No new gate machinery — it wires the trigger, not a parallel gate.
- [ ] **(not-done-until-green)** A deploy is NOT verified/done until the gate is GREEN (non-zero exit on RED). 'Served-but-gate-RED' is an explicit UN-VERIFIED state, not done.
- [ ] **(versioned-record)** Results land as a VERSION-STAMPED device-gate unit (GREEN/RED/NOT-RUN + evidence + the gated Test uuids) exposed at /api/gate-status — durable + queryable, NOT a log line.
- [ ] **(notrun-equals-red)** NOT-RUN == FAILURE == RED (unavailable / timeout / errored-before-asserting) — NEVER a silent pass. Rationale: S23 died because its gate NEVER RAN; absence of a result must read as failure.
- [ ] **(no-bypass-ever)** NO skip/bypass flag EVER. Shipping un-gated is allowed but is RECORDED as served-but-UNVERIFIED and can NEVER be silenced/marked-verified. (This prohibition is part of the requirement so a future agent reading it does not add a bypass.)
- [ ] **(tron-visible)** Gate-status is VISIBLE TO TRON (owner-gated UI) answering: is what is currently SERVED verified on-device, and at WHICH version?
- [ ] **(meta-bite)** A META-BITE on the trigger ITSELF: trigger-fires / unavailable->NOT-RUN-RED / RED-blocks-done / S23-regression-replay — a trigger that silently no-ops is the same disease one level up, so its own fail-ability is proven. ★ META-BITE #1 (a NORMAL deploy CANNOT complete without the gate having run) is EXPECTED-RED until the scripted-deploy (R31.14) exists — the FAILING bite is the HONEST signal that the mechanism is not yet by-construction; it must NOT be softened/skipped to make the mechanism look green.
- [ ] **(blocking-dependency)** ★ BLOCKING DEPENDENCY (not a footnote): R40.25 may NOT reach QA-Review while the gate remains SKIPPABLE. Until the BY-CONSTRUCTION scripted-deploy invocation exists (R31.14 deploy-hardening — the gate runs automatically as a deploy STEP, never by an agent remembering to run it), R40.25 is MECHANISM-ONLY / decorative. A gate an agent must remember to run has reliability equal to that agent's memory — exactly how S23's gate never ran.

## Subtasks
