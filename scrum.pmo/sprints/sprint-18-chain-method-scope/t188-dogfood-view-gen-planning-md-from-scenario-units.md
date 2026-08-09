<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

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

## Architect Design

## Architect refinement (robbin-architect, 2026-06-09)

### Scope (per R18.3 anchor 91a1c36a)
Generator scripts/generate-sprint-md.ts already emits one-way (scenario units → .md files in scrum.pmo/sprints/<sprint>/). T188 adds the ROUND-TRIP:
1. Generator emits authoritative .md from scenario units (one-way, existing).
2. Integrity check VERIFIES that regenerated MD byte-matches the previously-generated MD (no hand-edit drift).
3. CI gate fails if integrity check reports any diff.

### Round-trip mechanics
- Every generated file starts with the canonical header `<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->`.
- Integrity check: re-run `generate-sprint-md.ts --all`. After regen, run `git diff --exit-code scrum.pmo/sprints/` — pass = zero diff. Fail = hand-edit drift OR generator non-determinism.
- Generator MUST be deterministic: same scenario units → byte-identical MD output across runs.

### Determinism requirements
- Sort task units by sprint position (the `id` field, fallback to `slug`) — stable order across runs.
- Sort coveredRequirements + useCases lists by referenced unit's `id`/`slug`.
- Newlines: LF only, single trailing newline per file.
- No timestamps in output (the generated file is content-addressed).
- No locale-dependent formatting (numbers, dates).

### Per-file fix table
| File | Change |
|------|--------|
| `scripts/generate-sprint-md.ts` | Add a `--check` mode: emit to a temp dir, diff against current sprints/<sprint>/ contents, exit non-zero on any diff. |
| `scripts/generate-sprint-md.ts` | Audit generateTaskMd + generatePlanningMd for non-determinism (Map iteration, Set ordering, Object.keys). Add explicit sorts. |
| `package.json` | Add npm script: `"check:sprint-md": "tsx scripts/generate-sprint-md.ts --check --all"`. |
| `.github/workflows/*.yml` (or local CI) | Run `npm run check:sprint-md` in CI; gate merges on pass. |

### Test scenario (champagne)
Pick Sprint 18 itself (it's the dogfood). 
1. Run `npx tsx scripts/generate-sprint-md.ts <sprint-18-uuid>` → regenerates planning.md + per-task MDs.
2. Run `git diff --exit-code scrum.pmo/sprints/sprint-18-chain-method-scope/` → must be empty.
3. Edit one scenario unit (e.g., bump description on T188), regenerate, diff → must show ONLY that change.
4. Revert the unit, regenerate, diff → must be empty again (idempotent).

### Acceptance criteria
- AC1 — `generate-sprint-md.ts --check --all` runs in CI and exits 0 when scenario units and generated MDs are in sync.
- AC2 — Modifying a scenario unit field (e.g., `description`) and re-running the generator produces a diff in the corresponding .md file matching the field change byte-for-byte.
- AC3 — Re-running the generator twice in a row produces zero diffs the second time (idempotence).
- AC4 — Generated MD files all start with the canonical `<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->` header.
- AC5 — Hand-editing a generated MD file then running `--check` reports the diff and exits non-zero.
- AC6 — Sprint 18 itself round-trips: scenario units → MD → re-read MD → matches scenario unit field-by-field for the fields the template emits.
- AC7 — 836/836 vitest pass (regression).

### Rule-pair
- (a) package.json bump: required (new npm script added)
- (b) sw.js CACHE_NAME bump: not required (server-side generator, no client bundle change)
- (c) STATIC_SHELL: exempt
