<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T126: Generated views — planning.md, sprints.md, per-instance .md/.html

[task:uuid:6315a667-59c4-420b-90db-f60bca2d315d]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:6315a667-59c4-420b-90db-f60bca2d315d]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirements:** R17.7 HTML view templates per class · R17.8 views generated + live-updated · R17.9 planning.md as generated Task overview · R17.10 sprint overview as list of sprint items
  - **requirement:uuids** — T124.4 requirements.md
- down
  - T126.1 — planning.md generator (Task-overview view from instances)
  - T126.2 — sprint.md / sprints.md generator (sprint overview = list of Sprint items)
  - T126.3 — per-instance `.md` + `.html` views for Requirement/Task/UseCase/Class/Method/Test/Sprint
- chain
  - **requirement:** R17.7-R17.10
  - **use case:** template.register, view.render, planning.regenerate, sprint.overview.regenerate (T124.6 PUML)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** `src/ts/scenario/` template engine + `scripts/regenerate-views.ts` (one-shot + watch mode)
- requires
  - T125 (template engine + class instances)
- enables
  - T127 navigation (views are the link targets)
  - T128 migration (migrated sprints produce generated views)

## Task Description

Turn the registered per-class templates (T125.4) into actual generated content
filling every existing planning + per-task surface.

**Per the architecture (T124.2):**
- T126.1 — planning.md becomes a **generated** Task-overview view: regenerated from the Task instances in the sprint's scenario/index. NO hand-edited prose survives.
- T126.2 — sprint overview = list of Sprint items: `scenarios/sprints.md/` is a generated tree mirroring `scenarios/sprints.json/`; sprint-level `planning.md` is a generated list of Task views.
- T126.3 — every instance class (Requirement/Task/UseCase/Class/Method/Test/Sprint) has its own `.md` + `.html` view rendered from the registered template.

Live-update model: when a scenario.json changes, the corresponding view(s)
re-render (file-watcher + on-demand build). Pure-function rendering — no
template ever invokes class methods; templates read only the `model` flat JSON.

**Tron refinements (2026-05-31, via T124.2 update):**
1. **Subtask indentation:** planning.md + sprint overview render children IOR → 2-space indented under parent task (task-1.1 visually nested under task-1), matching Sprint 1 reference structure.
2. **Speaking-name filenames:** generated files use `task-1-team-bootstrap.md` (slugified model.name), NOT `<uuid>.md`. Must match scrum.pmo/ naming convention.
3. **Speaking-name hrefs:** all markdown links use speaking-name paths (e.g., `[T1.1: Clone](./task-1.1-clone-ud-team.md)`), NOT uuid paths. Links must resolve (no 404).
4. **404 page:** when a speaking-name URL resolves to no file, render a "Not Found" page with `← Back to Sprint Overview` + `← All Sprints` links (parent always derivable: task → sprint, sprint → overview).

## Acceptance Criteria

- [ ] AC1 — `regenerate-views` command emits `planning.md` for at least one migrated sprint from its Task instances (no hand-edited prose left)
- [ ] AC2 — `scenarios/sprints.md/<speaking-name>/...` tree generated, mirroring `scenarios/sprints.json/`
- [ ] AC3 — Each of the 7 classes has a registered HTML + MD template; sample views render correctly
- [ ] AC4 — Live-update verified: editing a scenario.json triggers re-render of its `.md` + `.html` views
- [ ] AC5 — vitest covers template registry + render + regenerate flows
- [ ] AC6 — `npm run build` succeeds; full suite passes; **version + sw.js bumped per #15**; **STATIC_SHELL entry per #16 if a new /views or /md route is introduced** (architect to decide in T124.2 — flag in commit)

## Dependencies

- **Requires:** T125 (foundation primitives + templates)
- **Enables:** T127 (nav into views), T128 (migrated sprints land via these generators)

## Definition of Done

- [ ] All AC met; sub-tasks T126.1-T126.3 committed
- [ ] Rule-pair #15 + #16 verified (route introduction call documented in commit)
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-30: Planned — awaiting T125, then expert implementation per T124.2 view-template design.

## Subtasks

T126.1, T126.2, T126.3 — files created by expert during refinement.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 3*
*Owner: robbin-expert (impl), robbin-tester (verify)*
*Priority: 3 (views — gates user-visible migration)*
