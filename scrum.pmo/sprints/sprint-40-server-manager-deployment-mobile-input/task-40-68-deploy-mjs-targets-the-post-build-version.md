<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.68: deploy.mjs targets the POST-BUILD version — 

[task:uuid:9e047912-03ed-4a86-8323-96f4ac0a1c5b]

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

Deliver + verify requirement R40.68 (deploy.mjs targets the POST-BUILD version — ). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.68; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(fix/read-order)** deploy.mjs reads the target version AFTER the build stamps package.json (or directly from the Config unit), NEVER once-at-start-before-build. A CONFIG-UNIT-ONLY bump (no pre-build) => deploy.mjs targets the CORRECT post-build version. The single-read-before-build is a stale-by-construction proxy.
- [ ] **(by-construction/gate-runs)** The served==committed POLL targets the POST-BUILD version, so a successful deploy does NOT false-abort; the un-skippable device-gate step 5 ALWAYS runs (INV-PDG-5 holds by construction). This closes the served-but-UNGATED hole: today a stale poll-target false-aborts a SUCCESSFUL deploy and the gate never runs. + a BITE: poll-target == post-build version.
- [ ] **(RED-baseline/evidence)** RED-BASELINE on the live specimen: the v0.8.140 deploy (commit 098880909 stamps v0.8.139 while artifacts are v0.8.140; poll false-aborted; gate did NOT run) is the pre-fix RED evidence. The gate/test must be PROVEN RED on this stale-read case BEFORE the fix; then the read-order fix flips it GREEN (post-build target + gate runs). A gate that cannot RED on this shipped mis-deploy is the wrong gate.
- [ ] **(sweep/class-not-instance)** ★ SWEEP (PO, class-not-instance): HOW MANY PAST DEPLOYS went out SERVED-but-UNGATED? The abort is DETERMINISTIC given a config-unit-only bump before deploy.mjs, so this is ANSWERABLE FROM git HISTORY, not guesswork (scan deploy commits where the stamped version != the actual artifacts version / where step-5 did not run). SCOPE = a QUESTION TO ANSWER (measure the historical count), NOT work-to-do-now. Fixing v0.8.140 while an unknown number of prior deploys never ran their device gate = fixing the INSTANCE and leaving the CLASS. When you find one instance, the first question is how many others.

## Subtasks
