<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.81: ONE physical unit store — Unit.resolve OWNS the single store; every index/view is a symlink tree (radical-OOP Slice-1 convergence)

[task:uuid:d864b05f-8a0e-4b16-9a45-8230fd745413]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

MINTED In-Progress 2026-09-06 as PRIO-1 CURRENT (PO-set; tester RED-baselines now). VERIFIED ABSENT before mint (0 covering task + no existing store-convergence task; check-before-create satisfied, not a parallel duplicate). Radical-OOP: Unit.resolve OWNS the store (object-owns-behaviour). Slice-1 Node half already SHIPPED GREEN @v0.8.187; this is the open one-store half. UC full-uuid ea8c3cf8-8d96-429d-9eba-e9f8f5a866b4 from R40.81.useCases[] on disk. 14 ACs mirrored no-drift + OOP-owner CR + transport-is-scenario standing AC. LOCAL push-freeze, path-limited. req reverse-wires R40.81.tasks[]. 0 Done till Tron.

## Task Description

PRIO-1 CURRENT (PO 2026-09-06, tester RED-baselining now). The OPEN half of Tron's prio-1 — Slice-1 Node (owns-children-rendering) already SHIPPED 4-axis GREEN @v0.8.187, R40.81 one-store is the remaining half. Covers R40.81 be8ec6b6, UC ea8c3cf8. ★ RADICAL-OOP (object-owns-behaviour): Unit.resolve is the ONE canonical STORE OWNER — not a functional store-picker/free-fn; every other index/view is a SYMLINK tree into the one physical store, a duplicate physical store is FORBIDDEN. verify-owner-first: full-index scan confirmed R40.81 had NO covering task + no existing store-convergence task (the sprint-dir-resolver/class-dedup/add-folder candidates are distinct) = VERIFIED ABSENT -> minted (NOT a parallel duplicate; check-before-create satisfied).

## Context

Covers R40.81 be8ec6b6 (UC ea8c3cf8). Radical-OOP Slice-1 convergence. CURRENT (PO-set). Supersedes R40.69 two-store legitimacy. Standing AC: transport-is-the-scenario.

## Intention

Unit.resolve owns exactly one physical unit store; all else symlinks into it; divergence fails closed.

## Acceptance Criteria

Mirrors R40.81 be8ec6b6's 14 ACs (no-drift; see req for full text). NEVER Done till Tron.
- [ ] AC-exactly-one-physical-store: exactly ONE physical unit store on disk; a 2nd duplicate physical store is FORBIDDEN.
- [ ] AC-additional-index-is-symlink-only: every other index/view is a SYMLINK tree into the one store, never a copy.
- [ ] AC-no-duplicate-real-file-for-uuid: a given unit uuid has exactly ONE real file; no duplicate real file for a uuid.
- [ ] AC-migration-33-overlap-collapse: collapse the 33-dup-uuid scenario-index/model-store overlap into the one store.
- [ ] AC-migration-744-model-store-only-relocate: relocate model-store-only units into the one store.
- [ ] AC-divergence-which-wins-fail-closed: on store divergence, FAIL-CLOSED — the one-store owner (Unit.resolve) decides, never a silent pick.
- [ ] AC-one-store-lint-own-stub-must-fail: a lint/guard forbids a 2nd physical store + ships a RED-proving stub (self-bites).
- [ ] AC-supersedes-R40.69-two-store-legitimacy: supersedes R40.69's two-store legitimacy — there is ONE store now.
- [ ] AC-resettability-without-second-store: the store is resettable without needing a second store.
- [ ] AC-no-regression-baseline: no regression vs a captured baseline.
- [ ] AC-one-canonical-owner-zero-residual: ONE canonical owner = Unit.resolve; ZERO residual second-store references.
- [ ] AC-migration-failable-stub: the migration ships with a failable stub (proves RED).
- [ ] AC-zero-data-loss-authored-vs-regenerable: zero data loss — distinguish authored vs regenerable content in the migration.
- [ ] AC-gitignored-store-snapshot-first: snapshot the gitignored store FIRST (preserve before migrate).
- [ ] ★AC-radical-oop-owner (OOP-CR): the store owner is Unit.resolve as an OBJECT that OWNS the store, NOT a free-fn/helper/per-caller store-picker.
- [ ] ★AC-transport-is-the-scenario (standing): the scenario-unit JSON is the model AND the only transport payload; no multipart/bespoke.

## Subtasks

None (atomic task).
