[Back to Sprint 15 Planning](./planning.md)

# T102: Traceability Matrix Consistency + Fix Engine

[task:uuid:102b1c2d-3e4f-4051-9728-b02020202102]

## Status
- [x] Planned
- [x] In Progress
  - [ ] refinement (architect — implemented ahead of refinement per PO; architect to review scan heuristics)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — run trace-consistency.test.ts + `npm run trace:check`)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.11)
`src/ts/server/TraceConsistency.ts` (engine) + `src/ts/server/trace-cli.ts` (CLI) + npm scripts `trace:check`/`trace:fix`.
- **AC1 scan→graph:** `scanRepo(sprintsDir)` walks `scrum.pmo/sprints/*`: requirements.md → `Requirement` (T101) objects + forward `→ [Task](./task-*.md)` links; task-*.md → `Task` objects + up `[requirement:uuid]` links + per-task coverage flags (req/uc/puml/method via tag/heuristic regex) + `[task:uuid]`. Returns `{ graph: TraceGraph, coverage }`. Verified live: scanned 110 tasks, built the graph.
- **AC2 validate:** `validate(graph, coverage)` → Issues with level+ref+reason: task missing `[task:uuid]` (error), up-link requirement uuid not found (error, dangling), requirement with no linked task (error), task with no requirement up-link (warn). Live run flagged 14 errors (legacy Sprint-1 subtasks pre-UUID) + 96 warns — engine detects real drift.
- **AC3 fix (non-destructive):** `fixMatrix(path, coverage)` regenerates ONLY the region between `<!-- TRACE:BEGIN -->`/`<!-- TRACE:END -->` markers; manual content outside is preserved verbatim. If no markers, the region is appended (the planner's hand-authored Sprints 1-9 table is left untouched).
- **AC4 idempotent:** `fixMatrix` writes only when content changes; `generateRegion` is deterministic → second run = `{changed:false}`.
- **AC5 check mode:** `npm run trace:check` (report-only) exits 1 on any ERROR-level issue (warnings don't fail CI), 0 when clean. `npm run trace:fix` regenerates the region.
- **AC6 tests:** `test/vitest/trace-consistency.test.ts` — validate (clean + 4 drift cases), fix (append+preserve, idempotent, drift-repair single-region), deterministic region. Authored by expert; **execution is robbin-tester's**.
- Toolchain note: project has no tsconfig.json (esbuild/tsx) — verified via `npm run trace:check` running cleanly under tsx + `npm run build`. v0.5.11, sw.js cache rawbin-v0.5.11. Server-side tool (CLI/CI) — no live deploy needed.
- Scan scope: requirement↔task chain + per-task uc/puml/method presence flags (matches the existing matrix columns). Deeper first-class uc/class/method/impl/test object linking is a documented extension for architect review (T103/T108).

## Traceability
- up
  - [requirement:uuid:15a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01](./requirements.md) — R15.1 matrix consistency + fix
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.1 in [requirements.md](./requirements.md)
  - **use case:** matrix.fix (validate + repair drift) — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** MatrixConsistency engine — validate() / report() / fix()

## Task Description
A TypeScript engine that reads the typed objects (T101) plus the repository, validates
the full req→uc→puml→method→test chain, and reports any inconsistencies. It also FIXES
detected drift, keeping `scrum.pmo/traceability-matrix.md` consistent with the typed
object graph.

## Acceptance Criteria
- [ ] AC1: Engine loads the T101 typed object graph + scans the repo to build the live req→uc→puml→method→test chain
- [ ] AC2: Validation reports every broken/missing chain link with the offending UUID and a human-readable reason
- [ ] AC3: `fix` mode repairs drift (regenerates/updates `scrum.pmo/traceability-matrix.md`) without losing manually-authored content outside generated regions
- [ ] AC4: Engine is idempotent — running `fix` twice produces no further changes when the matrix is already consistent
- [ ] AC5: A `--check`/report-only mode exits non-zero on inconsistency (CI-usable) and zero when consistent
- [ ] AC6: Tests cover validate (clean + drifted fixtures) and fix (drift → consistent → idempotent)
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T101
- **Enables:** T108

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks
None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 2 (consistency engine)*
