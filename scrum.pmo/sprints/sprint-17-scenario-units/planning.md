[Back to README](../../README.md) · [Sprints overview](../sprints.overview.md)

# Sprint 17 Planning — Scenario Units / IOR Data Model & Class Views

## Sprint Goal
Establish a uniform **scenario-unit** data model with **IOR** (Internet Object Reference)
addressing for every typed instance in the scrum.pmo universe (Requirement, Task,
UseCase, Class, Method, Test, Sprint, …). Generate all human-facing views (`.md`
+ `.html`) **strictly from registered per-class templates** off the flat JSON
data — no hand-edited per-task narrative survives migration. The traceability
chain (method → task → requirement) becomes a property of the graph, not the
prose. Then **migrate every existing sprint** to this model.

## Source & Requirements
- **Compound requirement source (Tron verbatim, 2026-05-30):**
  [compound-requirement-source.md](./compound-requirement-source.md)
- **Decomposition hints (req-eng refines into formal requirements):** R17.1–R17.15
  in the compound source. req-eng formalizes each as `requirement:uuid` in
  `requirements.md` (created in T124.4).

> **Progress legend** (per learnings #14):
> ⏳ planned · 📝 designed (refinement-done) · 🔧 implementing · ✅ impl-shipped · 🧪 testing · 🏁 Tron-QA-done
> Leaves `[ ]` Done semantic untouched = Tron's gate.

## Requirement → Task map
| Req | Summary | Parent task |
|-----|---------|-------------|
| R17.1–R17.3 | Scenario JSON unit · IOR · class-based instances | T124 (architecture) |
| R17.4–R17.6 | UUID-prefix index · sprints.json/ symlink tree · sprints.md/ generated tree | T125 (storage) |
| R17.7–R17.10 | HTML+MD view templates per class · live-update · planning.md/sprint.md as generated overviews | T126 (views) |
| R17.11–R17.12 | File-browser ↔ traceability-browser nav · IOR universal handler | T127 (navigation) |
| R17.14 | Migration of all sprints/tasks/requirements | T128 (migration) |
| R17.13 | Method → task → requirement traceability (chain integrity) | T129 (verification) |
| R17.15 | Collaborative planning (process) | this planning + T124 architecture |

## Task List

### Phase 1 — Architecture, Standards, Requirements (T124, architect + req)

- [ ] 🔧 [T124: Scenario-unit + IOR + class-based view architecture](./task-124-architecture.md)
  **Status:** refinement 4/6 done — architect: T124.1 data model + T124.6 PUML (1316b7e), T124.2 view template architecture/7 class templates (14b2821), T124.3 3-layer storage (9423fac). Remaining: T124.4 req-eng requirements.md + T124.5 standard update.
  **Owner:** robbin-architect (design lead), robbin-req (requirements), robbin-planner (structure)
  **Sub-tasks (architect/req to create during refinement, following Sprint 1 task-1.x pattern):**
  - T124.1 architect — scenario-unit + IOR data model (class diagram, JSON shape, resolution rules)
  - T124.2 architect — view template architecture (per-class HTML+MD templates, live-update model)
  - T124.3 architect — storage layout (scenario/index/<5char>/<uuid>.scenario.json + sprints.json/ symlink tree + sprints.md/ generated tree)
  - T124.4 req-eng — formal requirements.md (R17.1-R17.15 as `[requirement:uuid:<v4>]`)
  - T124.5 req-eng — traceability standard update (chain `req → task → useCase → class → method → test`; IOR replaces ad-hoc paths)
  - T124.6 architect — PUML: UseCase + Class + Method as first-class instances in s17 PUML (consumes T117 machinery)

### Phase 2 — Foundation Implementation (T125, expert)

- [ ] 🧪 [T125: Scenario-unit primitives + class system + storage](./task-125-foundation.md)
  **Status:** impl + testing DONE (9b79be3; tester ticked 4c630dd) — Tron QA pending
  **Rule-pair:** ✓ retroactively covered by b30b3de v0.5.28 bump (T125+T126+T127 unified batch — PWA-served surface lands with T127's nav wiring)
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  **Sub-tasks (expert to create during refinement):**
  - T125.1 — `Unit` base + `IOR` primitive (load/resolve/serialize)
  - T125.2 — class system: `Requirement`, `Task`, `UseCase`, `Class`, `Method`, `Test`, `Sprint` instances over uniform `{ior, model, ownerIor}`
  - T125.3 — storage layout (scenario/index UUID-prefix; `ln`-symlink tree under scenarios/sprints.json/ with speaking names)
  - T125.4 — view template engine: register per-class HTML+MD templates, live-update wiring (pure functions of flat JSON)

### Phase 3 — Generated Views (T126, expert)

- [ ] 🧪 [T126: Generated views — planning.md, sprints.md, per-instance .md/.html](./task-126-views.md)
  **Status:** impl + testing DONE (5a7e162; tester ticked 4c630dd) — Tron QA pending
  **Rule-pair:** ✓ retroactively covered by b30b3de v0.5.28 bump (unified batch with T125+T127)
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  **Sub-tasks:**
  - T126.1 — planning.md becomes a generated Task-overview view (built from Task instance views via the template)
  - T126.2 — sprint overview = list of sprint items (generated from Sprint instances); scenarios/sprints.md/ generated tree
  - T126.3 — per-instance `.md` + `.html` views for Requirement, Task, UseCase, Class, Method, Test, Sprint

### Phase 4 — Navigation (T127, expert)

- [ ] 🧪 [T127: File-browser ↔ traceability-browser nav + IOR universal handler](./task-127-navigation.md)
  **Status:** impl + testing DONE (b30b3de v0.5.28; tester ticked 4c630dd) — Tron QA pending
  **Rule-pair:** ✓ (a) package.json v0.5.28 ✓ (b) sw.js rawbin-v0.5.28 ✓ (c) STATIC_SHELL (no new route — explicitly noted by expert in commit message). Covers T125+T126 retroactively.
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  **Sub-tasks:**
  - T127.1 — file-browser ↔ traceability-browser bi-directional nav (every node in /trace links to its file; every file in /md links to its scenario)
  - T127.2 — IOR universal-reference handler: any file in the repo is a unit referenceable by IOR; IOR resolves to the right view via class registration

### Phase 5 — Migration (T128, planner + req + expert)

- [ ] 🧪 [T128: Migrate all existing sprints/tasks/requirements to scenario-unit model](./task-128-migration.md)
  **Status:** impl + testing DONE (T128.1 exemplar iteration burst through 60d6e36 v0.5.29; tester ticked 4c630dd) — Tron QA pending. T128.2/T128.3/T128.4 batches still gated on Tron approval of the exemplar shape.
  **Owner:** robbin-planner (structure), robbin-req (requirement units), robbin-expert (tooling), robbin-tester (verify)
  **Strategy:** generate scenario.json units from existing markdown task files; preserve `task:uuid` + `requirement:uuid` identities (T121 already regenerated to v4 — clean base); reuse Sprint 1 task-1/task-1.1 hierarchical structure as exemplar; closed sprints (S1-9) migrate as artifact (no rewrites of prose), active sprints (S10-S16) migrate with view regeneration.
  **Sub-tasks:**
  - T128.1 — exemplar migration: Sprint 1 task-1 + task-1.1 (Tron's preferred structural template)
  - T128.2 — batch migrate Sprints 2-9 (closed/QA'd, artifact-preserving)
  - T128.3 — batch migrate Sprints 10-16 (active, regenerate views)
  - T128.4 — method markers retrofit (every src/ method gets `[impl:uuid:]` linking up to a Task)

- [ ] 🧪 [T131: File-browser symlink support (FileApi + rb-file-tree)](./task-131-file-browser-symlinks.md)
  **Status:** impl + testing DONE (aad0816 v0.5.30; tester verified 37 markers per PO 2026-05-31; 818/818) — Tron QA pending
  **Rule-pair:** ✓ (a) v0.5.30 ✓ (b) sw.js rawbin-v0.5.30 ✓ (c) STATIC_SHELL exempt (no new route) — explicit in commit msg
  **CMM4 GAP:** retroactive stand-up — work shipped before planner stood it up; commit mis-labelled "T39" (unrelated S6 task); planner reconstructed the 4-role attribution. Going forward: tasks MUST be stood up BEFORE impl per learnings #18.

- [ ] 🧪 [T132: HTML status template fix](./task-132-html-status-template-fix.md)
  **Status:** impl + testing DONE (497cee2 architect design → 4a362d0 expert renderStatusHtml impl → 8e42361 tester verify, 830/830) — Tron QA pending
  **Rule-pair:** ✓ retroactively covered by 2f6dde2 v0.5.31 follow-up (T132/T133/T134 batch unified bump + T132 indent fix); STATIC_SHELL exempt (no new route)

- [ ] 🧪 [T133: Task state-machine + status methods](./task-133-task-state-machine.md)
  **Status:** impl + testing DONE (497cee2 architect FSM design → e062849 expert 7-state/8-verb impl with Tron gate → 8e42361 tester verify, 830/830) — Tron QA pending
  **Rule-pair:** ✓ retroactively covered by 2f6dde2 v0.5.31 unified bump
  **Owners (CMM4):** robbin-req (req anchor) → robbin-architect (FSM design + verb naming) → robbin-expert (impl on Task class) → robbin-tester (verify transitions + guards)
  **Rule-pair scope:** (a)+(b) required at impl; (c) depends on architect's surface decision

- [ ] 🧪 [T134: Traceability-as-units (links as scenario.json with ln in referenced instances + MD/HTML views)](./task-134-traceability-as-units.md)
  **Status:** impl + testing DONE (497cee2 architect design → f173cad expert TraceLink class + symlink emission + template → 8e42361 tester verify, 830/830) — Tron QA pending
  **Rule-pair:** ✓ retroactively covered by 2f6dde2 v0.5.31 unified bump

### Phase 7 — S17 2nd extension (Tron 2026-05-31)

- [ ] ⏳ [T135: req-audit — formalize backlog Tron quotes req missed](./task-135-req-audit.md)
  **Status:** PLANNED — closes T129's documented req-allowlist for S10-S17
  **Owners (CMM4):** robbin-req (audit lead) + robbin-planner (JOINT audit pass) → robbin-architect (review) → robbin-tester (verify)

- [ ] 🧪 [T136: Migration extension for Requirement + UseCase units](./task-136-migration-extension-req-uc.md)
  **Status:** impl + testing DONE (5073c3b architect design → 4b3dafb expert Requirement+UseCase parsers + TraceLink emission → 3b79545 tester verify, 834/834) — Tron QA pending
  **Rule-pair FLAG:** ⚠️ 4b3dafb shipped without package.json/sw.js bump despite AC7. Likely batching unified follow-up bump as with T132-T134 burst (which closed in 2f6dde2). Watch for it.

- [ ] ⏳ [T137: req + planner LEARN scenarios for planning + update SKILL.md](./task-137-req-planner-learn-scenarios.md)
  **Status:** PLANNED — req + planner SKILL.md adopt scenario-unit workflow (planning.md becomes a generated view)
  **Owners (CMM4):** robbin-req (own SKILL update) + robbin-planner (own SKILL update — this agent) JOINT → robbin-architect (peer review) → robbin-tester (verify)
  **Rule-pair scope:** docs-only — no bump

- [ ] 🧪 [T138: skill set on scenarios (capture-quote, propose-task, walk-chain)](./task-138-skill-set-scenarios.md)
  **Status:** impl + testing DONE (5073c3b architect design → 368f1d0 expert 4 skills: captureQuote, proposeTask, walkChain + **statusTransition** (architect added a 4th beyond original 3 — scope adjustment, healthy refinement) → 3b79545 tester verify, 834/834) — Tron QA pending
  **Rule-pair FLAG:** ⚠️ 368f1d0 shipped without bump despite AC7. Same pattern as T136 — watch for unified follow-up bump.

- [ ] ⏳ [T139: fork skill-expert from expert (PO decision; agent-trainer executes)](./task-139-fork-skill-expert.md)
  **Status:** PLANNED — new dedicated agent for the skill verb-set; PO decision-led, agent-trainer executes
  **Owners:** robbin-po (decision) + agent-trainer (execute) + robbin-req (anchor) + robbin-tester (boot verify)
  **Rule-pair scope:** docs-only (SKILL.md authoring) — no bump

- [ ] ⏳ [T141: chain-link icon → sprints.json symlink in generated MD views](./task-141-chain-link-icon-symlinks.md)
  **Status:** PLANNED — Tron via PO 2026-05-31. Generated MD views render `🔗 [Speaking Name](sprints.json/...)` on every cross-reference; UseCase template first, architect decides extend-to-all-7-templates scope.
  **Owners (CMM4):** robbin-req (req anchor) → robbin-architect (icon + helper + scope decision) → robbin-expert (impl) → robbin-tester (visual + click-through verify)
  **Rule-pair scope:** (a)+(b) required at impl (T126 output served via /md/); (c) exempt (no new route)

### Phase 6 — Verification (T129, tester + planner)

- [ ] 🧪 [T129: Traceability gate — every method traces to a task AND a requirement](./task-129-verification.md)
  **Status:** GATE PASSED (f487c2f tester verification report committed — T129.1 trace:check PASS with documented allowlist, S17-specific orphans ZERO; T129.2 6 end-to-end chain walks all PASS; T129.3 13/13 S17 files Web4Articles-compliant; AC1-AC7 met; 818/818) — Tron QA pending → closes Sprint 17
  **Owner:** robbin-tester (verify), robbin-planner (audit)
  **Sub-tasks:**
  - T129.1 — `npm run trace:check` clean against the migrated graph; orphanMethods/orphanTasks/orphanReqs all 0 or in documented waiver list
  - T129.2 — Tester walks the chain end-to-end on a sample (method → class → useCase → task → requirement); confirms IOR resolution at each hop
  - T129.3 — sprint audit + Web4Articles compliance audit pass 0-issue across all migrated sprints

## Dependency Graph
```
T124 architecture+requirements ──→ T125 foundation ──┬──→ T126 views ──┐
                                                     │                  │
                                                     └──→ T127 nav ─────┤
                                                                        │
                          T128 migration  ←─ requires T125+T126+T127 ───┤
                                                                        │
                                          T129 verify (gate, closes S17)
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Parent tasks | 6 (T124–T129) — 5 🧪 (T125/T126/T127/T128/T129), 1 🔧 (T124 4/6 sub-done; T124.4+T124.5 req-eng pending) |
| Follow-ons | T131🧪, T132🧪, T133🧪, T134🧪 (all tester-verified) |
| 2nd extension (Tron 2026-05-31) | T135/T136/T137/T138/T139 — all ⏳ pending CMM4 4-role cycle |
| Sprint 17 close | Pending: T124.4+T124.5 req-eng tail; T135-T139 cycle; Tron QA gate batch-approval |
| Sub-tasks (refinement-time) | ~20 (T124.1-T124.6, T125.1-T125.4, T126.1-T126.3, T127.1-T127.2, T128.1-T128.4, T129.1-T129.3) |
| Tron QA-approved (Done) | 0/6 parents |
| Planned | 6 parents |
| Migration scope | 16 sprints (S1–S16), ~130 tasks, all requirements + matrix |
| Key invariant | every method traces to ≥1 task AND ≥1 requirement (R17.13 + T129 gate) |

## Definition of Done
- [ ] Scenario-unit model + IOR primitive shipped + documented (T125)
- [ ] All 7 classes (Requirement/Task/UseCase/Class/Method/Test/Sprint) instantiable as `{ior, model, ownerIor}` units (T125)
- [ ] Storage layout live: `scenario/index/<5char>/<uuid>.scenario.json` + `scenarios/sprints.json/` symlink tree + `scenarios/sprints.md/` generated tree (T125, T126)
- [ ] Per-class HTML+MD templates registered; views live-update on JSON change (T126)
- [ ] planning.md + sprint overviews are generated views (no hand-edited prose) (T126)
- [ ] File-browser ↔ traceability-browser cross-nav works both ways (T127)
- [ ] IOR resolves any file in the repo to its class+view (T127)
- [ ] All 16 sprints migrated; Sprint 1 task-1/task-1.1 hierarchical structure preserved as exemplar (T128)
- [ ] Every method traces to a task AND a requirement (R17.13 chain closed); `npm run trace:check` clean (T129)
- [ ] Sprint audit + Web4Articles compliance pass 0-issue across all migrated sprints (T129)
- [ ] Version bumped + sw.js cache; STATIC_SHELL adjusted if new routes introduced (learnings #15 + #16)
- [ ] No regression in S1–S16
- [ ] Tron QA approved

## Process — Collaborative Planning (R17.15, Tron-assigned)
Tron-assigned roles for this sprint's own planning phase:
- **robbin-architect:** drafts the scenario-unit + IOR + view-template + storage design (T124.1-T124.3, T124.6); reviews req's formal requirements against the literal source.
- **robbin-req:** formalizes R17.1-R17.15 into requirements.md with proper v4 `requirement:uuid` (learnings #17); updates traceability standard (T124.4-T124.5).
- **robbin-planner (me):** stands up the sprint structure (this planning.md, parent task files), maintains symbols + audit, coordinates the Phase order, drives Phase 5 migration structurally.

Sub-task files (T124.1, T125.1, T126.1, ...) are created BY their owning role
during refinement — planner does NOT pre-author what architect/req/expert will
write. Planner adds them to the parent's sub-task list as they land.

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Architect (design lead, Tron-assigned):** robbin-architect
**Req-eng (requirements lead, Tron-assigned):** robbin-req
**Planner (structure, Tron-assigned):** robbin-planner
**Created:** 2026-05-30
**Sprint:** Sprint 17 — Scenario Units / IOR Data Model & Class Views
