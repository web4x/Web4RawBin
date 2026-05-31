# T136: Migration extension for Requirement + UseCase units (T128 extension)
[task:uuid:c9cdce42-c87f-438a-9e59-d953099b86bb]

## Status

- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:c9cdce42-c87f-438a-9e59-d953099b86bb]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:024c7b8f-f314-4745-a998-85b87cd09b09]` —
    "T128 migration extension: emit Requirement + UseCase units (currently
    only Task + impl emitted; Requirement entries in `requirements.md` and
    UseCase entries in `*-usecases.puml` need to land as scenario.json units
    in scenario/index/ with proper IOR + ownerIor wiring)." (Tron via PO
    2026-05-31; req-eng to anchor verbatim Tron quote here.)
- down
  - None (atomic — single migration-tooling extension)
- follows
  - [T128: Migration parent](./task-128-migration.md) — T136 extends T128.1's migrate-to-scenario script
  - [T125.2: 7-class system](./task-125-foundation.md) — Requirement + UseCase are already classes; T136 makes the migration emit them
- chain
  - **requirement:** r136 migration extension for Requirement+UseCase (Tron 2026-05-31)
  - **use case:** migrate.requirement, migrate.useCase, migrate.linkBack (architect adds to s17-usecases.puml)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** `scripts/migrate-to-scenario.ts` (extend) + `src/ts/scenario/classes.ts` (Requirement+UseCase emit helpers if needed)

## Task Description

T128.1 currently emits **Task** units + light **impl** markers. The full
class set per T125.2 includes Requirement, UseCase, Class, Method, Test
alongside Task and Sprint. To realize R17.14 fully (migrate all existing
sprints+tasks+requirements), T128 must also emit:

- **Requirement** units — one per `requirements.md` entry across S10-S17 (and S1-S9 once their requirements are formalized via T135). model carries verbatim Tron quote + v4 uuid + ownerIor (the Sprint that hosts the requirements.md).
- **UseCase** units — one per `<<UseCase>>` instance in `*-usecases.puml` (T117 made these first-class in PUML; T136 makes them first-class in the scenario index). ownerIor = the Sprint (or task) that authored the puml.

Cross-link semantics:
- Requirement → Task links (the existing `→ T<n>` in requirements.md) become TraceLink units (T134) on commit.
- UseCase → Task / UseCase → Method links (from puml chain blocks) become TraceLink units too.

## Acceptance Criteria

- [ ] AC1 — `migrate-to-scenario.ts` extended with `--include-requirements` + `--include-usecases` flags (or default-on; architect picks)
- [ ] AC2 — Running migration on Sprint 1 emits all Requirement + UseCase units from its sources; round-trip via IOR.resolve()
- [ ] AC3 — TraceLink units emitted for every `Requirement → Task` and `UseCase → {Task, Method}` cross-reference
- [ ] AC4 — Idempotent: re-running on the same sources does not duplicate units (existing v4 uuid used as index key)
- [ ] AC5 — T128.1 exemplar regenerated cleanly with the extension; `scenario/sprints.md/` tree now includes `/requirement/` + `/useCase/` peers to `/task/`
- [ ] AC6 — `npm run trace:check` clean (no new orphans); graph object count grows by the emitted reqs+UCs
- [ ] AC7 — `npm run build` + suite passes; rule-pair: (a)+(b) per #15 (data emission counts as user-visible since /md/ and /trace will surface the new units); (c) STATIC_SHELL exempt unless new route

## QA Audit & User Feedback

- 2026-05-31: Tron via PO directed S17 2nd extension. CMM4 4-role enforced. Awaiting req anchor + architect design.

## Subtasks

Architect may split into T136.1 (Requirement parser), T136.2 (UseCase parser), T136.3 (TraceLink hook), T136.4 (idempotency + integration test) — decision at refinement.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 7 (S17 2nd extension)*
*Owners (CMM4): robbin-req (req anchor), robbin-architect (design lead), robbin-expert (impl), robbin-tester (verify)*
*Priority: 2 (completes T128 coverage — required for T129 full-graph verification)*
