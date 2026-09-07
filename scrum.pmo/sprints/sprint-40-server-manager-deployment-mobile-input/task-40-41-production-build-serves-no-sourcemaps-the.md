<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.41: Production build serves NO sourcemaps — the 

[task:uuid:0dc65cc2-3c05-4beb-8387-b441e9399ac0]

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

Deliver + verify requirement R40.41 (Production build serves NO sourcemaps — the ). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.41; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** The prod boot build (start.mjs step-4) runs in PRODUCTION mode: NO sourcemaps emitted, OR emitted-but-NOT-SERVED / access-controlled (architect picks the shape). Prod stops shipping .map on the public served surface.
- [ ] **(gate)** A GATE asserts NO .map is REACHABLE on the served surface (fetch the served /dist and assert no .map resolves), with STUB-MUST-FAIL: plant a served .map -> assert RED. Served-surface, not build-dir — it is about what prod EXPOSES.
- [ ] **(functional)** KEEP the deterministic pinned-esbuild property AND the on-every-boot rebuild — do NOT trade determinism (served==committed==build reproducibility) away for this. Production-mode is added, determinism is preserved.
- [ ] **(functional)** WHY (recorded): shipped sourcemaps DISCLOSE source structure; this carries MORE WEIGHT in a codebase that has already had a credential exposure (R40.21/R40.22). Disclosure-reduction, not a cosmetic build cleanup.

## Subtasks
