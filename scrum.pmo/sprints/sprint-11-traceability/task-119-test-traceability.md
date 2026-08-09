<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T119: Test traceability — `[test:uuid:]` markers + trace-cli Pass 6 + chain validation

[task:uuid:1e797ea6-c535-4779-9288-a72798dc17d5]

## Status
- [ ] Planned
- [x] In Progress
  - [ ] refinement (req + architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:1e797ea6-c535-4779-9288-a72798dc17d5]`

- up
  - [Sprint 11 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:41c68a9a-b27d-488e-8346-4bc7a4ce685e]` —
    "797/797 tests but none traceable. Every test must declare which AC /
    requirement it verifies, so the chain (requirement → task → use case →
    class → method → **test**) closes end-to-end and `sprint audit` /
    trace-cli surfaces orphan tests." (Tron directive 2026-05-29, captured by req-eng.)
- down
  - None (atomic task)
- follows
  - [T117: UseCase as class instances in PUML](../sprint-16-traceability-ux/task-117-usecase-as-class.md) — trace-cli Pass 4 machinery
  - [T116: Traceability-chain review](../sprint-16-traceability-ux/task-116-chain-review.md) — Pass 5 [impl:uuid:] scan; T119 adds Pass 6 [test:uuid:]
  - [T85: Adopt Web4Articles template + traceability conventions doc](./task-85-adopt-template.md) — extends the standard
  - [T90: Traceability verification + audit gate](./task-90-traceability-verify.md) — chain-resolution audit; T119 closes the test side
- chain (req → usecase → puml → class/method → **test**)
  - **requirement:** r119-test-traceability
  - **use case:** UC-testTraceabilityScan (new); UC-orphanTestValidation (new); existing scan/parse UCs from S16 PUML
  - **puml:** [diagrams/s16-usecases.puml](../sprint-16-traceability-ux/diagrams/s16-usecases.puml) (architect adds the two test-side UCs)
  - **class/method:** `src/ts/trace-cli/trace-cli.ts` → `parseTestUuidMarkers()` (new Pass 6); `validate()` extended for `orphanTests`
  - **test:** `test/vitest/trace-cli.test.ts` + `test/vitest/test-traceability.test.ts` (new); each carries `[test:uuid:]` to its own AC

## Task Description

Add test traceability: [test:uuid:] markers, trace-cli Pass 6, and chain validation.

## Acceptance Criteria

- [ ] AC1 — `traceability-standard.md` updated to include the **test** node and the `[test:uuid:]` marker grammar
- [ ] AC2 — trace-cli Pass 6 `parseTestUuidMarkers()` ships; emits `Test` objects linked to req/AC/task
- [ ] AC3 — `validate()` reports `orphanTests` count; 0 after rollout (or matches the documented waiver allowlist)
- [ ] AC4 — Every `test/vitest/*.test.ts` carries a file-level `[test:uuid:]` linking to ≥1 requirement (or a waiver)
- [ ] AC5 — Every `test/e2e/*.spec.ts` carries a file-level `[test:uuid:]` linking to ≥1 requirement (or a waiver)
- [ ] AC6 — `test-traceability.test.ts` asserts: every req has ≥1 test; every task AC has ≥1 covering test; `orphanTests` ≤ waiver count
- [ ] AC7 — `npm run trace:check` (or equivalent) surfaces orphan tests and broken test→req links the same way it surfaces orphan UCs (T116)
- [ ] AC8 — Architect adds `UC-testTraceabilityScan` + `UC-orphanTestValidation` to `s16-usecases.puml` (or a sibling), regenerates SVG, no broken puml
- [ ] `npm run build` + full vitest + playwright pass; no regression; trace graph includes Test nodes
- [ ] Version bump only if user-facing surface changes (test-infra only — likely no bump)

## Dependencies

- **Requires:** T117 (trace-cli Pass 4 machinery; landed in 61d0253) · T116 (Pass 5 [impl:uuid:]; landed in 61d0253) · T85 (the standard to extend; impl-done)
- **Enables:** T90 (chain-resolution audit gate now covers the test layer); any future "which tests guard this requirement?" workflow

## Definition of Done

- [ ] All AC met; traceability chain (req→uc→puml→class/method→**test**) closed
- [ ] Standard, matrix, and PUML updated to reflect the test node
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-29: Tron directive — 797 tests but none traceable. PO routed to planner. Captured as req:r119-test-traceability; T119 stood up in S11 (Traceability Standardization) as the natural fit (extends T85's standard + T116/T117 trace-cli to the test layer). Awaiting req formalization + architect refinement, then Tron QA.

## Subtasks

None (atomic task — three role threads, single deliverable).

---

*Sprint 11 — Traceability Standardization*
*Owner: robbin-architect (design), robbin-expert (Pass 6 + markers), robbin-tester (chain verify), with robbin-req formalizing the requirement first*
*Priority: HIGH (closes the chain end-to-end; precondition for T90's full audit gate)*
