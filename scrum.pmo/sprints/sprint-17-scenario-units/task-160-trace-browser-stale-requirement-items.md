[Back to Sprint 17 Planning](./planning.md)

# T160: Forward-ref REPOPULATION + browser data-freshness (T159 over-strip root cause)

[task:uuid:6bb3758d-1e62-4e96-a310-ee38d11e8346]

## Status — 🔧 REOPENED 2026-06-02 (AC3 incomplete per tester)
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `b2ac0b7` architect design: forward-ref repopulation + /api/trace data source switch)
  - [x] creating test cases
  - [ ] implementing (expert — PARTIAL: `5b354fd` v0.5.58 shipped requirement.tasks[] repopulation + /api/trace data source switch; rule-pair (a)+(b) ✓ in that commit. **AC3 `task.useCases[]` forward-source parsing UNIMPLEMENTED** per tester report (PO 2026-06-02) — follow-on impl needed)
  - [ ] testing (robbin-tester — verification on hold until AC3 lands)
- [ ] QA Review
- [ ] Done

> **REOPENED 2026-06-02 (PO via tester):** `5b354fd` partial — AC3
> (`task.useCases[]` forward-source parsing) was unimplemented. Walking back
> implementing [x] → [ ] with explicit partial-shipped note (honesty rule per
> learning #15 / b85dfa8 incident: never check a box for partial work).
> Expert to ship the AC3 follow-on impl in a new commit-set with rule-pair (a)+(b).
> QA Review + Done remain Tron's gate.

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **ROOT CAUSE IDENTIFIED (PO 2026-06-01 via T159 tester TS2):** T159's
> strip-back-refs went too far — it stripped the **forward arrays** too,
> because they were being populated FROM back-refs in the prior pipeline.
> `requirement.tasks[]` + `task.useCases[]` are now EMPTY. These ARE forward
> refs (Req→Task forward, Task→UC forward); they must be **repopulated from
> forward sources** (parse `requirements.md` forward bullets + tasks' forward
> useCases bullets), preserving the no-back-ref rule from T159/B18.
>
> Connect this to Tron's "browser items don't change" bug — SAME root cause:
> forward arrays empty → browser has nothing to render → items appear stale.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — capture the verbatim Tron bug quote (PO-relayed 2026-06-01); replace the planner-suggested `requirement:uuid` below if req-eng has a canonical one; confirm symptom scope: only Requirement items, or all classes? only `/trace` browser, or also `/md/scenarios/...` views? Specifically include T159's S1+S17 re-migration as the trigger context
2. **robbin-architect** — **PRIMARY: design forward-ref repopulation.** Identified root cause: T159 strip-back-refs emptied `requirement.tasks[]` + `task.useCases[]` because the prior pipeline derived them from back-refs. Forward-only rule (B18/T159) must hold, but the forward arrays need to be re-derived from **forward sources** in the MD layer: (a) `requirements.md` forward-link bullets (`requirement → task` references the source carries); (b) task files' forward `## Traceability` bullets pointing to useCases / classes / methods (forward direction from task to its participants). Design a migration that parses these forward bullets and populates `requirement.tasks[]` + `task.useCases[]` (+ `useCase.classes[]` + `class.methods[]` if same root-cause applies). **SECONDARY: validate browser data-freshness** — once forward arrays are repopulated, confirm `/api/trace` reads from `scenarios/index/<prefix>/<uuid>.scenario.json` (canonical post-T151) and that server/client caches don't mask updates; specify cache strategy (no-cache or cache-bust) if needed. Update `scrum.pmo/standards/traceability-standard.md` to call out the canonical forward-source MD layout
3. **robbin-expert** — implement per architect's design: (i) forward-ref repopulation migration (parse `requirements.md` forward bullets → `requirement.tasks[]`; parse task files' forward bullets → `task.useCases[]` + cascade for class/method if applicable); (ii) any cache-strategy fix for browser data-freshness; carry rule-pair (a)+(b) in the impl commit-set; STATIC_SHELL (c) if applicable
4. **robbin-tester** — verify per-class: `requirement.tasks[]` populated (forward count from `requirements.md` bullets); `task.useCases[]` populated; T143 `walkDown` from Req → Task → UC → Class → Method resolves; **mutate a scenario / `requirements.md` entry → browser reflects the change** (the original Tron-flagged symptom is fixed); spot-check ≥3 mutations across Req/Task/UC; regression: T126 / T143 / T149 / T151 / T158 / T159 (no-back-refs rule preserved) intact

**This file is the single source of truth.** No chat clarification.

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

## Design (Architect — robbin-architect, 2026-06-02)

### Root-Cause Diagnosis: ALL THREE candidates confirmed

**Candidate 1 — `/api/trace` reads legacy MD source: CONFIRMED**

`src/ts/server/server.ts:424-440` — route handler calls `scanRepo(sprintsDir, srcDir, testDir)` from `TraceConsistency.ts`. `scanRepo()` walks:
- `scrum.pmo/sprints/*/requirements.md`
- `scrum.pmo/sprints/*/task-*.md`
- `scrum.pmo/sprints/*/diagrams/*.puml`
- `src/**/*.ts` for `[impl:uuid]` comments

It **never reads `scenarios/index/`**. The canonical post-T151 source (scenario JSONs with `model.links.*` / `model.chain.*` arrays) is ignored. `/api/trace` serves stale MD-parsed data even when scenario JSONs have been updated by T159's strip migration.

**Candidate 2 — Server-side parsed-graph cache: NOT CONFIRMED (no in-memory cache)**

`scanRepo()` is called on every `/api/trace` request — no in-memory caching detected. However, the parse itself is expensive (walks filesystem), so repeated calls return fresh-from-MD data. This is NOT the staleness cause — the staleness comes from reading MD instead of scenarios.

**Candidate 3 — Client-side fetch cache via sw.js: PARTIALLY CONFIRMED**

`src/public/sw.js:55-66` — `/api/*` routes use `networkFirst()` strategy. Server sets `Cache-Control: no-cache` (line 432). `networkFirst()` fetches from network first, caches on success, serves cached on network failure. Under normal conditions, browser gets fresh data. BUT: if the service worker has a stale cached version AND the network request races, the stale version can flash briefly. Also, `CACHE_NAME` is not bumped when data changes — old SW version may serve old cache.

### Forward-Ref Repopulation Design

**Problem:** T159 stripped back-refs (`task.links.up → req`). The prior pipeline populated `requirement.tasks[]` BY reverse-scanning task files' `links.up` field. After strip, reverse scan returns empty. Forward arrays are now empty.

**Solution:** Parse FORWARD sources only (T159/B18 compliant).

#### Source 1: `requirements.md` → `requirement.forwardTo.tasks[]`

Parse pattern — each requirement block in `requirements.md`:
```markdown
- [ ] Forward chain completeness
  > TRON: "clicking a joined..."
  [requirement:uuid:a1e2f3d4-...]
  ([task-143](./task-143-traceability-tree-rework.md))
```

The `([task-N](./path))` line is the FORWARD reference from Requirement to Task. Parse it:

```typescript
// In scanRepo() or a new forwardRefPopulator():
function parseRequirementForwardTasks(reqBlock: string): string[] {
  const taskLinks: string[] = [];
  const taskPattern = /\(\[task-\d+[^]]*\]\(\.\/([^)]+)\)\)/g;
  let match;
  while ((match = taskPattern.exec(reqBlock)) !== null) {
    taskLinks.push(match[1]); // e.g. "task-143-traceability-tree-rework.md"
  }
  return taskLinks;
}
```

#### Source 2: Task files' forward `## Traceability` → `task.forwardTo.useCases[]`

Parse pattern — task file's `- down` section:
```markdown
## Traceability
  - down
    - [Task 143.1: ...](./task-143.1-...)  ← subtask (forward)
  - chain
    - **use case:** UC-TBD ...              ← useCase ref (forward)
```

Parse `- down` links for subtasks. Parse `- chain` → `**use case:**` for UC references.

#### Source 3: Scenario index → canonical post-T151 source

**PRIMARY FIX:** `/api/trace` handler must switch from `scanRepo()` (MD parse) to reading `scenarios/index/<prefix>/<uuid>.scenario.json` files. These are the canonical source post-T151 and contain the JSON arrays (`model.tasks[]`, `model.useCases[]`, `model.classes[]`, `model.methods[]`) that T159 correctly preserved as forward refs.

```typescript
// server.ts /api/trace handler — REPLACE scanRepo() with:
import { ScenarioIndex } from './ScenarioIndex.js';

app.get('/api/trace', async (req, res) => {
  const index = new ScenarioIndex(scenarioDir);
  const chain = await index.buildForwardChain(); // reads scenarios/index/
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', computeETag(chain));
  res.json(chain);
});
```

If ScenarioIndex doesn't have `buildForwardChain()`, the expert implements it by:
1. Loading all scenario JSONs from `scenarios/index/`
2. Filtering by `model.chainType` (requirement, task, usecase, class, method)
3. Following forward arrays (`model.tasks[]`, `model.useCases[]`, etc.)
4. Building the TraceChain tree

#### Hybrid approach (if scenario index is incomplete)

If some forward arrays are still empty in scenario JSONs (not yet repopulated), fallback to MD parse for those specific links:
1. Read scenario JSON for the entity
2. If `model.tasks[]` is empty AND entity is a Requirement, parse `requirements.md` forward bullets
3. Write the populated array back to the scenario JSON (self-healing migration)

### Cache Strategy

1. **Server:** `Cache-Control: no-cache` already set — keep it
2. **ETag:** Add `ETag` header computed from response body hash. Browser sends `If-None-Match` → 304 if unchanged
3. **Service Worker:** `networkFirst()` is correct — always tries network first. No change needed
4. **CACHE_NAME bump:** Required in commit-set per rule-pair (c) — forces SW update on deploy
5. **No fs.watch needed:** `scanRepo()` / scenario reads are per-request. Mutation is reflected on next request automatically

### Files to Modify

| File | Change | AC |
|------|--------|----|
| `src/ts/server/server.ts:424-440` | Replace `scanRepo()` with ScenarioIndex.buildForwardChain() | AC7 |
| `src/ts/server/TraceConsistency.ts` | Add `parseRequirementForwardTasks()` for hybrid fallback | AC1 |
| `src/ts/server/ScenarioIndex.ts` (or new) | Add `buildForwardChain()` method | AC2, AC3 |
| `src/public/sw.js` | Bump CACHE_NAME | AC13 |
| `package.json` | Bump version | AC13 |
| `scrum.pmo/standards/traceability-standard.md` | Document canonical forward-source MD layout | AC1 |

### AC Mapping

| AC | Design Answer |
|----|---------------|
| AC1 | Forward sources: `requirements.md` task-link bullets + task file `- down` / `- chain` sections. Documented above. No back-ref parsing. |
| AC2 | `requirement.tasks[]` populated from `requirements.md` `([task-N](path))` lines |
| AC3 | `task.useCases[]` populated from task file `- chain → **use case:**` entries |
| AC4 | `useCase.classes[]` / `class.methods[]` — check if also empty in scenarios; if yes, same forward-source parse from traceability-matrix or PUML |
| AC5 | T143 walkDown resolves because forward arrays are populated from scenario index |
| AC6 | Browser reflects mutations because `/api/trace` reads per-request from scenarios/index/ (no stale cache) |
| AC7 | `/api/trace` reads from `scenarios/index/` (canonical post-T151), NOT from legacy MD scan |
| AC9 | No back-refs reintroduced — all parsing is forward-source only |
| AC10 | Idempotent — re-running repopulation yields same JSON (deterministic parse) |

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

## Test Scenarios
File: `test/vitest/trace-api-fresh.test.ts` (new) + manual / Playwright browser refresh test.

| Test | Action | Expected |
|------|--------|----------|
| TS1 (server data source) | Inspect `/api/trace` handler — confirm reads from `scenarios/index/` not from `scrum.pmo/sprints/.../requirements.md` scan | Source = scenarios/index/ |
| TS2 (server cache invalidation) | Mutate a scenario JSON; call `/api/trace` twice (before + after) | Second response reflects the mutation |
| TS3 (client cache) | Same mutation, load /trace twice in a browser without DevTools cache-disable | Second load reflects the mutation |
| TS4 (3-class spot-check) | Mutate a Requirement, a Task, a UseCase scenario; reload /trace | Each mutation visible |
| TS5 (sw.js STATIC_SHELL) | If architect adds STATIC_SHELL entry for /api/trace cache-policy: post-bump, new policy active | Verified via sw.js |
| TS6 (Reproduce bug pre-fix on a clean checkout) | Mutate scenario; load /trace; observe stale | Documented; baseline failure recorded |
| TS7 (regression: T126/T143/T149/T151) | Existing browser + view paths | Unchanged behaviorally for non-/api/trace surfaces |
| TS8 (rule-pair post-bump) | New CACHE_NAME activates | Fresh data on Tron's device |

## Dependencies
- **Requires:** T125 (scenarios/index foundation), T151 (JSON arrays canonical), T159 (forward-only chain — provides the data shape browser must surface)
- **Coordinate-with / blocks:** T158 (browser full-chain rendering — depends on fresh data; T158 design must assume T160's fix is in)
- **Enables:** trustworthy /trace browser; T158 build can land safely

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** captures the verbatim Tron bug quote (already in `cda06ff4` planner-suggested); anchors / replaces with canonical req-eng uuid; confirms symptom scope
2. **robbin-architect** diagnoses root cause across the 3 candidates (legacy source, server cache, client cache); writes Design section with the chosen fix
3. **robbin-expert** implements per the design; carries rule-pair (a)+(b) + (c) if applicable
4. **robbin-tester** runs TS1–TS8 + reproduces pre-fix + verifies post-fix; commits the verification report

## Definition of Done
- [ ] All AC met (AC1–AC11) — especially AC6 (post-fix mutation visible immediately)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T126 / T143 / T149 / T151 / T158
- [ ] All 4 roles committed work
- [ ] Tron QA approved (with pre-fix repro evidence + post-fix verification)

## QA Audit & User Feedback
- 2026-06-01: PO-relayed Tron bug — traceability browser shows stale Requirement items even after scenario JSON updates (trigger: T159 strip-back-refs migration on S1+S17 ran in `58b17e3` v0.5.56). PO-named candidate causes: legacy MD source, server cache, client cache. CMM4 4-role enforced (#18); real v4 uuids (#17); rule-pair (a)+(b) in AC10 + DoD (#15+#16). Awaiting req anchor (B-entry) → architect diagnosis + Design → expert fix → tester repro+verify → Tron QA.

## Subtasks
None (atomic bug-fix task).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 24 (browser data freshness bug fix)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 1 (Tron bug + blocks T158 — must land before browser full-chain build is trustworthy)*
