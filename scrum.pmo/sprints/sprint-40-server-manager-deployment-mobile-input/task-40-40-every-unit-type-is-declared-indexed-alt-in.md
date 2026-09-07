<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.40: Every unit type is DECLARED indexed / alt-in

[task:uuid:755a7be4-9f61-410b-8733-68d9181b2802]

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

Deliver + verify requirement R40.40 (Every unit type is DECLARED indexed / alt-in). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.40; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** Every ior:class unit type IN USE is DECLARED in a registry as EXACTLY ONE of: type-indexed (scenario/sprints.md/<type>/ ln folder), alt-indexed (scenario/alt/<type>/ by-value), or singleton — DECLARED, never DEFAULTED. NO type resolves by a corpus-scan-because-unclassified.
- [ ] **(functional)** A NEW unit type CANNOT be introduced without an index/alt/singleton declaration — by construction: the loader/resolver REFUSES an undeclared type (fail-loud) rather than silently falling back to a corpus scan. Adding a type = adding its declaration, or it does not load.
- [ ] **(gate)** A GATE FAILS if ANY ior:class type in use lacks a declaration (index OR alt OR singleton), with STUB-MUST-FAIL: introduce an undeclared type (or drop a declaration) -> assert RED. Closes the class by construction, so the next missing index is caught at the gate, not the next incident.
- [ ] **(functional)** The 11 currently-unindexed types are CLASSIFIED + resolved: GENUINE (Feature, TestCase -> type-index per R40.39); ALT-INDEXED (Company/Email/Phone -> declare, verified scenario/alt/); SINGLETON (Config -> declare); and Profile/WebItem/Gate/ModelElement/Relationship classified genuine-vs-intentional by architect ruling. No type left in the default-corpus-scan bucket.

## Subtasks
