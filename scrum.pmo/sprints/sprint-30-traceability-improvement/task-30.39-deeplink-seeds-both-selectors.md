<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.39: Deep-link ?repo seeds BOTH left and right repo selectors on load

[task:uuid:079e3a17-1547-4773-b0e4-635665ffc39e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:95ebc2ed-ff7a-4979-9df8-15cb4d74ebff]`
  - down
    - [UC](./planning.md) `[uc:uuid:bd5392ef-61f5-4da3-a966-7b92c47d1417]`

## Task Description

Tron-QA BUG-A: opening the editor from a deep-link with ?repo=<key> must seed BOTH the left AND the right repo selectors on load — the user should NOT have to set either manually. ?repo is a KEY via R30.6.7 RepoRegistry (no absolute-path abuse).

## Context

Covers R30.39 (95ebc2ed) -> UC diffEditor.deepLinkSeedsBothSelectors (bd5392ef) -> Class RbDiffEditor 18165081. Relates R30.24 (openFromParams deep-link — gate proved 'opens' but missed 'seeds both') + R30.6.7 RepoRegistry. NOT a silent reopen of T30.24 — distinct new req (PO). Architect deriving the fix-site.

## Intention

S30 diff/merge editor, R30.39 (Tron QA-USE): a ?repo deep-link only seeded one selector; Tron had to set both manually. Both must reflect the repo on load.

## Acceptance Criteria

- [ ] (seed) Opening the editor from a deep-link with ?repo=<key> seeds BOTH the left AND the right repo selectors to that repo on load - neither is left at the default (RawBin).
- [ ] (seed) The user does NOT have to set either selector manually after a ?repo deep-link; both reflect the URL's repo immediately.
- [ ] (security) The ?repo value is a KEY resolved via R30.6.7 RepoRegistry (no client absolute-path abuse); an unknown/absent key falls back to the default (rawbin) for BOTH selectors.
- [ ] (gate) GATE (DET-3x + Tron visual): open /edit/otmux?repo=oosh&left=..&right=..&3way=1 -> both left and right selectors read 'oosh' on load, no manual setting; client-facing -> version-bump + atomic deploy (R30.28).

## Implementation

IN PROGRESS (Tron-QA BUG-A). Tester has RED-baseline gate (r3041 family). Architect DERIVING the fix-site (openFromParams seeds both left+right repo selectors from ?repo, not just one). Expert fixing. -> deploy -> QA-Review -> tester DET-3x GREEN + Tron visual (both selectors seeded on the real deep-link) -> Done (chain-to-Test + served==gated first).

## Subtasks

None (atomic task).
