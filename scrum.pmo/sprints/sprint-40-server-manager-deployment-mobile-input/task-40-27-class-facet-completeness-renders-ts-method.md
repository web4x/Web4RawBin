<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.27: Class facet completeness: renders TS method 

[task:uuid:9b91d0bf-0a84-42d3-8694-808b954bc11f]

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

Deliver + verify requirement R40.27 (Class facet completeness: renders TS method ). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.27; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(method-signatures)** A Class facet renders its TS METHOD SIGNATURES (visibility name(params):returnType) — the data exists from R36.3 part-1 enrichment.
- [ ] **(attributes)** It renders its ATTRIBUTES / PROPERTIES.
- [ ] **(relationships)** It renders its RELATIONSHIPS.
- [ ] **(empty-vs-absent)** Empty vs absent DISTINGUISHED with teeth: a genuinely empty class shows '(no members)'; when fetchModel returns NULL (members unavailable) it shows '⚠ members unavailable' — because node-build currently SWALLOWS the null (if(!mm)continue) and a swallowed error is indistinguishable from success. Fail-visible, never a silent empty box.
- [ ] **(single-render-path)** Renders via the SINGLE renderFacet/deriveViewKind path — NO rival renderer or type-map (the family single-source, ties R40.23/BUG-D).
- [ ] **(device-gate)** Device-gated @390 real-WebKit, RED-baseline.

## Subtasks
