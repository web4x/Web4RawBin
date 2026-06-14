# T124: Scenario-unit + IOR + class-based view architecture
[task:uuid:f96a9da3-366c-491f-b2e6-78cbb837f203]

## Status

- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect + req JOINT — Tron-assigned)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**Children:**
- [🔗 T124.1: Architect — Scenario-Unit + IOR Data Model](../task/task-124.1-architect-data-model.md)
- [🔗 T124.2: Architect — View Template Architecture](../task/task-124.2-architect-view-templates.md)
- [🔗 T124.3: Architect — Storage Layout (Index + Speaking-Name Trees)](../task/task-124.3-architect-storage-layout.md)


## Traceability

`[task:uuid:f96a9da3-366c-491f-b2e6-78cbb837f203]`

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) (Tron 2026-05-30, verbatim)
  - **requirements (covered by this parent):** R17.1 scenario-unit · R17.2 IOR · R17.3 class-based instances · R17.7 view templates · R17.15 collaborative planning (process)
  - **requirement:uuids** — req-eng to formalize in `requirements.md` (T124.4) using real v4 UUIDs per learnings #17
- down
  - T124.1 architect — scenario-unit + IOR data model
  - T124.2 architect — view template architecture
  - T124.3 architect — storage layout (scenario/index + sprints.json/ + sprints.md/)
  - T124.4 req-eng — formal requirements.md (R17.1-R17.15)
  - T124.5 req-eng — traceability standard update (chain incl. IOR)
  - T124.6 architect — PUML use cases for the new classes
- chain (req → usecase → puml → class/method)
  - **requirement:** R17.1-R17.3, R17.7, R17.15 (formalized in T124.4)
  - **use case:** Phase-1 UCs in T124.6 PUML (TBD by architect)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect creates in T124.6)
  - **class/method:** the class model designed here IS the deliverable; first concrete class/methods land in T125
- enables
  - T125 foundation implementation
  - T128 migration strategy

## Task Description

Design the scenario-unit + IOR + class-based view architecture and formalize the
requirements. Two-track JOINT refinement (architect + req-eng), with planner
maintaining structure:

**Architect track (T124.1-T124.3 + T124.6):**
- Define `Unit` base and `IOR` primitive (resolution rules, serialization, errors).
- Define the 7 classes: `Requirement`, `Task`, `UseCase`, `Class`, `Method`, `Test`, `Sprint`. Each = `{ior, model, ownerIor}`. `model` carries class-specific attributes + IOR links to related instances.
- Design the view template architecture: per-class HTML + MD templates, registered against class IDs, live-updated from flat JSON (pure-function rendering).
- Design storage layout: canonical `scenario/index/<first-5-chars-of-uuid>/<uuid>.scenario.json`; speaking-name `ln`-symlink tree under `scenarios/sprints.json/`; generated MD tree under `scenarios/sprints.md/`.
- PUML use cases for Phase 1: `unit.load`, `ior.resolve`, `view.render`, `index.put`, `tree.symlink`, etc. as first-class `<<UseCase>>` instances (consumes T117 machinery).

**Req-eng track (T124.4-T124.5):**
- Formalize R17.1-R17.15 in a new `requirements.md` for Sprint 17, each as `[requirement:uuid:<v4>]` per learnings #17 (NO invented-prefix uuids).
- Update `scrum.pmo/standards/traceability-standard.md` to:
  - Add the **IOR** node alongside path-based references
  - Note that the chain `req → task → useCase → class → method → test` now flows through `{ior, model, ownerIor}` units
  - Document the scenario-unit JSON shape as the canonical persistence format
  - Cross-link from the standard back to T124's class model

**Planner track (this file + sub-task index):**
- Maintain T124's planning entry in S17 planning.md
- Add T124.1-T124.6 to the sub-task list as their files land
- Symbol maintenance on T124 itself (⏳→📝 when refinement done, etc.)

## Acceptance Criteria

- [ ] AC1 — `requirements.md` exists in `sprint-17-scenario-units/` with R17.1-R17.15 each carrying a proper v4 `requirement:uuid` (no invented `r17-*` strings; learnings #17)
- [ ] AC2 — Architect design committed in T124.1-T124.3 + T124.6 sub-task files (data model, view templates, storage layout, PUML)
- [ ] AC3 — `traceability-standard.md` updated to include IOR + scenario-unit + the canonical chain
- [ ] AC4 — `s17-usecases.puml` exists in `diagrams/` with Phase-1 use cases as `<<UseCase>>` instances
- [ ] AC5 — Planning.md reflects the refinement state (T124 ⏳→📝); architect+req sign off
- [ ] AC6 — No client surface change in this parent — version bump deferred to T125 impl (per #15; T124 is documentation-only, exempt)

## QA Audit & User Feedback

- 2026-05-30: Tron directive — collaborative architect+req+planner plan. Source: compound-requirement-source.md verbatim. Awaiting JOINT refinement, then Tron QA on the design.

## Subtasks

T124.1 (architect), T124.2 (architect), T124.3 (architect), T124.4 (req-eng), T124.5 (req-eng), T124.6 (architect). Sub-task files created BY their owning role during refinement.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 1*
*Owners (JOINT): robbin-architect (design lead), robbin-req (requirements lead), robbin-planner (structure)*
*Priority: 1 (foundation — gates everything downstream)*
