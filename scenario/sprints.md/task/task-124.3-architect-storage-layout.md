# T124.3: Architect — Storage Layout (Index + Speaking-Name Trees)
[task:uuid:c93f69d5-a2e4-4b18-b956-4d7e2f03c8b1]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing
  - [x] testing (design task: architect self-review via Tron-iteration 9423fac + 1d80807 + 0fc5b90 5-level-deep — PO 2026-05-31)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**UseCases:**
- [🔗 index.put](../usecase/index-put.md)
- [🔗 index.get](../usecase/index-get.md)
- [🔗 tree.symlinkJson](../usecase/tree-symlinkjson.md)


## Traceability

`[task:uuid:c93f69d5-a2e4-4b18-b956-4d7e2f03c8b1]`

- up
  - [T124: Scenario-unit + IOR + class-based view architecture](./task-124-architecture.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) → **R17.4** (index by UUID prefix), **R17.5** (speaking-name JSON tree), **R17.6** (speaking-name MD tree), **R17.11** (file-browser ↔ traceability-browser navigation), **R17.12** (all files are units)
- down
  - None (atomic sub-task)
- chain (req → usecase → puml → class/method)
  - **requirement:** R17.4 + R17.5 + R17.6 + R17.11 + R17.12
  - **use case:** index.put [uc:uuid:17a00104-0004-4a04-a004-000017010004], index.get [uc:uuid:17a00105-0005-4a05-a005-000017010005], tree.symlinkJson [uc:uuid:17a00201-0001-4a01-a001-000017020001], tree.generateMd [uc:uuid:17a00202-0002-4a02-a002-000017020002], tree.navigate [uc:uuid:17a00203-0003-4a03-a003-000017020003]
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (Phase 1+2 packages)
  - **class/method:** ScenarioIndex, SpeakingTree (design — impl in T125/T126)

## Task Description

Design the 3-layer storage layout: canonical UUID index, speaking-name symlink tree (JSON), and generated MD view tree. Plus file-browser ↔ traceability-browser navigation.

## Context

Tron 2026-05-30 (verbatim): "uuid identified instances are units in a data directory in scenario/index in which has folders from the first 5 characters of the uuid and there stores the original uuid.scenario.json. under scenarios/sprints.json/ create a file tree of ln links to the json index with speaking names like in sprint 1 and task1 and task 1.1. in scenarios/sprints.md/ have the resulting structured md views from the templates with the same speaking names as in the sprints.json/ folder."

## Acceptance Criteria

- [x] AC1 — Canonical index layout: `scenario/index/<5-char>/<uuid>.scenario.json`
- [x] AC2 — Speaking-name JSON tree: `scenarios/sprints.json/<sprint>/<task>/` with ln symlinks
- [x] AC3 — Generated MD tree: `scenarios/sprints.md/<sprint>/<task>/` with rendered views
- [x] AC4 — File-browser ↔ traceability-browser navigation bridge documented
- [x] AC5 — Migration path from current scrum.pmo/ layout documented
- [ ] AC6 — PO + Tron reviewed

## QA Audit & User Feedback

- 2026-05-30: Design authored. Awaiting PO + Tron review.

## Subtasks

None (atomic sub-task).

---
