# T160: Forward-ref REPOPULATION + browser data-freshness (T159 over-strip root cause)
[task:uuid:6bb3758d-1e62-4e96-a310-ee38d11e8346]

## Status

- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability

`[task:uuid:6bb3758d-1e62-4e96-a310-ee38d11e8346]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron bug capture (PO-relayed 2026-06-01):** *(req-eng to anchor a B-entry / verbatim capture commit — planner pre-recorded here pending capture)*
  - **Stale-browser-items requirement (planner-suggested; req-eng to anchor/override on capture)**
    `[requirement:uuid:cda06ff4-92a3-43fd-afb8-f12000d92bda]`
    Verbatim Tron quote (PO-relayed 2026-06-01):
    > "why does the traceability browser's requirement items do not change even when the scenarios changed?"
- down
  - None (atomic bug-fix task)
- follows
  - [T125: Foundation (Unit + IOR + ClassLoaders + ScenarioIndex + ViewTemplateRegistry)](./task-125-foundation.md) — scenarios/index/ canonical source T160 must read from
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — tree model
  - [T149: Universal symlink tree across 9 classes](./task-149-symlink-tree-all-9-classes.md) — symlinks (may interact with cache layer)
  - [T151: MD chain → JSON arrays migration](./task-151-md-traceability-to-json-arrays-migration.md) — JSON arrays are the source of truth post-T151; browser must read them
  - [T155: Requirement bidirectional closure](./task-155-requirement-tasks-tests-bidirectional-closure.md) — forward arrays T160 must surface
  - [T158: Traceability browser full-chain data rendering](./task-158-traceability-browser-full-chain-data.md) — T158 blocked by T160 if data source is stale (also T158 depends on T159 forward-only)
  - [T159: Forward-only chain refactor](./task-159-forward-only-traceability-chain-refactor.md) — `58b17e3` v0.5.56 strip-back-refs ran on S1+S17 scenarios; this re-migration appears to be the trigger context for the stale-browser observation
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** stale-browser-items bug (above)
  - **use case:** UC-TBD (architect — likely `trace.fetchGraph`, `trace.invalidateCache`, or `trace.readScenarioIndex`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** server-side `/api/trace` handler (or whatever endpoint serves the browser graph); possibly the parsed-graph cache layer; client-side fetch wrapper (architect names concrete files on diagnosis)

## Context

Trigger context: T159 (`58b17e3` v0.5.56) just ran the forward-only strip
migration on S1 + S17 scenario units — `requirement.tasks[]` / `task.useCases[]`
/ `useCase.classes[]` / `class.methods[]` arrays changed, back-refs stripped.
Tron loaded the traceability browser AFTER the migration and observed
Requirement items unchanged from the pre-migration state.

PO-named likely root causes:
1. **`/api/trace` reads legacy source** — server scans `scrum.pmo/sprints/.../requirements.md` + task files via `trace-cli` MD parsing, NOT `scenarios/index/<prefix>/<uuid>.scenario.json` directly. The MD source is the OLD layer; the canonical post-T151 source is the scenario index.
2. **Server-side parsed-graph cache** — the server caches the parsed graph in-memory; cache is not invalidated when scenario files are written.
3. **Client-side fetch cache** — `/api/trace` response is HTTP-cached by the browser or by `sw.js` STATIC_SHELL; client serves stale.

Architect diagnoses which of the three (or combination) and specifies the fix.

## Intention

### Why this task exists
- Browser staleness invalidates the entire post-T151 / T159 data work
- Without fresh data, T158 (full-chain rendering) builds on a sand foundation

### Problems this task solves
- Browser doesn't reflect current scenario JSON state
- Requirement (and likely Task / UC / etc.) items render outdated

### How it solves them
- Architect-led root-cause diagnosis (3 candidate causes above)
- Switch data source to scenarios/index/ OR cache-bust OR no-cache headers
- Verify pre/post mutation in tester pass

## Acceptance Criteria

- [ ] AC1 (Forward-source spec) — Architect documents the canonical FORWARD MD sources for repopulation: `requirements.md` forward bullets (Req→Task) + task files' forward `## Traceability` bullets (Task→UseCase, Task→Subtasks, UseCase→Class, Class→Method). Documented in `scrum.pmo/standards/traceability-standard.md`. **Preserves T159/B18 no-back-ref rule** — no reverse parsing (no `task.links.up → req` reads)
- [ ] AC2 (`requirement.tasks[]` repopulated) — For EVERY Requirement scenario, `model.tasks[]` count EQUALS the count of forward `→ task` bullets in `requirements.md`. Per-Req audit table; mismatch = hard FAIL
- [ ] AC3 (`task.useCases[]` repopulated) — For EVERY Task scenario, `model.useCases[]` count EQUALS the count of forward `→ usecase` bullets in the task file. Per-Task audit table; mismatch = hard FAIL
- [ ] AC4 (`useCase.classes[]` / `class.methods[]` if same root cause) — Architect confirms if these arrays were also over-stripped; if yes, same forward-source repopulation applies; per-class audit
- [ ] AC5 (T143 walkDown) — From any Requirement, `walkDown` resolves the full forward chain Req → Task → (Subtask ∪ UseCase) → Class → Method (no dead ends post-repopulation)
- [ ] AC6 (Browser reflects mutations) — Tester mutates a `requirements.md` entry OR a Task scenario JSON; loads `/trace` browser; **the browser reflects the change** (resolves Tron's original "items don't change" symptom). No manual reload / cache clear required
- [ ] AC7 (Server data source — secondary verification) — Architect confirms `/api/trace` reads from `scenarios/index/` (canonical) NOT from legacy MD scan; if cache invalidation strategy needed, specify (no-cache header / ETag / cache-bust on write)
- [ ] AC8 (Spot-check ≥3 mutations across classes) — Tester mutates a Requirement, a Task, a UseCase; browser reflects all three changes
- [ ] AC9 (No back-refs reintroduced — T159 invariant holds) — Post-fix audit: zero back-refs on any scenario; the repopulation MUST be from forward sources only
- [ ] AC10 (Idempotence) — Running the repopulation twice yields the same JSON
- [ ] AC11 (Regression) — No regression on T126 / T143 / T149 / T151 / T158 / T159
- [ ] AC12 — `npm run build` succeeds; all existing tests pass
- [ ] AC13 — **Rule-pair (a)+(b) [learnings #15 + #16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing impl. (c) STATIC_SHELL: architect confirms (likely exempt — no new route)
- [ ] AC14 — All 4 roles committed work in this file

## QA Audit & User Feedback

- 2026-06-01: PO-relayed Tron bug — traceability browser shows stale Requirement items even after scenario JSON updates (trigger: T159 strip-back-refs migration on S1+S17 ran in `58b17e3` v0.5.56). PO-named candidate causes: legacy MD source, server cache, client cache. CMM4 4-role enforced (#18); real v4 uuids (#17); rule-pair (a)+(b) in AC10 + DoD (#15+#16). Awaiting req anchor (B-entry) → architect diagnosis + Design → expert fix → tester repro+verify → Tron QA.

## Subtasks

None (atomic bug-fix task).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 24 (browser data freshness bug fix)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (Tron bug + blocks T158 — must land before browser full-chain build is trustworthy)*
