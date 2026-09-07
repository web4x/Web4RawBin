<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.35: deploymentRefs model inversion — the minted 

[task:uuid:7cbc4241-b625-431c-8894-86a0a755eb0b]

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

Deliver + verify requirement R40.35 (deploymentRefs model inversion — the minted ). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.35; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** deploymentRefs STOP being the source of truth: the minted scenario units (R40.11 AC-1..4, real R40.6-typed) become CANONICAL; nothing reads the deploymentRefs string array as authoritative input.
- [ ] **(functional)** The PRODUCER buildTypedModel (reads the array as INPUT today, buildTypedModel:43) STOPS reading the array and reads the units — single-source back-ref produced-by-buildTypedModel, no second producer.
- [ ] **(functional)** The CLIENT facet (rb-diagram-detail:160) STOPS reading the array and reads the units/back-ref — no client-side array read remains (grep-provable).
- [ ] **(automatable)** [the moved AC-5-AUTO] AFTER both readers stop, the deploymentRefs array is REMOVED via a GATED dry-run+count migration with INV-T byte-diff==0 (the graph is unchanged). Verifiable without the owner tap.
- [ ] **(automatable)** ★ MANDATORY (architect): BEFORE any array removal, PROVE that EVERY array field (role / ref / NOTE / ...) is captured in the units — a per-FIELD conservation check. Do NOT infer full representation from tree-level INV-T byte-diff==0: the tree may not render fields like 'note', so a tree-diff can be clean while a field is silently lost. Removal is BLOCKED until per-field conservation is proven (stub-must-fail: drop a captured 'note' from the units -> the conservation gate goes RED).
- [ ] **(automatable)** The back-ref emission is ORDER-PINNED (deterministic order), so the inverted model produces byte-stable output and INV-T byte-diff==0 is meaningful (not order-flapping).
- [ ] **(functional)** NO dual-read fallback: the code NEVER falls back to reading the array when a unit is missing — a fallback reintroduces the two-sources disease (the array as a shadow source). A missing unit FAILS LOUD (R40.11 fail-loud family), never silently reads the old array.

## Subtasks
