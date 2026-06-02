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
  - **T128.2 ✅ shipped** — S10-S16 requirements migrated to scenario index (`f4d21b3` v0.5.64, rule-pair (a)+(b) ✓; tester pending; closes path (b) of T163 close-out trio)
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

### Phase 8 — S17 4th extension (Tron 2026-05-31 — traceability is a TREE) + B5 file-browser

- [ ] 🧪 [T143: Traceability chain → TREE rework (R17.26–R17.29)](./task-143-traceability-tree-rework.md)
  **Status:** impl v0.5.37 (`84f3915`) → tester (`6e2a532`) AC1+AC4–AC7 PASS, **AC2 PARTIAL** (UUID hrefs 404) → architect AC2 fix (`fe69562` TraceNode.slug) → expert reship v0.5.39 (`4e79afa`) → tester re-verify (`8b54788`) **STILL FAIL** (templates.ts not using slug). **AC2 fix attempt 2 in progress (v0.5.40 uncommitted)** → re-verify → Tron QA. Tron 4th S17 extension (`df09df2` + `ac8c8e7`).
  **Owners (CMM4):** robbin-req (anchor verbatim quotes under R17.26–R17.29) → robbin-architect (tree model + template + ViewGenerator + coverage audit + rework plan) → robbin-expert (impl) → robbin-tester (chain-walk + visual + regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) STATIC_SHELL if new route introduced (architect decides)

- [ ] 🧪 [T144: File-browser display fixes — icon order + link targets (B5, 3 fixes)](./task-144-file-browser-display-fixes.md)
  **Status:** impl v0.5.36 (`5da4054`) → tester round 1 (`65cc351` — **AC1+AC3 PASS, AC2 PARTIAL**: 🔗 target 404) → architect fix (`bd3b75d` Option A) → expert reship v0.5.38 (`0101980` — 🔗 href → `/edit/`). **AC2 re-verify pending tester** → Tron QA. Rule-pair (a)+(b) ✓ across both impl rounds.
  **Owners (CMM4):** robbin-req (confirm anchor — no scope drift) → robbin-architect (3 fixes design in `server.ts` /md/ + `rb-file-tree`) → robbin-expert (impl) → robbin-tester (visual + click-through across class trees)
  **Rule-pair scope:** (a)+(b) required at impl; (c) exempt (no new route, architect to confirm)

### Phase 9 — User class scenario-unit + ViewBus model parity (PO directive 2026-06-01, lifted from backlog B6)

- [ ] ✅ [T145: User class as scenario-unit + ViewBus-driven view updates (fixes lobby/room name stale)](./task-145-user-scenario-viewbus.md)
  **Status:** impl-shipped (`ccca722` req → `83099ea` architect → `f549114` expert v0.5.41 User+ViewBus singleton → `48eb52a` v0.5.42 follow-up wires ViewBus subscribers into 3 view components). Rule-pair (a)+(b) ✓ in BOTH impl commits (v0.5.41 + v0.5.42). Testing pending (robbin-tester TS1–TS8) → Tron QA.
  **Owners (CMM4):** robbin-req (anchor B6 verbatim) → robbin-architect (User scenario schema + ViewBus subscription pattern + 4 view-bindings + migration plan) → robbin-expert (impl + migrate) → robbin-tester (stale-name bug fix + S9/S17 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route, architect confirms)

### Phase 10 — Requirement entry format + speaky-NAME on 🔗 (PO directive 2026-06-01, lifted from backlog B7)

- [ ] ✅ [T146: Requirement-entry format reform — 3–5 word NAME first line + speaky-NAME on 🔗](./task-146-requirement-name-first-format.md)
  **Status:** impl-shipped (`ccca722` req → `83099ea` architect → `7fbfd8e` expert — template + validator + views). **Rule-pair FLAG ⚠️**: 7fbfd8e itself has no package.json/sw.js bump; batched via `f549114` v0.5.41 (T145's bump — reaches device, same pattern as T136/T138 batched bumps). Testing pending (robbin-tester TS1–TS7) → Tron QA.
  **Owners (CMM4):** robbin-req (retro-clean audit, dup-list) → robbin-architect (format spec + template change + standard update + symmetric scope decision) → robbin-expert (migrator + T126/T141 + trace-cli validator) → robbin-tester (0-dup + visual + regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route, architect confirms)

### Phase 11 — `.md` listing symmetric icons with `.json` side (PO directive 2026-06-01, plan-ahead only)

- [ ] ✅ [T147: Chain-link icon in `/md/` directory listing for `scenarios/sprints.md/` subtrees](./task-147-md-listing-chain-link-icon.md)
  **Status:** impl-shipped (`2ff001b` architect design → `111f0c8` expert v0.5.43 — 🔗 scenario link on sprints.md/ listings → `0d36b4d` req-eng B8 anchor backfill: canonical `requirement:uuid:d8e9f0a1-…` replaced planner-suggested, verbatim Tron quote anchored). Rule-pair (a)+(b) BOTH ✓ in 111f0c8. **Req debt CLEARED** (PO confirmation 2026-06-01). Testing pending → Tron QA.
  **Owners (CMM4):** robbin-req (verbatim anchor; replace planner-suggested req:uuid) → robbin-architect (renderer change + 📋 glyph + rb-file-tree mirroring + standard update if applicable) → robbin-expert (impl in `server.ts /md/` + rb-file-tree; rule-pair (a)+(b)) → robbin-tester (visual + click-through + side-by-side `.json`/`.md` symmetry + T144/T141 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 12 — File-browser path-header clickable → parent dir (PO directive 2026-06-01)

- [ ] ✅ [T148: File-browser path-header clickable → parent dir navigation](./task-148-file-browser-path-header-clickable.md)
  **Status:** impl-shipped (`555ca7c` req-eng B9 anchor verbatim Tron quote + canonical `requirement:uuid:e9f0a1b2-…` → `6f0c72c` architect design — breadcrumb path-header → `eec6515` expert v0.5.44 — clickable breadcrumb path header). Rule-pair (a)+(b) BOTH ✓ in eec6515. Testing pending → Tron QA.
  **Owners (CMM4):** robbin-req (verbatim anchor; replace planner-suggested req:uuid) → robbin-architect (segment-split + cumulative-href + separator styling + rb-file-tree mirroring decision) → robbin-expert (impl in `server.ts /md/` renderer; rule-pair (a)+(b)) → robbin-tester (visual + click-through + T144/T147/T141 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 13 — Universal symlink tree across all 9 scenario classes (PO directive 2026-06-01 — Tron "same for requirements, classes methods")

- [ ] ✅ [T149: Extend symlink tree to all 9 scenario classes — universal 🔗 resolution](./task-149-symlink-tree-all-9-classes.md)
  **Status:** impl-shipped (`3f8cd33` arch pre-design + `9669370` req anchor backfill (B10, canonical `requirement:uuid:f0a1b2c3-...`) → `b55abd8` expert v0.5.45 per-class symlink subdirs → `de7f348` arch slug-mismatch fix design → `1478924` expert v0.5.46 full-UUID tracelinks + two-strategy scenarioLink). Rule-pair (a)+(b) ✓ in BOTH ship commits (v0.5.45 + v0.5.46). Testing pending (per-class TS1–TS9) → Tron QA.
  **Owners (CMM4):** robbin-req (verbatim Tron anchor; confirm 9-class enumeration) → robbin-architect (per-class emitter generalization + speaking-name resolver + back-fill migrator) → robbin-expert (impl + back-fill on existing index; rule-pair (a)+(b)) → robbin-tester (per-class verification + chain audit + T131/T141/T144/T147 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 14 — File-browser breadcrumb link contrast (CSS) (PO directive 2026-06-01)

- [ ] ✅ [T150: File-browser breadcrumb link color contrast fix (CSS)](./task-150-breadcrumb-link-contrast.md)
  **Status:** impl-shipped (`8051692` req anchor verbatim Tron quote "file browser clickable path works well, but link text color is barely readable on background" + canonical `requirement:uuid:a1b2c3d4-…` (B11 in backlog `e0dd901`) → `1d534a2` architect design → `18a28ff` expert v0.5.47 WCAG AA fix). Rule-pair (a)+(b) BOTH ✓ in 18a28ff (package.json + sw.js CACHE_NAME → rawbin-v0.5.47). Testing pending (TS1–TS7) → Tron QA.
  **Owners (CMM4):** robbin-req (verbatim anchor ✓) → robbin-architect (color scheme + scope ✓) → robbin-expert (CSS impl ✓) → robbin-tester (visual + contrast-checker + regression)
  **Rule-pair scope:** (a)+(b) ✓; (c) exempt (CSS-only)

### Phase 15 — MD-chain → JSON-arrays migration (PO directive 2026-06-01 — BIG diligent task per Tron, JOINT req+architect)

- [ ] ✅ [T151: Migrate MD traceability bullets → JSON model arrays (no info loss)](./task-151-md-traceability-to-json-arrays-migration.md)
  **Status:** impl-shipped (`fa7c9bb` req JOINT anchor B12 verbatim + per-shape mapping → `6f4db8f` architect design → `d3ec388` expert v0.5.48 — **815/815 per-task count gate PASSED, zero loss**). Rule-pair (a)+(b) BOTH ✓ in d3ec388 (package.json + sw.js CACHE_NAME → rawbin-v0.5.48). The #19 loop closed: JSON canonical, MD generated by T126. Testing pending (TS1–TS8 + round-trip ≥5 tasks + regression) → Tron QA.
  **Owners (CMM4 — JOINT refinement):** robbin-req + robbin-architect (JOINT — req per-shape mapping list + architect JSON schema + migration script + audit design) → robbin-expert (dry-run + per-task count table + apply pass, rule-pair (a)+(b)) → robbin-tester (per-task verify + round-trip spot-check ≥5 tasks + T131/T141/T144/T147/T149/T146 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 16 — UseCase data quality (object/verb + PUML links) (PO directive 2026-06-01)

- [ ] ✅ [T152: UseCase data quality — derive object/verb from name + populate tasks/classes/requirement links from PUML](./task-152-usecase-data-quality-object-verb-from-name-puml-links.md)
  **Status:** impl-shipped (`b741d50` architect pre-design → `119e9c8` req-eng anchor B13 verbatim ("i picked an arbitrary example...still no traceability content inside. object, verb empty even if it can be derived from name. bad data quality"; canonical `requirement:uuid:c3d4e5f6-…`) → `1b62d75` expert v0.5.49 UC data quality + PUML refs + S16 migration). T-152 collision resolved (architect stub `task-152-uc-data-quality-migration.md` removed; design merged into the full Web4Articles file). Rule-pair (a)+(b) BOTH ✓ in 1b62d75 (package.json + sw.js CACHE_NAME → rawbin-v0.5.49). Testing pending (TS1–TS10 + ≥5-UC round-trip + regression) → Tron QA.

### Phase 17 — UseCase residual fields: classes + requirement singular (T152 follow-up; PO directive 2026-06-01)

- [ ] ✅ [T153: T152 follow-up — populate `model.classes` + `model.requirement` on UseCases](./task-153-populate-classes-requirement-on-ucs.md)
  **Status:** impl-shipped — both halves landed. `ee04ffb` req B14 anchor → `0365ff1` v0.5.50 classes ✓ (PUML arrows + S16 `object:`) → `c77d1f5` architect v2 R-resolution design (`model.altId` on Requirements) → `a9f9571` v0.5.51 expert R-resolution impl (altId on requirements + UC req refs via altId lookup). Rule-pair (a)+(b) ✓ in BOTH ship commits (v0.5.50 + v0.5.51). Testing pending → Tron QA. Symbol 🔧 → ✅.
  **Owners (CMM4):** robbin-req (verbatim anchor; replace planner-suggested req:uuid) → robbin-architect (classes-extraction rule + requirement-singular resolver + per-UC audit extensions + standard update) → robbin-expert (extends T152 script; dry-run + apply; rule-pair (a)+(b)) → robbin-tester (per-UC verify + ≥5-UC round-trip + T117/T126/T143/T149/T151/T152 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)
  **Owners (CMM4):** robbin-req (verbatim anchor; replace planner-suggested req:uuid) → robbin-architect (derivation rule + PUML extraction rule + per-UC audit + standard update) → robbin-expert (data-quality script + dry-run + apply, rule-pair (a)+(b)) → robbin-tester (per-UC verify + ≥5-UC round-trip + T117/T126/T143/T149/T151 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 18 — Requirement data quality (name / description / tasks) (PO directive 2026-06-01)

- [ ] ✅ [T154: Requirement data quality — name vs description split + `tasks[]` populated](./task-154-requirement-data-quality-name-description-tasks.md)
  **Status:** impl-shipped (`cd84ffe` req-eng B15 anchor verbatim Tron quote + canonical `requirement:uuid:e5f6a7b8-…` (B15 backlog `8cf2b7f`) → `2077202` architect design (Requirement data quality: name/desc/tasks) → `e3ae6ea` expert v0.5.52 — Requirement data quality migration). Rule-pair (a)+(b) BOTH ✓ in e3ae6ea (package.json + sw.js CACHE_NAME → rawbin-v0.5.52). Testing pending (TS1–TS11 + ≥5-Req round-trip + regression) → Tron QA.
  **Owners (CMM4):** robbin-req (verbatim anchor; replace planner-suggested req:uuid; S10–S17 audit + gap list) → robbin-architect (name/description parsing rule + forward-link extraction + per-Req audit + standard update) → robbin-expert (extends T151/T152/T153 migrator; dry-run + apply; rule-pair (a)+(b)) → robbin-tester (per-Req verify + ≥5-Req round-trip + T126/T143/T146/T149/T151/T152/T153 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 19 — Requirement `tasks[]` + `tests[]` bidirectional closure (PO directive 2026-06-01)

- [ ] ✅ [T155: Requirement `tasks[]` + `tests[]` bidirectional closure](./task-155-requirement-tasks-tests-bidirectional-closure.md)
  **Status:** impl-shipped (`e6fdda6` req B16 anchor + canonical `requirement:uuid:f6a7b8c9-…` → `6cff106` architect design — bidirectional closure tasks[]+tests[] → `75af5ea` expert v0.5.53). Rule-pair (a)+(b) BOTH ✓ in 75af5ea (package.json + sw.js CACHE_NAME → rawbin-v0.5.53). Testing pending (TS1–TS10 + ≥5-Req round-trip + regression) → Tron QA.
  **Owners (CMM4):** robbin-req (B16 captured ✓; scope confirmation + per-Req gap list) → robbin-architect (reverse-scan rule + test-coverage marker shape + per-Req audit + standard update — add `tests: []` to RequirementLoader) → robbin-expert (closure script extends T154 migrator; dry-run + apply; rule-pair (a)+(b)) → robbin-tester (per-Req verify + ≥5-Req round-trip + T126/T143/T146/T149/T151-T154 regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 20 — Reload button on Connection-Failed + Offline pages (PO directive 2026-06-01, B4 promoted)

- [ ] ✅ [T156: Reload button on Connection-Failed + Offline pages](./task-156-reload-button-connection-failed-offline.md)
  **Status:** impl-shipped (`ac89151` req-eng confirm verbatim anchors + chain update → `d7ade7b` architect design → `b7f1919` expert v0.5.54 — Retry button on connection-failed screen). Rule-pair (a)+(b) BOTH ✓ in b7f1919 (package.json + sw.js CACHE_NAME → rawbin-v0.5.54). Testing pending → Tron QA.
  **Owners (CMM4):** robbin-req (scope confirm — label, both surfaces, mobile safe-area) → robbin-architect (button markup + CSS + onclick handler + consistency between surfaces) → robbin-expert (impl in `app.ts` + verify `sw.js` OFFLINE_HTML; rule-pair (a)+(b)) → robbin-tester (visual + functional on iPhone + Connection-Failed/offline regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) exempt (no new route)

### Phase 21 — Profile gate vCard onboarding (multi-platform) (PO directive 2026-06-01, B3 promoted)

- [ ] 📝 [T157: Profile gate — Upload vCard for fast onboarding (button + native drag-and-drop)](./task-157-profile-gate-vcard-onboarding.md)
  **Status:** refinement done (`ac89151` req-eng confirm verbatim anchor B3 + chain update → `d7ade7b` architect design — vCard finding). Awaiting expert impl + multi-platform tester verify. **Multi-platform hard requirement:** iOS, Android, Windows. Introduces vCard V3.0 PARSER (current code only EXPORTS).
  **Owners (CMM4):** robbin-req (4-field scope FN/TEL/URL/PHOTO + review-before-save UX) → robbin-architect (button + drag-drop handlers + V3.0 parser + PHOTO→T50 pipeline + multi-platform notes) → robbin-expert (impl `ProfileEditor.ts` gate mode + new `vcard-parser.ts`; rule-pair (a)+(b)) → robbin-tester (verify on iOS / Android / Windows + parser unit tests + regression)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 22 — Traceability browser full-chain data rendering (PO directive 2026-06-01, B17 promoted; Tron-assigned architect lead)

- [ ] ✅ [T158: Traceability browser — surface the FULL chain data (Req → Task → UC → Class → Method → Impl → Test)](./task-158-traceability-browser-full-chain-data.md)
  **Status:** impl-shipped (`a41d16a` v0.5.59 — 4 typed DetailViews for Class/Method/Test/Implementation; architect design 304a94d). Rule-pair (a)+(b) ✓. Testing pending; tester finding surfaced a tree-coverage gap → escalated to **T165** (typed items have DetailViews but no tree-items yet). Tron QA pending.
  **Owners (CMM4):** robbin-req (B17 captured ✓; scope confirm — which hops first, R17.24 in/out, DetailView coverage matrix) → robbin-architect (Tron-assigned design lead — per-type DetailViews + VerbRegistry wiring + tree-item rendering + standard update) → robbin-expert (impl + new Web Components; **rule-pair (a)+(b)+(c) — STATIC_SHELL REQUIRED** for new typed-DetailView bundle paths) → robbin-tester (full-chain walk + ≥5-chain spot-check + T110/T111/T143/T149/T151-T155 regression)
  **Rule-pair scope:** (a)+(b)+(c) — **(c) STATIC_SHELL required** (new typed-DetailView bundles need cache priming for /trace)

### Phase 23 — Forward-only chain refactor (Tron critical correction 2026-06-01, B18 promoted; supersedes T155 direction)

- [ ] ✅ [T159: Forward-only traceability chain — refactor (remove back-refs)](./task-159-forward-only-traceability-chain-refactor.md)
  **Status:** impl-shipped (`58b17e3` v0.5.56 — forward-only chain strip-back-refs + validator). Rule-pair (a)+(b) BOTH ✓. **OVER-STRIP FINDING (tester TS2):** `requirement.tasks[]` + `task.useCases[]` now EMPTY because prior pipeline derived forward arrays from back-refs. Repopulation handled by **T160** below.
  **Owners (CMM4):** robbin-req → robbin-architect → robbin-expert (58b17e3 ✓) → robbin-tester (TS2 found over-strip → escalated to T160). Testing remaining pending → Tron QA after T160 lands.
  **Rule-pair scope:** (a)+(b) ✓; (c) exempt

### Phase 24 — Forward-ref REPOPULATION + browser data-freshness (T159 over-strip root cause; PO directive 2026-06-01)

- [ ] ✅ [T160: Forward-ref REPOPULATION + browser data-freshness (T159 over-strip root cause)](./task-160-trace-browser-stale-requirement-items.md)
  **Status:** FULLY SHIPPED (PO correction 2026-06-02). `5b354fd` v0.5.58 (requirement.tasks[] + /api/trace data source switch) + **`edc477c` v0.5.60 AC3 task.useCases[] populated from PUML T-number refs**. Rule-pair (a)+(b) ✓ on BOTH commits. Tester VERIFIED (5/51 tasks/24 UC refs per PO). Tron QA pending. (Prior planner walk-back was stale; corrected.)
  **Owners (CMM4):** robbin-req (capture verbatim Tron quote; planner-suggested req:uuid:cda06ff4-…) → robbin-architect (forward-source repopulation design + secondary cache-strategy validation + standard update) → robbin-expert (repopulation migration + any cache fix; rule-pair (a)+(b)) → robbin-tester (per-Req + per-Task forward-count audit, walkDown resolves, **browser mutation→reflection** test, no back-refs reintroduced)
  **Rule-pair scope:** (a)+(b) required at impl; (c) STATIC_SHELL — architect confirms (likely exempt)

### Phase 25 — Requirement title-render bug (sibling to T160; PO directive 2026-06-01)

- [ ] ✅ [T161: Requirement items render Tron-quote as NAME instead of speaky `model.name`](./task-161-requirement-name-renders-tron-quote-not-speaky.md)
  **Status:** impl-shipped (`737c841` v0.5.57 — fix requirement name rendering: speaky names not quotes, via `firstLine()` in TraceConsistency.ts). Rule-pair (a)+(b) BOTH ✓. Testing pending (robbin-tester); tester TS6 finding spawned T162 (MD-headings leak). Tron QA pending.
  **Owners (CMM4):** robbin-req (capture verbatim Tron quote; planner-suggested req:uuid:23e7ec10-…) → robbin-architect (diagnose A vs B by sampling JSON + reading rb-tree-item / rb-requirement-detail; specify fix) → robbin-expert (fix per design; rule-pair (a)+(b)) → robbin-tester (JSON model.name + model.description per-Req audit; renderer unit tests; browser smoke ≥5 Reqs; sibling-class smoke)
  **Rule-pair scope:** (a)+(b) required at impl; (c) likely exempt (no new route)

### Phase 26 — Title-rendering MD-artifact cleanup (T161 tester TS6 finding; PO directive 2026-06-02)

- [ ] ⚠️ ~~[T162: MD artifacts (`##` headings) leak into requirement titles](./task-162-md-headings-leak-into-requirement-titles.md)~~
  **Status:** SUPERSEDED by T163 (2026-06-02). T162 proposed hardening `firstLine()` to strip MD; tester's clearer report identifies root cause as `/api/trace` using `firstLine()` instead of T161-clean `model.name`. Wrong layer. No work proceeds in T162; preserved for traceability.

- [ ] ⚠️ [T163: /api/trace requirement title source — switch from scanRepo firstLine() to scenario index `model.name`](./task-163-api-trace-title-source-switch.md)
  **Status:** ⚠️ PARTIAL — impl-shipped `f138aa0` v0.5.61 (data-source switch correct), tester verified 26/41 clean. Residue split per PO 2026-06-02: (a) 3 dirty `model.name` units (`## Extension 2/3/4`) → **T164** (re-migrate + firstLine() harden, folded); (b) 12 unmigrated S10-S16 reqs → **T128.2** (broader migration); (c) firstLine() fallback harden → **T164**. T163 closes ✅ once T164 + T128.2 land. Rule-pair (a)+(b) ✓ on f138aa0.
  **Owners (CMM4):** robbin-req → robbin-architect → robbin-expert (`f138aa0` ✓) → robbin-tester (26/41 partial, residue escalated to T164 + T128.2)

### Phase 27 — T163 close-out + tree-coverage enrichment (PO directives 2026-06-02)

- [ ] 📝 [T164: Re-migrate dirty model.name + firstLine() fallback hardening](./task-164-dirty-model-name-remigration.md)
  **Status:** REFINEMENT DONE (architect designed concurrent with planner stand-up; planner reconciled per learning #12 — adopted architect's content + 9-scenario inventory; fixed non-v4 uuid → planner's v4 `e8c788c8-…`; added Web4Articles Subtasks + QA Audit sections). Folds T163 residue (a)+(c). Path (a): re-migrate **9 dirty `model.name` units** (architect inventory: `## Extension 2/3/4`, 5x `## … (original directive)`, 1x `---`). Path (c): harden `firstLine()` to skip `##`/`---`/`**R` prefixes (defense-in-depth). Path (b) = 12 unmigrated S10-S16 reqs → **T128.2**.
  **Owners (CMM4):** robbin-req (anchor T163 partial finding) → robbin-architect (designed ✓: cleanModelName() + firstLine() harden) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (9/9 clean + T163 in-scope close)
  **Rule-pair scope:** (a)+(b) required at impl; (c) exempt (no new route)

- [ ] 📝 [T165: Traceability tree renders ALL 7 typed classes (not only Requirements)](./task-165-tree-renders-all-7-typed-classes.md)
  **Status:** REFINEMENT DONE — `60a97a7` architect design committed. Tester partial: **5/7 classes render** (req/task/uc/test/impl); Class + Method = 0 nodes in `/api/trace` graph because scanRepo doesn't produce them → unblocked by **T166** (data-source overlay). T165 closes ✅ once T166 lands.

- [ ] ✅ [T166: /api/trace populate Class + Method types from scenario index](./task-166-api-trace-populate-class-method-from-scenario-index.md)
  **Status:** impl-shipped (`2a61aa2` v0.5.65 — overlay pattern: /api/trace merges scanRepo + scenario-index for Class + Method types). Rule-pair (a)+(b) ✓. T165 7/7 unblocked; tester to re-verify and close T165. Tron QA pending.
  **Owners (CMM4):** robbin-req → robbin-architect (overlay design) → robbin-expert (`2a61aa2` ✓) → robbin-tester (T165 7/7 re-verify + TS1-TS9 pending)

### Phase 28 — Tron compound-source-2 (R-D through R-G; PO directives 2026-06-02)

Source: `bfae071` + `2be6e96` + `7e01491` (req-eng captures of compound-requirement-source-2.md).
**Chain order LOCKED (PO 2026-06-02):** `requirement → task → usecase(s) → class → method → implementation → test(s)` · 1:N at plural hops (usecase, test).
**Priority:** T169 (R-F) is the **KEYSTONE** — T167/T170 build on T169-clean data; T168 supplies the canonical rule T169 audits against.

- [ ] ✅ [T167: /trace mobile-first layout + hard width-cap on right pane](./task-167-trace-mobile-first-layout-width-cap.md)
  **Status:** impl-shipped — `3336f38` v0.5.67 (mobile-first /trace + 480px width-cap). Rule-pair (a)+(b) ✓. Testing pending; Tron QA pending.
  **Owners (CMM4):** robbin-req (anchor R-D verbatim) → robbin-architect (mobile-first layout + width-cap rule) → robbin-expert (CSS impl; rule-pair (a)+(b)) → robbin-tester (visual on iPhone + desktop, TS1-TS6)
  **Rule-pair scope:** (a)+(b) required; (c) exempt (no new route). v4 uuids: task `d0881ad6-…`; req `ff3f06e7-…`.

- [ ] 📝 [T168: Chain order 7-step + atomic requirements as tree ROOTS](./task-168-chain-order-7-step-requirements-as-roots.md)
  **Status:** REFINEMENT DONE — `c28c982` architect design committed (7-step canonical chain LOCKED + requirements as roots). Expert next.
  **Owners (CMM4):** robbin-req (anchor R-E verbatim + PO amendments) → robbin-architect (TraceModel walk + ViewGenerator + tree builder + standard update + Sprint 17 chain doc) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (chain walk + audit; TS1-TS8)
  **Rule-pair scope:** (a)+(b) required; (c) architect confirms. v4 uuids: task `c3951691-…`; req `12f6f7d1-…`.

- [ ] 🔧 [T169: Data-quality audit + remigrate — complete tree, NO back-chaos, NO untraced scenarios (KEYSTONE)](./task-169-data-quality-audit-remigrate-complete-tree.md)
  **Status:** audit shipped + PARTIAL — `43f9a0e` design + `7ddf64f` v0.5.66 impl (rule-pair (a)+(b) ✓). Audit RAN; mechanics pass but **50/296 untraced (17%) + R17.26 links=0** — Tron R-F demands ZERO untraced → closure via **T171**. T169 testing closes once T171 lands.
  **Owners (CMM4):** robbin-req (anchor R-F verbatim) → robbin-architect (audit + remigration + CI-gate design) → robbin-expert (impl audit + remigration tooling; rule-pair (a)+(b)) → robbin-tester (audit baseline + post-remigration; TS1-TS11)
  **Rule-pair scope:** (a)+(b) required; (c) architect confirms. v4 uuids: task `e43c24fe-…`; req `c182f6f1-…`. **KEYSTONE — block T167/T170 closure on T169 audit clean.**

- [ ] ✅ [T170: Diligent plan + no-stop sustain (CI gates)](./task-170-diligent-plan-no-stop-sustain.md)
  **Status:** impl-shipped — `afe969e` (3 CI gates: trace:audit:strict + rule-pair:check + chain-order; `npm run ci:gates`). Rule-pair exempt (infra-only; T167 bumped v0.5.67 already this cycle). Testing pending; Tron QA pending.
  **Owners (CMM4):** robbin-req (anchor R-G verbatim) → robbin-architect (3-gate design + sustain cadence doc) → robbin-expert (CI workflow + gate scripts; rule-pair (a)+(b)) → robbin-tester (gate firing + clean-state passing; TS1-TS9)
  **Rule-pair scope:** (a)+(b) required; (c) exempt. v4 uuids: task `6cf46cd1-…`; req `1267ef56-…`.

- [ ] ✅ [T171: Untraced-closure + traceability-matrix refresh (T143-T171)](./task-171-untraced-closure-r17-26-linkback.md)
  **Status:** CLOSED (PO 2026-06-03 — T172 completed the chain-reachability work T171 was blocked on). `7c84fe0` strips 109 empty `requirements[]` back-refs; 50 are ALL TraceLinks (edge metadata, orphan-by-design); matrix refreshed. T171's baselines + T172's 238/238 reachability = complete. Tron QA pending.
  **Owners (CMM4):** robbin-req (anchor PO finding) → robbin-architect (categorize the 50 + design R17.26 link-back + allowlist mechanism) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (T169 audit re-run = ZERO untraced + R17.26 walkDown reaches T165/T166)
  **Rule-pair scope:** (a)+(b) required; (c) exempt. v4 uuids: task `75628241-…`; req `0dcaa94e-…`. **Gates T169 testing closure + T170 CI gates land cleanly only after T171.**

- [ ] ✅ [T172: Strict-direction audit + massive orphan fix (R-H) + R-H.2 atomic-req-split + R-J test-reachability](./task-172-strict-direction-audit-massive-orphans.md)
  **Status:** ✓ COMPLETE (PO 2026-06-03 — S17 R-batch R-A through R-J complete + verified). `3fefc68` 5-step forward-ref population + strict-direction audit: **238/238 chain reachability (100%)** from 146/296 (49%). Sprints (9) + TraceLinks (50) excluded as orphan-by-design. 297 total, 0 chain orphans, 0 back-refs, 0 cardinality issues; 834/834 tests pass. Rule-pair exempt (data only, no user surface). Tron QA pending.
  **Owners (CMM4 — refinement JOINT, Tron-assigned):** robbin-req + robbin-architect (JOINT — diagnose audit-too-lenient vs display-reveals; design strict-direction validator + remigration) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (live `/trace` clean + T169 strict re-run)
  **Rule-pair scope:** (a)+(b) required; (c) architect confirms. v4 uuids: task `7bf0199c-…`; req `383c3b28-…`. **Closes audit-display trust gap left by T171; adds atomic-split standing rule.**

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
