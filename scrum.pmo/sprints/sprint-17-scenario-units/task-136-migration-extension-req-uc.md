[Back to Sprint 17 Planning](./planning.md)

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

## Assigned (CMM4 4-role per learnings #18)
1. **robbin-req** — capture verbatim Tron quote; clarify which req/UC sources are in scope
2. **robbin-architect** — design the migration extension: Requirement + UseCase scanners, IOR conventions, owner-IOR rules
3. **robbin-expert** — extend `scripts/migrate-to-scenario.ts` (T128.1's tool) to emit Requirement + UseCase scenario units
4. **robbin-tester** — verify migrated reqs+UCs round-trip, IOR resolves, T128.1 exemplar regenerates clean

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

## Architect Design — robbin-architect (2026-05-31)

### Overview
Two new parsers for `migrate-to-scenario.ts`. TraceConsistency already parses both sources for the in-memory graph (Pass 1: requirements, Pass 4: UseCases) — the migration script emits the same data as on-disk scenario units.

### Parser 1: `migrateRequirements(sprintDir, sprintUuid, idx)`
**Source:** `<sprintDir>/requirements.md` — split by `[requirement:uuid:<v4>]` tag
**Extracts:** uuid, title (firstLine), tronQuote (> line), task slugs (→ [T<N>] links)
**Emits:** `{ior:"ior:class:Requirement", model:{uuid, name, description, tronQuote, tasks:[]}, ownerIor:"ior:instance:<sprintUuid>"}`
**Idempotency:** `idx.exists(uuid)` check — skip if already indexed (uuid from source, not generated)

### Parser 2: `migrateUseCases(sprintDir, sprintUuid, idx)`
**Source:** `<sprintDir>/diagrams/*-usecases.puml` — parse `<<UseCase>>` stereotyped classes
**Regex:** `class "([^"]+)" <<UseCase>> \{([^}]+)\}` (same as TraceConsistency parseUseCaseBlocks)
**Extracts:** name (Object.verb), [uc:uuid], task ref, requirement ref from body fields
**Emits:** `{ior:"ior:class:UseCase", model:{uuid, name, object, verb, tasks:[], classes:[], requirement}, ownerIor:"ior:instance:<sprintUuid>"}`

### Post-Parse: IOR Resolution + TraceLink Emission
After Sprint+Task+Req+UC all parsed, resolve slug refs to `ior:instance:<uuid>`:
- `requirement.model.tasks["task-1"] → "ior:instance:<task-1-uuid>"`
- For each resolved cross-ref, emit a TraceLink unit (T134 hook): `{ior:"ior:class:TraceLink", model:{from, to, relation:"implements"}}`
- TraceLink UUID: `crypto.createHash('sha256').update(fromUuid+toUuid+relation).digest('hex').slice(0,32)` formatted as v4 — deterministic, idempotent

### Speaking-Name Tree Extension
New subdirs: `scenario/sprints.json/sprint-N/requirements/` + `usecases/` with ln symlinks. Same in `sprints.md/`.

### Integration
No new CLI flags — requirements+usecases always emitted when source files exist. `--dry-run`/`--apply` gates all writes.

## Acceptance Criteria
- [ ] AC1 — `migrate-to-scenario.ts` extended with `--include-requirements` + `--include-usecases` flags (or default-on; architect picks)
- [ ] AC2 — Running migration on Sprint 1 emits all Requirement + UseCase units from its sources; round-trip via IOR.resolve()
- [ ] AC3 — TraceLink units emitted for every `Requirement → Task` and `UseCase → {Task, Method}` cross-reference
- [ ] AC4 — Idempotent: re-running on the same sources does not duplicate units (existing v4 uuid used as index key)
- [ ] AC5 — T128.1 exemplar regenerated cleanly with the extension; `scenario/sprints.md/` tree now includes `/requirement/` + `/useCase/` peers to `/task/`
- [ ] AC6 — `npm run trace:check` clean (no new orphans); graph object count grows by the emitted reqs+UCs
- [ ] AC7 — `npm run build` + suite passes; rule-pair: (a)+(b) per #15 (data emission counts as user-visible since /md/ and /trace will surface the new units); (c) STATIC_SHELL exempt unless new route

## Test Scenarios
| Test | Action | Expected |
|------|--------|----------|
| TS1 | Migrate Sprint 1 with --include-requirements --include-usecases | scenario/index has Requirement + UseCase units |
| TS2 | Re-run migration on same input | No duplicates; same uuids |
| TS3 | IOR.resolve("requirement:<uuid>") for a migrated req | Returns the Requirement unit with verbatim Tron quote |
| TS4 | trace-cli check post-migration | Orphan-req count decreases; orphan-UC count decreases |
| TS5 | Browse /md/scenarios/sprints.md/sprint-1/requirement/ | Generated MD views render per the Requirement template |

## Dependencies
- **Requires:** T128 (migration parent), T125 (classes), T126 (Requirement+UseCase templates), T134 (TraceLink for cross-references), T135 (req-audit cleans the source)
- **Enables:** T128.2/.3 closed/active batches can run with full coverage; T129 re-verification with reduced allowlist

## Drive Plan (planner-coordinated, CMM4)
1. **req-eng** anchors verbatim Tron quote; confirms scope (S10-S17 vs all sprints)
2. **architect** designs the parser extension + IOR conventions
3. **expert** implements per design (small commits per parser)
4. **tester** runs TS1-TS5 + manual graph inspection

## Definition of Done
- [ ] All AC met; sub-tasks committed
- [ ] Rule-pair held
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-31: Tron via PO directed S17 2nd extension. CMM4 4-role enforced. Awaiting req anchor + architect design.

## Subtasks
Architect may split into T136.1 (Requirement parser), T136.2 (UseCase parser), T136.3 (TraceLink hook), T136.4 (idempotency + integration test) — decision at refinement.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 7 (S17 2nd extension)*
*Owners (CMM4): robbin-req (req anchor), robbin-architect (design lead), robbin-expert (impl), robbin-tester (verify)*
*Priority: 2 (completes T128 coverage — required for T129 full-graph verification)*
