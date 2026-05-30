[Back to Sprint 17 Planning](./planning.md)

# T129: Traceability gate — every method traces to a task AND a requirement

[task:uuid:907cc43e-119c-467b-add0-0dd5cdf8344b]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners:** robbin-tester (verify), robbin-planner (audit + sign-off)

## Traceability

`[task:uuid:907cc43e-119c-467b-add0-0dd5cdf8344b]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** R17.13 every method must be traced completely back to a task AND a requirement (sprint-closing gate)
- down
  - T129.1 — `npm run trace:check` clean; `orphanMethods`/`orphanTasks`/`orphanReqs` all 0 (or in documented waiver list)
  - T129.2 — Tester walks the chain end-to-end on a sample (method → class → useCase → task → requirement); confirms IOR resolution at each hop
  - T129.3 — `sprint audit` + Web4Articles compliance audit pass 0-issue across all migrated sprints
- chain
  - **requirement:** R17.13
  - **use case:** chain.verify, gate.close, audit.compliance (T124.6 PUML)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** extends T102 matrix engine + T116 chain validator + T121 audit machinery
- requires
  - T128 migration must be complete (or in documented partial state)

## Task Description
Sprint 17's closing gate. Verifies the migration produced a clean,
fully-traceable graph and that every method can be walked back to a task AND a
requirement (R17.13).

**T129.1 — trace-cli clean run:**
- `npm run trace:check` against the migrated graph
- `orphanMethods` = 0 (or in waiver allowlist with rationale)
- `orphanTasks` = 0
- `orphanReqs` = 0
- `orphanUCs` = 0 or in documented allowlist

**T129.2 — manual end-to-end chain walk (sample):**
- Tester picks a representative method (e.g. `RoomManager.persist()` in S14, or `RbDetailDrawer.open()` in S16)
- Walks the chain: method → class → useCase → task → requirement
- Confirms IOR resolution at each hop (every link clicks through)
- Repeats for 5+ samples spanning different sprints/classes

**T129.3 — sprint audit + Web4Articles compliance:**
- `sprint audit` on the migrated `scrum.pmo/sprints/` (or equivalent for the new scenario-unit layout)
- 0-issue across all migrated sprints
- Web4Articles compliance: every task has Status + Traceability + Acceptance Criteria + QA Audit sections (template adoption verified in the generated views)

## Acceptance Criteria
- [ ] AC1 — `npm run trace:check` clean (or documented allowlist) on the migrated graph
- [ ] AC2 — 5+ end-to-end chain walks pass (T129.2 sample report committed in this file)
- [ ] AC3 — `sprint audit` returns 0-issue across all migrated sprints (T129.3)
- [ ] AC4 — Every method in src/ either (a) has `[impl:uuid:]` linking to a Task whose `chain` resolves up to a requirement, or (b) is in a documented "framework/utility" waiver list with rationale
- [ ] AC5 — `scenarios/sprints.md/` generated tree mirrors `scenarios/sprints.json/` symlink tree
- [ ] AC6 — Sprint-17 own units (this task, T124-T128, T128.1-T128.4, etc.) are themselves migrated/generated — eats own dog food
- [ ] AC7 — `npm run build` succeeds; full suite passes
- [ ] AC8 — Final report committed in this file's QA Audit section, ready for Tron QA review

## Dependencies
- **Requires:** T128 (migration; can run in parallel with T128.4 for partial verification)
- **Enables:** Sprint 17 close + Tron QA approval

## Definition of Done
- [ ] All AC met; sub-tasks T129.1-T129.3 committed
- [ ] Chain integrity proven by tooling + sample
- [ ] Tron QA approved → Sprint 17 closes

## QA Audit & User Feedback
- 2026-05-30: Planned — sprint-closing gate, runs after T128. Tester walks the chain; planner runs the audit; Tron approves to close S17.

## Subtasks
T129.1, T129.2, T129.3 — created by tester+planner during execution.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 6*
*Owners: robbin-tester (verify), robbin-planner (audit)*
*Priority: 6 (closing gate — proves the sprint's invariant holds end-to-end)*
