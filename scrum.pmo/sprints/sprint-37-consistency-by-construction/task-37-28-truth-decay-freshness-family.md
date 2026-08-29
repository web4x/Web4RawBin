<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.28: Truth-decay / no-freshness-invariant family — coordination root (6 per-class freshness guards + cross-cutting Arm-B/meta/prose-ungated)

[task:uuid:61718883-195a-4bd4-bbc9-ead8ecff8412]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.25 `[requirement:uuid:fcc34aa1-84da-438c-942f-1c2c27efe61a]`
  - down
    - 6 per-class subtasks (see Subtasks)

## Task Description

Coordination ROOT of the R37.25 truth-decay / no-freshness-invariant family (architect design ior:file:scrum.pmo/design-notes/design-truth-decay-freshness-invariant-family.md?commit=e31458f92). THE ONE LAW: no authoritative artifact may be stored-and-silent — derive-first, ELSE stored-with-revalidation + VISIBLE-STALE. 6 per-class GATED subtasks below (deploy-instruction/req-satisfaction/guard-coverage/boot-state/derived-slot/constraint-cycle). The cross-cutting Arm-B claim-type guards (grep-absence/positive-control, end-to-end-pairing, relayed-measurement-revalidate-at-use, repeat-directive-re-derive-before-repeat), the meta guards (coverage-self-report, satisfyingGate, gate-credit-three-link), and the prose-ungated remainder live HERE at the root, NOT per-class (mapping them per-class would 6x-duplicate + drift).

## Acceptance Criteria

- [ ] (functional / meta-invariant) Every authoritative artifact-class in the corpus either DERIVES from its single source per read, OR carries provenance re-validated per read that renders VISIBLE-STALE on failure — never stored-and-silent.
- [ ] (functional / coverage-self-report) The root ENUMERATES the 6 gated classes + asserts each has a FAILABLE class-gate (stub-must-fail proven); a new gated class added = registration at the root, not silent.
- [ ] (functional / Arm-B claim-type) A NEGATIVE/absence claim is inadmissible until the instrument is proven able to find something (positive control); a WENT-STALE claim needs freshness; grep-absence on a guessed name != absence. Relayed measurement is re-validated AT USE, not stored. A standing repeat-this-every-report directive carries a re-derive-before-repeat clause.
- [ ] (declared, prose-ungated) The prose-only ruling remainder (authoring-discipline, no mechanical gate) is DECLARED here as not-tasked — enumerated, not silently absent.
- [ ] (gate) STUB-MUST-FAIL + 3-LINK CREDIT: a satisfaction credited via this gate needs THREE resolvable links — (1) resolvable satisfyingGate CITE, (2) GREEN-on-HEAD, (3) ASSERTS-THIS-AC (scope-match not name-match). Links 2+3 = the TESTER verdict (proof-builder separation; planner/req/architect may NOT self-credit). Bite: cite-only+gate-RED-on-HEAD => uncredited; gate-green-but-asserts-a-DIFFERENT-AC (name-match) => uncredited. FAMILY: truth-decay / no-freshness-invariant.

## Subtasks

Coordination ROOT — 6 per-class GATED freshness guards (buildOrder = cite-existing cheap first):
- [Task 37.28.1: boot-state](./task-37-28-1-boot-state.md) `[task:uuid:bd0e5f4a-ef1c-4d06-b019-a66d6057aa7b]`
- [Task 37.28.2: derived-slot](./task-37-28-2-derived-slot.md) `[task:uuid:25772198-1c7d-4e6b-81b9-e35a2a082252]`
- [Task 37.28.3: deploy-instruction](./task-37-28-3-deploy-instruction.md) `[task:uuid:968d966d-ea74-404b-9751-f611fdab475e]`
- [Task 37.28.4: req-satisfaction](./task-37-28-4-req-satisfaction.md) `[task:uuid:2af98c11-cb0d-439c-a294-1ea0d3402d62]`
- [Task 37.28.5: guard-coverage](./task-37-28-5-guard-coverage.md) `[task:uuid:afe976e3-20fa-44b4-8170-1caea4e04528]`
- [Task 37.28.6: constraint-cycle](./task-37-28-6-constraint-cycle.md) `[task:uuid:e2068636-2980-4e14-a150-7266b7582bf1]`

prose-ungated remainder = declared-not-tasked at this root (authoring-discipline, no gate).
