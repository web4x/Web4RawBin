[Back to T128 (parent)](./task-128-migration.md) · [Back to Sprint 17 Planning](./planning.md)

# T128.4: Method marker retrofit — fill `[impl:uuid:]` + `[test:uuid:]` gaps so 44/44 tests are 7-hop reachable
[task:uuid:8b405c16-8995-4aeb-8637-396abc13ab5a]

> **PO direction 2026-06-04:** Stand up T128.4 as a FORMAL task. Tester proved
> **0/44 tests 7-hop reachable** after T178's `populate-forward-refs` pipeline
> shipped (`c6c695a4` — 80 new units + 46 forward links via heuristic matching).
> Root cause: the pipeline depends on `[impl:uuid:]` markers in `src/` and
> `[test:uuid:]` markers in `test/`, but **50 impl markers + 21 test markers
> are missing** (per tester finding). T128.4 = the manual marker retrofit pass
> — every src/ method gets an `[impl:uuid:]` linking up to a Task; every test
> gets a `[test:uuid:]` linking up to an Implementation — so the T178 pipeline
> can link deterministically (not heuristically). 4-role: architect + req
> produce the marker map; expert adds the markers; tester re-runs T178
> pipeline and proves **44/44 tests 7-hop reachable**.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect + req JOINT: produce the method→Task mapping table; identify the 50 impl gaps + 21 test gaps)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - [T128 (parent migration)](./task-128-migration.md) — T128.4 closes the parent's "method markers retrofit" sub-task line
  - PO directive 2026-06-04 (tester finding): 0/44 7-hop reachable; pipeline shipped but markers are gap-ridden
  - **R-V** `[requirement:uuid:5e6c2810-efa4-49b3-b3fd-9170d8e4b86e]` — every `src/` method that implements a Task MUST carry an `[impl:uuid:]` marker linking to that Task; every test that exercises an Implementation MUST carry a `[test:uuid:]` marker linking to it. Coverage gap = chain gap. (planner pre-seed; req-eng to anchor verbatim Tron quote if relayed)
  - **R17.13** (existing) — chain closure via method markers; T128.4 satisfies it
- follows
  - T178 (`c6c695a4` populate-forward-refs pipeline shipped — 36 Impl + 44 Test units created, 30 Method→Impl + 16 Impl→Test linked via heuristic; pipeline READY, marker DATA missing)
  - T172 (`3fefc68` 5-step forward-ref + strict-direction) — Sprint→Task layer populated; T128.4 fills Method→Impl→Test layer
  - T168 (LOCKED 7-step) — chain spec; T128.4 makes the bottom 2 hops walkable in DATA
- unblocks
  - T178 closure (T128.4 + T178 + tester 44/44 is the full R-J / R-E satisfaction story)
  - T124 + T168 final closure (their chain-claims depend on this layer)
  - The strict-bar `trace:audit:strict` per-Test 7-hop CI gate (per learning #27) — only meaningful once T128.4 fills the markers
- down
  - None (atomic sub-task — single retrofit pass)

## Task Description (planner seed — architect + req design)

**Current state (post-`c6c695a4`):**
- `src/` impl markers: 80 present
- `test/` test markers: 46 present
- T178 pipeline created 36 Implementation units + 44 Test units from existing markers
- Heuristic matching linked: 30 Method→Implementation + 16 Implementation→Test
- Tester walk: **0/44 tests 7-hop reachable** from a Requirement root → 100% chain-gap

**Gap (PO 2026-06-04, tester):**
- ~50 src/ methods that implement a Task lack an `[impl:uuid:]` marker
- ~21 test files / suites lack a `[test:uuid:]` marker
- Without markers, T178 pipeline can't make a deterministic link → orphan chains

**Architect + req JOINT design:**
- Walk the Class→Method tree (Class units already have `methods[]` from T172)
- For each Method, identify the corresponding source file + function
- Map the function to a Task (per the existing Task→UseCase→Class chain; the Method points back to its Class which points back to a UseCase which points back to a Task — already in the data)
- Produce a **method→Task mapping table** in this task file:
  - Column 1: `src/path/file.ts` function name
  - Column 2: existing `impl:uuid:` (or "MISSING")
  - Column 3: target Task (`[task:uuid:...]`)
  - Column 4: action (add marker / OK)
- Same for test files → Implementation mapping table

**Expert implementation:**
- Add `[impl:uuid:<uuid>]` JSDoc comment above each method in the table action=add
- Add `[test:uuid:<uuid>]` comment in each test file/suite per the table
- Use **planner-pre-seeded v4 UUIDs** per learning #17 (no fake-suffix); architect/req can generate via `uuidgen` for each gap or planner provides a batch
- Run the T178 pipeline (`scripts/populate-forward-refs.ts`) idempotently — it picks up the new markers and creates the missing Method→Impl + Impl→Test links automatically
- Rule-pair (a)+(b) likely **EXEMPT** (data-only / source-comment-only changes; no user surface — per learning #24)

**Tester verifies:**
- Re-run T178 pipeline; confirm Method→Impl and Impl→Test link counts increase to cover the gaps
- Run the per-Test 7-hop reachability walk (per strict-bar (1)): **44/44 tests reach a Requirement root** via the full 7-step chain — ZERO chain-gap reports
- No regression on T172 238/238 unit reachability + no regression on existing tests

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — anchor R-V verbatim if Tron relays additional context; JOINT with architect on the method→Task mapping (req owns the chain semantics)
- **robbin-architect** — JOINT with req: produce the per-method mapping table (50 impl gaps + 21 test gaps); design any batch-uuid generator if marker count warrants
- **robbin-expert** — add markers per the architect+req table; re-run T178 pipeline; commit data delta
- **robbin-tester** — re-run T178 pipeline; verify Method→Impl + Impl→Test link counts increase; walk 44/44 tests to Requirement roots via 7-step (per strict-bar (1)); no regression

## Acceptance Criteria

**R-V (close the 50+21 marker gap):**
- [ ] AC1 — Architect + req commit the method→Task mapping table + test→Implementation mapping table in this task file (50 impl gaps + 21 test gaps each row resolved with target uuid)
- [ ] AC2 — All 50 missing `[impl:uuid:]` markers added to `src/` per the table
- [ ] AC3 — All 21 missing `[test:uuid:]` markers added to `test/` per the table
- [ ] AC4 — T178 pipeline re-run idempotently picks up the new markers; Method→Impl link count increases to cover all relevant methods; Impl→Test count similarly
- [ ] AC5 — Per-Test 7-hop reachability walk: **44/44 tests reach a Requirement root** via the full chain (req → task → uc → class → method → impl → test); **ZERO chain-gap reports**
- [ ] AC6 — R-J ("every Test reachable via the chain") + R-E ("chain starts with atomic requirements") **fully satisfied in DATA** — closing the gap T172 + T178 partially addressed
- [ ] AC7 — R17.13 (chain closure via method markers) satisfied; T128 parent sub-task line for T128.4 ticks off

**Backwards-compat + ship rules:**
- [ ] AC8 — T172's 238/238 unit reachability preserved (no regression)
- [ ] AC9 — Existing tests still pass (markers are JSDoc/comment-only; no behaviour change)
- [ ] AC10 — Rule-pair (a)+(b) — architect declares: likely **EXEMPT** for source-comment-only changes (no user surface; per learning #24). If the T178 pipeline output requires a build step, architect re-confirms.
- [ ] AC11 — `npm run build` clean; full test suite passes
- [ ] AC12 — Strict-bar `trace:audit:strict` per-Test 7-hop CI gate (T170 follow-on per learning #27) can now be enabled without immediately failing — T128.4 unblocks it

## Subtasks
None (atomic sub-task of T128 parent — single retrofit pass, single re-run of T178 pipeline, single tester reverify).

## QA Audit & User Feedback
- 2026-06-04: PO directs T128.4 stand-up as a formal task — tester proved 0/44 tests 7-hop reachable after T178 pipeline shipped (`c6c695a4`). Root cause: 50 impl markers + 21 test markers missing in source/test files. T128.4 closes the marker gap so T178 pipeline can link deterministically. 4-role: architect + req map → expert markers → tester 44/44.
- 2026-06-04: Planner pre-flight noted T128 parent already lists T128.4 ("method markers retrofit") as a scoped sub-task; T128.4 now becomes a formal task file per PO direction (was a planning-line reference only).
- 2026-06-04: **IN FLIGHT** — architect + req JOINT creating **6 new UseCase units for S14/S15 classes** (existing data had S14/S15 Class units without UseCase parents → broke the chain at UC hop even when method markers landed). UseCase creation is the prerequisite for the mapping table — once landed, T128.4 marker retrofit can proceed deterministically. Tracked separately from the marker-addition AC2/AC3.
- 2026-06-04: T178 pipeline iteration progress (cc152130 + 194d747c heuristic improvements): Method→Impl 30→42 links, Impl→Test 16→15. Tester latest reachability snapshot: **36/44** (up from 0/44 baseline) — the improved heuristic + ongoing UC creation lifted reachability without changing the marker counts. T128.4 ACs unchanged; full 44/44 still requires the 50+21 marker retrofit on top of the UC creation.
- Pending: architect + req JOINT (1) finish 6 new UseCases for S14/S15 → (2) mapping table → expert marker additions → expert pipeline re-run → tester 44/44 verification → Tron QA closes the chain-data story.

---

**Sprint:** Sprint 17 — Scenario Units
**Parent:** T128 (migration to scenario-unit model)
**Phase:** sub-task of T128 — method marker retrofit (closes R17.13 + completes the bottom-2 hops of the 7-step chain)
**Follows:** T178 (`c6c695a4` pipeline shipped) · T172 (238/238 unit reachability) · T168 (LOCKED 7-step)
**Unblocks:** T178 final closure · T124 + T168 final closure · strict-bar per-Test 7-hop CI gate enablement
**Rule-pair scope:** (a)+(b) likely EXEMPT (source-comment-only; no user surface — per learning #24); architect confirms.
