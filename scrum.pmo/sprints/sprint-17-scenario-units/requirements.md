[Back to Planning](./planning.md)

# Sprint 17 — Requirements

**Source:** Tron directives 2026-05-30 + 2026-05-31 (3 extensions). Verbatim source preserved in [compound-requirement-source.md](./compound-requirement-source.md).

---

## Data Model

- [ ] **R17.1: Scenario JSON unit — every instance is uuid.scenario.json**
  [requirement:uuid:cb93f0db-0e42-4795-b41f-2e125120f259]
  > TRON DIRECTIVE: "each instance becomes the same scenario json format where just the class model attributes varies. the json has { ior, model, ownerIor }"
  → [T131: File-browser symlink support](./task-131-file-browser-symlinks.md)

- [ ] **R17.2: IOR (Internet Object Reference) — universal reference handle**
  [requirement:uuid:3b6cce5a-581c-4325-88b2-b9d381c7f268]
  > TRON DIRECTIVE: "the data shall be in uuid.scenario.json that contains an ior [internet object reference], that can load the class Task to process the file and create the views."
  → [T132: HTML status template fix](./task-132-html-status-template-fix.md)

- [ ] **R17.3: Task status as state-machine methods on the Task class**
  [requirement:uuid:bebee55d-7d39-4f0c-b7de-d56e72d01363]
  > TRON DIRECTIVE: "the tasks statuses must be methods of task class that trigger a task state machine until a task is done."
  → [T133: Task state-machine + status methods](./task-133-task-state-machine.md)

## Traceability

- [ ] **R17.4: Traceability links → first-class scenario units**
  [requirement:uuid:dd8709c3-f076-431e-a4be-64a875cb8888]
  > TRON DIRECTIVE: "the traceability needs to be converted to uuid.scenario.json of the traced type as atomic units in the index with ln links"
  → [T134: Traceability-as-units](./task-134-traceability-as-units.md)

- [ ] **R17.24: UC/Class/Method unit carries exact source location + git anchor**
  [requirement:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921]
  > TRON DIRECTIVE: "use case json must track the exact locations in the exact puml file units for tracability as well as classes and methods as iors to the git location and commit of the file"
  → [T140: Source-location IOR for UC/Class/Method units](./task-140-source-location-ior.md)

  Model MUST track: (a) exact source FILE (.puml for UC, .ts for Class/Method); (b) exact location within file (line range); (c) git commit SHA. Expressed as `ior:file:<repo-path>?commit=<sha>&lines=<start>-<end>`.

## Process & Skills

- [ ] **R17.5: Req-eng + planner LEARN to use scenarios for planning**
  [requirement:uuid:891f1983-7486-474a-80fb-740a9d843621]
  > TRON DIRECTIVE: "make them learn to use scenarios to plan in future. they shall order skills on top of the new implementation to plan and trace work."
  → [T137: req + planner learn scenarios](./task-137-req-planner-learn-scenarios.md)

- [ ] **R17.6: Skills on top of scenarios**
  [requirement:uuid:39a893de-1e86-4d0e-ace4-c09be2d42bdb]
  > TRON DIRECTIVE: "they shall order skills on top of the new implementation to plan and trace work. add that to sprint 17."
  → [T138: Skill set on scenarios](./task-138-skill-set-scenarios.md)

- [ ] **R17.7: Fork skill-expert from expert**
  [requirement:uuid:9dedeb00-6038-4c43-bcd4-efab99792be1]
  > TRON DIRECTIVE: "decide yourself to give the skill development to the expert, or agent trainer (would need much context) or to fork an skill-expert from the expert"
  → [T139: Fork skill-expert](./task-139-fork-skill-expert.md)

## Migration

- [ ] **R17.9: Requirement + UseCase units in scenario index**
  [requirement:uuid:024c7b8f-f314-4745-a998-85b87cd09b09]
  > TRON DIRECTIVE: "i do not see uuid.scenario.JSON for requirements and use cases"
  → [T136: Migration extension — Requirement + UseCase units](./task-136-migration-extension-req-uc.md)

## Audit & Formalization

- [ ] **R17.10: Tron prompts → formal requirement units (audit backlog)**
  [requirement:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921]
  > TRON DIRECTIVE: "i do not see my latest prompts reflected as requirements from the req agent"
  → [T135: req-audit — formalize backlog Tron quotes](./task-135-req-audit.md)

---

## UUID Index

| Requirement | UUID (short) | Task | Category |
|-------------|-------------|------|----------|
| R17.1 | `cb93f0db` | T131 | Data model |
| R17.2 | `3b6cce5a` | T132 | Data model |
| R17.3 | `bebee55d` | T133 | Data model |
| R17.4 | `dd8709c3` | T134 | Traceability |
| R17.24 | `47a86209` | T140 | Traceability |
| R17.5 | `891f1983` | T137 | Process |
| R17.6 | `39a893de` | T138 | Skills |
| R17.7 | `9dedeb00` | T139 | Skills |
| R17.8 | `47a86209` | T135 | Audit |
