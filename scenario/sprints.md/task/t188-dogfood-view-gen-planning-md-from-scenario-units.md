# Dogfood S17 view-gen: planning.md + task-*.md emitted from scenario.json Sprint+Task units
[task:uuid:8a31ba75-22b6-48ff-9532-d5da21458543]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — view-gen design)
  - [x] creating test cases
  - [x] implementing (expert — generator round-trip)
  - [x] testing (tester — champagne 442237d6 GREEN; AC1/3/4/5 PASS; 7-step chain Test 9dbf5538→Impl ee738f5f→…→Req R18.3 wired)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 viewGen.dogfood](../usecase/viewgen-dogfood.md)


## Task Description

Bootstrap: this task IS the dogfood — Sprint 18 itself is being authored as scenario.json units (this file, the Sprint unit 5b950725-..., the other Task units, the Requirement units when req-eng commits them, and the UseCase/Class/Method units when architect commits them). T126 ViewGenerator (R17.7-R17.10) emits scrum.pmo/sprints/sprint-18-chain-method-scope/planning.md + task-187-*.md + task-188-*.md + task-189-*.md from the scenario units. The .md files become generated views, not hand-authored source. Verifies the S17 model can author a sprint end-to-end from units.

## Acceptance Criteria

- AC1 — generate-sprint-md.ts --check --all runs in CI and exits 0 when scenario units and generated MDs are in sync.
- AC2 — Modifying a scenario unit field and re-running the generator produces a matching MD diff.
- AC3 — Re-running the generator twice produces zero diffs the second time (idempotence).
- AC4 — Generated MD files all start with the canonical GENERATED FROM SCENARIO UNITS header.
- AC5 — Hand-editing a generated MD then running --check reports the diff and exits non-zero.
- AC6 — Sprint 18 round-trips end-to-end (scenario unit fields → MD → matches).
- AC7 — 836/836 vitest pass.
