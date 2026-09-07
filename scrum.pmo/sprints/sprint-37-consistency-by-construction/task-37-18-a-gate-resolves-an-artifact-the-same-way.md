<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.18: A gate resolves an artifact the SAME WAY

[task:uuid:56f7808a-fdfd-4365-8a08-5fa0c5f0f6f0]

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

Deliver + verify requirement R37.18 (A gate resolves an artifact the SAME WAY). Retroactive task unit minted scenario-first from the existing CURRENT-sprint requirement (#126 gap: active S37 work untracked). Covers R37.18; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(by-construction)** PRIMARY (prevention, not detection): ONE exported path/config RESOLVER (a single-source function) is imported by BOTH the gate AND the runtime consumer, so the gated-path and the runtime-loaded-path CANNOT diverge by construction. NOT a detector that notices they disagree — police-the-output has lost every campaign instance (R37.15/16/17 + no-flush all killed the generator/chokepoint, never policed the output).
- [ ] **(by-construction)** The fix must make divergence UNREPRESENTABLE, not merely detectable: a same-named sibling in another dir, a pre-build copy, or a default that differs from the deploy/load path are all FORBIDDEN because both sides resolve through the ONE function. A design that relies on a detector noticing the mismatch has already failed this AC.
- [ ] **(gate)** STUB-MUST-FAIL divergence BITE: plant a DIVERGENCE between the gated-path and the runtime-loaded-path (e.g. gate checks fileX while runtime loads fileY, the R40.34-L1 shape) -> the guard MUST go RED. Proves the single-source prevention is LIVE, not assumed. A guard that cannot fail on a planted divergence certifies nothing.
- [ ] **(context)** WRONG-ARTIFACT is DISTINCT from stale-gate (R37.17 = the product's shape changed; staleness eventually REDs) and wrong-SURFACE (gate-the-AC-surface = tests the abandoned surface). Wrong-artifact = the gate certifies a file the runtime never loads = GREEN-FOREVER, never self-REDs = the worst of the three (nothing surfaces it but a manual audit).
- [ ] **(functional)** R40.34-L1 is the FIRST application: both check:revoked-tokens AND the server's REVOKED_TOKENS_PATH resolve the revoked list via the ONE resolver (RevokedTokens.unifyLoadPath) — the live divergence (gate=revoked-token-hashes.json ROOT / server=data/revoked-tokens.json DATA_DIR) becomes unrepresentable once both import the single source.

## Subtasks
