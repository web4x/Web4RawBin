[Back to Planning](./planning.md)

# Sprint 17 — Requirements

**Source:** Tron directives 2026-05-30 + 2026-05-31 (3 extensions). Verbatim source preserved in [compound-requirement-source.md](./compound-requirement-source.md).

---

## Data Model (original directive)

- [ ] **R17.1: Scenario JSON unit — every instance is uuid.scenario.json**
  [requirement:uuid:cb93f0db-0e42-4795-b41f-2e125120f259]
  > TRON: "each instance becomes the same scenario json format where just the class model attributes varies. the json has { ior, model, ownerIor }"
  → [T131](./task-131-file-browser-symlinks.md), [T125](./task-125-foundation.md)

- [ ] **R17.2: IOR — universal reference handle**
  [requirement:uuid:3b6cce5a-581c-4325-88b2-b9d381c7f268]
  > TRON: "the data shall be in uuid.scenario.json that contains an ior [internet object reference], that can load the class Task to process the file and create the views."
  → [T132](./task-132-html-status-template-fix.md), [T125](./task-125-foundation.md)

- [ ] **R17.3: Class-based instances — typed classes with uniform wrapper**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000003]
  > TRON: "the templates should be like the html registered view for the classes Requirement, Task, UseCase … each Task and requirement shall have its own md, html view strictly from the view templates."
  → [T125](./task-125-foundation.md)

## Storage Layout (original directive)

- [ ] **R17.4: Index by UUID prefix — scenario/index/<first-5>/<uuid>.scenario.json**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000004]
  > TRON: "uuid identified instances are units in a data directory in scenario/index in which has folders from the first 5 characters of the uuid and there stores the original uuid.scenario.json."
  → [T124.3](./task-124.3-architect-storage-layout.md)

- [ ] **R17.5: Speaking-name tree (json) — symlink tree with human names**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000005]
  > TRON: "under scenarios/sprints.json/ create a file tree of ln links to the json index with speaking names like in sprint 1 and task1 and task 1.1"
  → [T128](./task-128-migration.md)

- [ ] **R17.6: Speaking-name tree (md) — generated md views with same names**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000006]
  > TRON: "in scenarios/sprints.md/ have the resulting structured md views from the templates with the same speaking names as in the sprints.json/ folder"
  → [T126](./task-126-views.md)

## Views & Templates (original directive)

- [ ] **R17.7: HTML view templates per class**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000007]
  > TRON: "the templates should be like the html registered view for the classes Requirement, Task, UseCase … each Task and requirement shall have its own md, html view strictly from the view templates."
  → [T126](./task-126-views.md)

- [ ] **R17.8: Views generated + live-updated from flat JSON**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000008]
  > TRON: "views are purely generated and live updated from the flat json data"
  → [T126](./task-126-views.md)

- [ ] **R17.9: planning.md is a generated Task-overview**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000009]
  > TRON: "planning.md becomes an task overview from task item views as md and html views."
  → [T126](./task-126-views.md)

- [ ] **R17.10: Sprint overview = list of sprint items**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000010]
  > TRON: "the sprint overview becomes a list of sprint items and so on for the involved classes."
  → [T126](./task-126-views.md)

## Navigation & Traceability (original directive)

- [ ] **R17.11: File-browser ↔ traceability-browser navigation**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000011]
  > TRON: "there shall be navigation between the file browse and the traceability browser possible."
  → [T127](./task-127-ior-resolver.md)

- [ ] **R17.12: All files are units, referenceable via IOR**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000012]
  > TRON: "all files are units and can be referenced via ior also as a scenario."
  → [T125](./task-125-foundation.md)

- [ ] **R17.13: Method → task → requirement traceability**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000013]
  > TRON: "each method must be traced completely back to a task and a requirement."
  → [T134](./task-134-traceability-as-units.md)

## Migration (original directive)

- [ ] **R17.14: Migrate all sprints/tasks/requirements to scenario units**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000014]
  > TRON: "migrate all sprints, tasks, requirements like this with references to classes, tests and puml usecases and classes and verb/methods."
  → [T128](./task-128-migration.md)

## Process (original directive)

- [ ] **R17.15: Collaborative planning — architect + req + planner**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000015]
  > TRON: "plan that in an collaborative action of the architect, the req agent and the planner"
  → [T124](./task-124-architecture.md)

---

## Extension 1 (2026-05-31)

- [ ] **R17.16: HTML status renders correctly**
  [requirement:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000016]
  > TRON: "the task statuses will work like that in md but not in html."
  → [T132](./task-132-html-status-template-fix.md)

- [ ] **R17.17: Task status as state-machine methods**
  [requirement:uuid:bebee55d-7d39-4f0c-b7de-d56e72d01363]
  > TRON: "the tasks statuses must be methods of task class that trigger a task state machine until a task is done."
  → [T133](./task-133-task-state-machine.md)

- [ ] **R17.18: Traceability links → first-class scenario units**
  [requirement:uuid:dd8709c3-f076-431e-a4be-64a875cb8888]
  > TRON: "the traceability needs to be converted to uuid.scenario.json of the traced type as atomic units in the index with ln links"
  → [T134](./task-134-traceability-as-units.md)

## Extension 2 (2026-05-31)

- [ ] **R17.19: Tron prompts → formal requirement units**
  [requirement:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921]
  > TRON: "i do not see my latest prompts reflected as requirements from the req agent"
  → [T135](./task-135-req-audit.md)

- [ ] **R17.20: Requirement + UseCase units in scenario index**
  [requirement:uuid:024c7b8f-f314-4745-a998-85b87cd09b09]
  > TRON: "i do not see uuid.scenario.JSON for requirements and use cases"
  → [T136](./task-136-migration-extension-req-uc.md)

- [ ] **R17.21: Req-eng + planner LEARN scenarios for planning**
  [requirement:uuid:891f1983-7486-474a-80fb-740a9d843621]
  > TRON: "make them learn to use scenarios to plan in future."
  → [T137](./task-137-req-planner-learn-scenarios.md)

- [ ] **R17.22: Skills on top of scenarios**
  [requirement:uuid:39a893de-1e86-4d0e-ace4-c09be2d42bdb]
  > TRON: "they shall order skills on top of the new implementation to plan and trace work."
  → [T138](./task-138-skill-set-scenarios.md)

- [ ] **R17.23: Fork skill-expert from expert**
  [requirement:uuid:9dedeb00-6038-4c43-bcd4-efab99792be1]
  > TRON: "decide yourself to give the skill development to the expert, or agent trainer or to fork an skill-expert from the expert"
  → [T139](./task-139-fork-skill-expert.md)

## Extension 3 (2026-05-31)

- [ ] **R17.24: UC/Class/Method unit carries exact source location + git anchor**
  [requirement:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921]
  > TRON: "use case json must track the exact locations in the exact puml file units for tracability as well as classes and methods as iors to the git location and commit of the file"
  → [T140](./task-140-source-location-ior.md)

## Extension (PO-relayed, 2026-05-31)

- [ ] **R17.25: Generated MD views show chain-link icon → symlink JSON source**
  [requirement:uuid:3726f28b-66b1-44fc-b883-4000b3914596]
  > TRON: "in scenario/sprints.md/usecase/ <file>.md add a chain link symbol before the edit to link to the original ln file in scenario/sprints.json/…"
  → Task TBD (planner to stand up)

## Extension 4 (2026-05-31 — traceability is a TREE)

- [ ] **R17.26: Traceability is a TREE, not a chain**
  [requirement:uuid:eca7cb3f-8346-4658-9e85-5c1e2453956b]
  > TRON: "thats basically good. but chain is actually a tree. each element should be a link. all are based on typed scenarios... sharpen that in the planning and rework the refined tasks"
  → Task TBD (planner to assign — rework all task Traceability sections)

  The `## Chain` / linear sequence framing (req → uc → puml → class/method) is wrong; the real structure is a TREE that branches at every level. Rename `## Chain` → `## Traceability` and render hierarchically.

- [ ] **R17.27: Every traceability element is a clickable link**
  [requirement:uuid:b2f3a4e5-c6d7-4e8f-9a01-2b3c4d5e6f27]
  > TRON: "each element should be a link"
  → Task TBD

  In BOTH task files AND generated views, every referenced node (Requirement/UseCase/PUML/Class/Method/Task/Subtask/Test/TraceLink) MUST be a clickable link to its scenario-unit view. No plain text references.

- [ ] **R17.28: All traceability elements are typed scenarios**
  [requirement:uuid:c3a4b5e6-d7e8-4f90-a1b2-3c4d5e6f7028]
  > TRON: "all are based on typed scenarios"
  → Task TBD

  Every node in the traceability tree IS a typed scenario unit (no bare strings) — the tree is a graph of `ior:instance:<uuid>` references resolved through ClassLoader + ViewTemplateRegistry.

- [ ] **R17.29: Sharpen planning + rework refined task files**
  [requirement:uuid:d4b5c6e7-e8f9-4a01-b2c3-4d5e6f708029]
  > TRON: "sharpen that in the planning and rework the refined tasks"
  → Task TBD

  Update S17 `planning.md` AND rework every refined task file (T124.x, T125-T142) so the Traceability section is tree-of-typed-scenario-links.

---

## Atomic Requirements (R-I retroactive split — T167-T172)

> Per Tron R-I: "let the req agent split tasks into one sentence requirements"
> Each atomic requirement is one sentence = one chain root per R-E.

### From T167 (R-D: mobile-first + width-cap)

- [ ] **R17.30: The /trace layout uses mobile-first responsive design.**
  [requirement:uuid:102241ef-0c2c-4c6c-bc7b-c9e46b4a7b1c]
  → [T167](./task-167-trace-mobile-first-layout-width-cap.md)

- [ ] **R17.31: The right detail pane has a hard max-width equal to the current window size.**
  [requirement:uuid:0f179ef0-a30b-4f35-80f4-a3b27d5f4ab1]
  → [T167](./task-167-trace-mobile-first-layout-width-cap.md)

### From T168 (R-E: chain order + roots)

- [ ] **R17.32: The traceability chain starts with atomic requirements as roots.**
  [requirement:uuid:5571ea1c-dc6e-4831-8085-e1c5d14d1d8e]
  → [T168](./task-168-chain-order-7-step-requirements-as-roots.md)

- [ ] **R17.33: The chain order is requirement → task → usecase(s) → class → method → implementation → test(s).**
  [requirement:uuid:d63e74f8-a9b0-4c12-3d4e-5f6a7b890033]
  → [T168](./task-168-chain-order-7-step-requirements-as-roots.md)

- [ ] **R17.34: Implementation traces finally to test.**
  [requirement:uuid:e74f85a9-b0c1-4d23-4e5f-6a7b8c900034]
  → [T168](./task-168-chain-order-7-step-requirements-as-roots.md)

- [ ] **R17.35: One implementation can have multiple tests (1:N cardinality).**
  [requirement:uuid:42b8519d-8ace-4c4f-9576-2665dd0712c5]
  → [T168](./task-168-chain-order-7-step-requirements-as-roots.md)

### From T169 (R-F: data quality — KEYSTONE)

- [ ] **R17.36: Every scenario unit is reachable from a requirement root via the canonical chain.**
  [requirement:uuid:a718fcd9-e07d-452c-acb2-ce2dd504c579]
  → [T169](./task-169-data-quality-audit-remigrate-complete-tree.md)

- [ ] **R17.37: Zero backward-direction links exist in the traceability data.**
  [requirement:uuid:b07c18d2-e3f4-4a56-7b8c-9d0e1f230037]
  → [T169](./task-169-data-quality-audit-remigrate-complete-tree.md)

- [ ] **R17.38: Zero orphan scenario units exist in the index.**
  [requirement:uuid:c18d29e3-f4a5-4b67-8c9d-0e1f2a340038]
  → [T169](./task-169-data-quality-audit-remigrate-complete-tree.md)

### From T170 (R-G: no-stop sustain)

- [ ] **R17.39: A data-quality CI gate fails the build on traceability violations.**
  [requirement:uuid:d29e3af4-a5b6-4c78-9d0e-1f2a3b450039]
  → [T170](./task-170-diligent-plan-no-stop-sustain.md)

- [ ] **R17.40: A rule-pair CI gate enforces package.json + sw.js bumps in every user-facing commit.**
  [requirement:uuid:8534a8e5-8928-4df4-bb06-1d1bb9f66a37]
  → [T170](./task-170-diligent-plan-no-stop-sustain.md)

- [ ] **R17.41: A chain-order CI gate validates the 7-step canonical chain on every commit.**
  [requirement:uuid:2ee82738-250e-4e5a-a58b-31c9c800ba92]
  → [T170](./task-170-diligent-plan-no-stop-sustain.md)

- [ ] **R17.42: The scrum master is re-activated for continuous monitoring.**
  [requirement:uuid:8e451a90-2ed8-45eb-8b68-52cd0569abce]
  → [T170](./task-170-diligent-plan-no-stop-sustain.md)

### From T171 (untraced closure)

- [ ] **R17.43: All 50 untraced scenario units are linked to a requirement root or explicitly marked orphan-by-design.**
  [requirement:uuid:a246352a-c71c-4170-810d-73c49d9a458b]
  → [T171](./task-171-untraced-closure-link-50-r1726-link-back.md)

- [ ] **R17.44: R17.26 links forward to its implementing tasks T165 and T166.**
  [requirement:uuid:24ae6d41-2165-40cd-8b4a-483e860f8923]
  → [T171](./task-171-untraced-closure-link-50-r1726-link-back.md)

### From T172 (R-H: direction enforcement + data fill)

- [ ] **R17.45: Every link in the scenario index traverses the canonical chain in the forward direction only.**
  [requirement:uuid:f17b1887-07f8-4b74-8112-8fa08308afee]
  → [T172](./task-172-chain-direction-enforcement-missing-data-fill.md)

- [ ] **R17.46: Missing traceability data is filled consistently by req-eng and architect.**
  [requirement:uuid:c0328d86-d7c3-428d-885e-c382b9382674]
  → [T172](./task-172-chain-direction-enforcement-missing-data-fill.md)

### From Tron R-J (test reachability)

- [ ] **R17.47: Every Test instance is reachable from a Requirement root via the canonical tracking chain.**
  [requirement:uuid:f0b1a2c3-c3d4-4e56-7f8a-9b0c1d230047]
  > TRON: "each tes must be rached by a tracking chain"
  → [T172](./task-172-chain-direction-enforcement-missing-data-fill.md)

---

## UUID Index

| Req | UUID (short) | Task(s) | Category |
|-----|-------------|---------|----------|
| R17.1 | `cb93f0db` | T125, T131 | Data model |
| R17.2 | `3b6cce5a` | T125, T132 | Data model |
| R17.3 | `...00003` | T125 | Data model |
| R17.4 | `...00004` | T124.3 | Storage |
| R17.5 | `...00005` | T128 | Storage |
| R17.6 | `...00006` | T126 | Storage |
| R17.7 | `...00007` | T126 | Views |
| R17.8 | `...00008` | T126 | Views |
| R17.9 | `...00009` | T126 | Views |
| R17.10 | `...00010` | T126 | Views |
| R17.11 | `...00011` | T127 | Navigation |
| R17.12 | `...00012` | T125 | Navigation |
| R17.13 | `...00013` | T134 | Traceability |
| R17.14 | `...00014` | T128 | Migration |
| R17.15 | `...00015` | T124 | Process |
| R17.16 | `...00016` | T132 | Ext 1 |
| R17.17 | `bebee55d` | T133 | Ext 1 |
| R17.18 | `dd8709c3` | T134 | Ext 1 |
| R17.19 | `47a86209` | T135 | Ext 2 |
| R17.20 | `024c7b8f` | T136 | Ext 2 |
| R17.21 | `891f1983` | T137 | Ext 2 |
| R17.22 | `39a893de` | T138 | Ext 2 |
| R17.23 | `9dedeb00` | T139 | Ext 2 |
| R17.24 | `47a86209` | T140 | Ext 3 |
| R17.25 | `7e4f8a2b` | TBD | Views |
| R17.26 | `a1e2f3d4` | TBD | Ext 4 |
| R17.27 | `b2f3a4e5` | TBD | Ext 4 |
| R17.28 | `c3a4b5e6` | TBD | Ext 4 |
| R17.29 | `d4b5c6e7` | TBD | Ext 4 |
| R17.30 | `a30b41c5` | T167 | R-I split (R-D) |
| R17.31 | `b41c52d6` | T167 | R-I split (R-D) |
| R17.32 | `c52d63e7` | T168 | R-I split (R-E) |
| R17.33 | `d63e74f8` | T168 | R-I split (R-E) |
| R17.34 | `e74f85a9` | T168 | R-I split (R-E) |
| R17.35 | `f85a96b0` | T168 | R-I split (R-E) |
| R17.36 | `a96b07c1` | T169 | R-I split (R-F) |
| R17.37 | `b07c18d2` | T169 | R-I split (R-F) |
| R17.38 | `c18d29e3` | T169 | R-I split (R-F) |
| R17.39 | `d29e3af4` | T170 | R-I split (R-G) |
| R17.40 | `e3af4ba5` | T170 | R-I split (R-G) |
| R17.41 | `f4ba5cb6` | T170 | R-I split (R-G) |
| R17.42 | `a5cb6dc7` | T170 | R-I split (R-G) |
| R17.43 | `b6dc7ed8` | T171 | R-I split |
| R17.44 | `c7ed8fe9` | T171 | R-I split |
| R17.45 | `d8fe90a1` | T172 | R-I split (R-H) |
| R17.46 | `e9a0f1b2` | T172 | R-I split (R-H) |
| R17.47 | `f0b1a2c3` | T172 | R-J (test reachability) |
