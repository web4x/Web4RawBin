[Back to Sprint 11 Planning](./planning.md)

# T119: Test traceability — `[test:uuid:]` markers + trace-cli Pass 6 + chain validation

[task:uuid:d3119b08-e29f-4c52-c0a3-6f9e3d2f1e88]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req + architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owner:** robbin-architect (retrofit design), robbin-expert (markers + trace-cli Pass 6), robbin-tester (chain-complete verification)
**This file is the single source of truth.** All roles work from this file — no chat clarification.

## Traceability

`[task:uuid:d3119b08-e29f-4c52-c0a3-6f9e3d2f1e88]`

- up
  - [Sprint 11 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:r119-test-traceability-e29f-3c5d-b1c0a3d2f1e8]` —
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

## Problem Statement

Tron 2026-05-29 (verbatim): *"797/797 tests but none traceable… let the planner fix that."*

The trace graph today has Pass 4 (`<<UseCase>>` from PUML, T117) and Pass 5
(`[impl:uuid:]` in src/, T116). The TEST layer is missing — no test file or test
case declares which AC or requirement it verifies. Result: 797 passing tests with
zero discoverable mapping into the chain. A change to a requirement cannot reach
"which tests guard this?" via the graph.

## Root Cause (diagnosed)

| Gap | Detail |
|-----|--------|
| 1 | No `[test:uuid:]` (or equivalent) marker convention exists in the test files. |
| 2 | trace-cli (T116/T117 in S16) parses PUML + `[impl:uuid:]` but has no Pass 6 for tests. |
| 3 | No `orphanTests` validation: cannot flag tests with no AC/requirement link. |
| 4 | The Web4Articles traceability standard (T85) defines `req→uc→puml→class/method` — the **test** node is implicit, not formalized. |

## Design — three threads, gated

### Thread A — architect: retrofit design (refinement phase)

1. Define the marker convention:
   - **Per file:** top-of-file comment block declaring scope, e.g.
     ```typescript
     // [test:uuid:<v4>] — covers req:r91-avatar-persist · task:T91 · AC1,AC2,AC3
     ```
   - **Per test case (optional, recommended for non-obvious mappings):**
     ```typescript
     it('AC2 — survives reload', () => { /* ... */ });
     // [test:uuid:<v4>] — req:r91-avatar-persist · AC2
     ```
2. Decide whether to require ALL 797 tests carry a marker (strict — best chain
   integrity) OR file-level only (relaxed — faster retrofit). Recommendation:
   start file-level, add case-level for tests covering >1 AC or multiple
   requirements. Architect makes the call in the refinement.
3. Add UC entries to `s16-usecases.puml`:
   `UC-testTraceabilityScan`, `UC-orphanTestValidation`.
4. Update `scrum.pmo/standards/traceability-standard.md` to include the **test**
   node in the canonical chain and the marker grammar.

### Thread B — expert: trace-cli Pass 6 + marker rollout

1. **trace-cli extension (`src/ts/trace-cli/trace-cli.ts`):**
   - `parseTestUuidMarkers()` — Pass 6 — scans `test/**/*.ts` (vitest + playwright)
     for `[test:uuid:<v4>]` blocks; emits `Test` graph objects.
   - Link each Test to its requirement/AC/task by ids in the marker line.
   - `validate()` adds `orphanTests` check — Test with no AC/requirement link.
2. **Marker rollout** across the 797 tests:
   - Phase 1 — `test/vitest/*.test.ts` (file-level markers; case-level where
     the file covers multiple ACs).
   - Phase 2 — `test/e2e/*.spec.ts` (same approach).
   - Use a scaffold script (one-off) to generate UUIDs and append the
     comment block; manual review for AC mapping.
3. Server `/api/trace` carries the Test objects (no API change needed if Pass 6
   already plugs into `scanRepo`).

### Thread C — tester: chain-complete verification

1. New `test-traceability.test.ts` (vitest) — runs trace-cli, asserts:
   - Every `requirement:uuid` has ≥1 linked test
   - Every task with `acceptance criteria` has ≥1 test per AC (or a documented
     waiver in the task file)
   - `orphanTests` count = 0 after rollout (or matches the documented allowlist
     for tests that are pure framework/utility — architect documents waivers)
2. Manual: full `npm run test` + `npm run test:e2e`; suite still green; trace
   graph object count grows to include 797 Test nodes.

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

## Test Scenarios

File: `test/vitest/test-traceability.test.ts` (new). Trace-cli unit tests added to existing `test/vitest/trace-cli.test.ts` (extend, don't replace).

| Test | Action | Expected |
|------|--------|----------|
| TS1 | trace-cli Pass 6 on a fixture dir with 3 `[test:uuid:]` markers | 3 Test objects linked correctly |
| TS2 | Pass 6 on a fixture with 1 marker missing the req id | flagged in `orphanTests` |
| TS3 | `validate()` on the real graph after rollout | `orphanTests.length ≤ documentedWaivers.length` |
| TS4 | `every req → ≥1 test` assertion across the real graph | passes |
| TS5 | Run full vitest + playwright suites after rollout | suite still green; graph carries Test nodes (count grows from baseline) |

## Drive Plan (planner-coordinated)

1. **req-eng** — formalize `requirement:uuid:r119-test-traceability-...` as a real
   requirement file (or matrix row) linking up to Tron's quote 2026-05-29. **Done
   before architect refinement starts.**
2. **architect (Thread A)** — refinement: marker convention, file-level vs
   case-level decision, standard update draft, S16 PUML UC additions. Commit
   refinement [x] in this task file.
3. **expert (Thread B)** — Pass 6 in trace-cli, marker rollout in two phases
   (vitest → e2e). May script the scaffold; review each AC mapping by hand.
4. **tester (Thread C)** — `test-traceability.test.ts`, manual suite re-run,
   verify graph count includes 797 Test nodes (or fewer if file-level only).
5. **planner** — monitor each commit, sync planning.md symbol per state, update
   `scrum.pmo/traceability-matrix.md` once Pass 6 is live.

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
