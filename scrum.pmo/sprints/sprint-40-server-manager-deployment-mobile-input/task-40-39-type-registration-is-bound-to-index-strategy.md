<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.39: Type-registration is BOUND to index-strategy

[task:uuid:a5b4b0f7-e763-403c-81c1-e511f34ca450]

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

Deliver + verify requirement R40.39 (Type-registration is BOUND to index-strategy). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.39; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** ONE type-strategy REGISTRY: every ior:class unit type declares EXACTLY ONE of {typeIndexed | altIndexed(keyField) | singleton} — a SINGLE SOURCE that REPLACES the multiple hardcoded partial lists (templates.ts view-registry, migrate-to-scenario emitClassSymlinks, etc.). Type-registration is BOUND to index-strategy (the missing binding was the root defect).
- [ ] **(functional)** LAYER 1: the view-folders are DERIVED FROM the registry (not a hardcoded list); ScenarioIndex gains a byType index; a generic template FALLBACK renders any declared type. So EVERY type gets a folder + a renderer by construction — none silently gets nothing. bootstrapSeed's corpus-walk is fixed FOR FREE once byType exists (it was always the symptom, never the disease).
- [ ] **(gate)** LAYER 2 GATE: FAILS if any ior:class type HAS units but NO registry declaration, OR if any typeIndexed type is resolved by a corpus scan — with STUB-MUST-FAIL (introduce an undeclared type / corpus-scan a typeIndexed type -> RED). Omission becomes IMPOSSIBLE, not merely detectable; the next new type cannot silently get nothing.
- [ ] **(functional)** Boot is READ-MOSTLY: bootstrapSeed does NOT write per Feature on the boot path — seed-if-absent lazily at point-of-use, or a read-only ASSERT + explicit repair. (Real residual, survives all corrections.)
- [ ] **(functional)** Feature persistence uses an ATOMIC write (temp+rename): a concurrent boot never tears / lost-updates the Feature file (same class as the token-reembed trap).
- [ ] **(functional)** AUDIT FINAL (architect-measured 2026-08-17) drives the registry declarations: 7 GENUINE GAPS -> typeIndexed = feature(3), TestCase(1023), modelelement(44), webitem(26), relationship(21), profile(20), gate(7). 4 INTENTIONAL = company/email/phone -> altIndexed (verified scenario/alt/ by-value) + config -> singleton (near-singleton, 2 units). Every type declared, none left in the default-corpus-scan bucket.

## Subtasks
