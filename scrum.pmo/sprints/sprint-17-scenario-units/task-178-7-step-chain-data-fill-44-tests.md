[Back to Sprint 17 Planning](./planning.md)

# T178: 7-step chain DATA-FILL — populate UC→Class→Method→Impl→Test forward refs (KEYSTONE for R-J + R-E)
[task:uuid:4bd33c18-a707-4ca3-8c87-9cc1a5c2f516]

> **PO direction 2026-06-03:** Tester found the 7-step CODE is ready (T168
> `e714e255` v0.5.77 LOCKED chain + standard) but the DATA only chains 3 deep
> (Req → Task → Subtask). The four downstream hops — UseCase→Class,
> Class→Method, Method→Implementation, Implementation→Test — have UNPOPULATED
> forward arrays in the scenario index. Result: **44 tests all report "chain
> gap"** when walked from a Requirement root → R-J ("every Test reachable via
> the chain") + R-E ("chain starts with atomic requirements") NOT satisfied in
> the data. KEYSTONE for R-J. 4-role: architect designs the linking (parse
> PUML/impl/test markers → forward refs); expert populates; tester proves
> 44/44 tests chain-reachable.

## Status
- [x] Planned
- [x] In Progress
  - [ ] refinement (architect designs the marker-parser pipeline + linking rules per chain hop)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - PO directive 2026-06-03 (Tron-relayed): data-fill 4 downstream hops so 44/44 tests chain-reachable
  - **R-Q** `[requirement:uuid:cd5dc5b7-371e-43dc-aa34-0257407716f7]` — every Test (44/44) must be reachable via the full 7-step chain from a Requirement root (planner pre-seed; closes R-J + R-E in DATA)
- follows
  - T168 (`e714e255` v0.5.77 — 7-step canonical chain LOCKED in CODE; T178 closes the DATA side)
  - T172 (`3fefc68` — 5-step forward-ref population achieved 238/238 reachability at the unit level; T178 extends to test-level reach)
  - T117 (S16 — UseCase as class instances in PUML; PUML is one of the marker sources)
- unblocks
  - R-J + R-E full satisfaction in data (not just code/spec)
  - S17 closure (Tron QA can sign off the full 7-step chain end-to-end after this lands)
- down
  - None (atomic task — single data-fill pass with architect-designed marker parser)

## Task Description (planner seed — architect designs)

**Gap diagnosis (PO 2026-06-03 from tester):**
- 7-step CODE: ✅ ready — T168 `e714e255` v0.5.77 adds `Implementation: ['tests']` to `FORWARD_KEYS`; `traceability-standard.md` LOCKED 7-step with atomic-req roots.
- 7-step DATA: ⚠️ only 3 hops populated (Requirement→Task→Subtask). T172's 5-step population worked at the unit-existence level (238/238) but stopped short of fully populating the per-instance forward arrays at the 4 deeper hops.

**Four hops to fill (architect designs linking rules + marker sources):**
1. **UseCase → Class[]** — each UseCase's `classes[]` forward array populated from the UseCase's PUML (T117 `<<UseCase>>` instances) or from class-side `useCases[]` reverse-scan
2. **Class → Method[]** — each Class's `methods[]` forward array populated from source code (`Class.ts` → its declared methods) OR `class:uuid:` markers in source / test files
3. **Method → Implementation[]** — each Method's `implementations[]` array populated from `impl:uuid:` annotations in source code (the existing convention from T172 step-5)
4. **Implementation → Test[]** — each Implementation's `tests[]` array populated from `test:uuid:` annotations in test files (existing convention)

**Architect to design:**
- A `populate-forward-refs.ts` (or extension of T172's 5-step pipeline) that scans the right marker sources per hop and writes the forward arrays into the scenario index `.scenario.json` files
- Boundary: this is DATA migration, not schema change — units already exist, only their forward arrays are empty
- Idempotency: re-running the pipeline produces the same data (no duplicates, no rewrites if already filled)

**Expert implements:** the architect-designed pipeline; runs it once; commits the data delta.

**Tester verifies:** 44/44 tests reach a Requirement root via the full 7-step chain (walk-test in trace-cli or a dedicated chain-reach script).

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — anchor R-Q verbatim if Tron relays additional context
- **robbin-architect** — design the marker-parser pipeline + linking rules per chain hop (PUML for UC→Class; source code for Class→Method, Method→Impl, Impl→Test)
- **robbin-expert** — implement the pipeline; run it; commit the data delta in scenario index; rule-pair (a)+(b); **(c) STATIC_SHELL likely exempt** (data-only migration, no user surface — per learning #24 rule-pair exemption)
- **robbin-tester** — verify 44/44 tests reach Requirement roots via 7-step chain walk; regression on T172's 238/238 unit reachability (must not drop)

## Acceptance Criteria

**R-Q (44/44 tests chain-reachable end-to-end):**
- [ ] AC1 — Architect's marker-parser pipeline committed (file path + design diagram in this task file)
- [ ] AC2 — Pipeline implementation committed by expert; runs idempotently
- [ ] AC3 — UseCase forward arrays populated (`classes[]` non-empty for each UC that has class implementations)
- [ ] AC4 — Class forward arrays populated (`methods[]` non-empty for each Class with declared methods)
- [ ] AC5 — Method forward arrays populated (`implementations[]` non-empty for each Method linked via `impl:uuid:` markers)
- [ ] AC6 — Implementation forward arrays populated (`tests[]` non-empty for each Implementation linked via `test:uuid:` markers)
- [ ] AC7 — Tester walks 44/44 tests back to a Requirement root via the full 7-step chain; **0 chain-gap reports**
- [ ] AC8 — R-J ("every Test reachable via the chain") + R-E ("chain starts with atomic requirements") satisfied in DATA, not just code/spec

**Backwards-compat + ship rules:**
- [ ] AC9 — T172's 238/238 unit reachability preserved (no regression)
- [ ] AC10 — Existing trace-cli walk-up + walk-down still pass on the populated data
- [ ] AC11 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump; **(c) STATIC_SHELL exempt** — data-only migration, no user-surface change (architect confirms in refinement per learning #24)
- [ ] AC12 — `npm run build` clean; full test suite passes

## Subtasks
None (atomic task — single architect-designed pipeline, single expert pass, single tester reverify).

## QA Audit & User Feedback
- 2026-06-03: PO directs T178 stand-up — KEYSTONE for R-J. Tester finding: 7-step CODE ready but DATA only 3 deep (Req→Task→Subtask); UC→Class→Method→Impl→Test forward arrays UNPOPULATED → 44 tests all "chain gap" → R-J + R-E NOT satisfied in DATA. Architect designs marker-parser pipeline; expert populates; tester proves 44/44 chain-reachable.
- 2026-06-04: PO folds Tron live-/trace **lazy-load-deeper-fails** observation into T178. Symptom: /trace tree expand stops working at some depth. **Two possible causes (architect to diagnose):** (i) empty deep DATA — exactly T178's existing scope (forward arrays unpopulated at deeper hops); (ii) tree mechanism bug — the lazy-load fetch / render code might fail even when data IS present. Architect's diagnosis must separate the two: run the marker-parser → re-test /trace deeper expand → if still fails with populated data, it's mechanism not data. Add AC to T178: "Live /trace tree expands all 7 hops with SW active (strict-bar 2b); if mechanism bug separate from data, escalate as a follow-on commit within T178 scope or a tight follow-on task."
- 2026-06-04: PO critical-path note — T180 (real CA cert + CDP workaround) ranks ABOVE T178 until shipped (Tron locked out of real device). T178 architect can still start design in parallel.
- 2026-06-04: Expert iterates pipeline (`cc152130` + `194d747c`) — heuristic improvements + 9 dedicated Impl units for UUID collisions; Method→Impl 30→42 links, Impl→Test 16→15 links. Both commits data-only (no version bump, rule-pair exempt per learning #24).
- 2026-06-04: **Tester reachability snapshot: 36/44 (up from 0/44 baseline)** — heuristic + ongoing T128.4 UC-creation lifted reach without marker changes. Full 44/44 still gated on T128.4 marker retrofit (50+21 markers) on top of the in-flight UC creation.
- 2026-06-04: **IN FLIGHT (architect + req JOINT)** — creating 6 new UseCase units for S14/S15 Classes (data gap: S14/S15 Classes lacked UseCase parents, breaking the chain at the UC hop). Tracked formally in T128.4 QA Audit; T178 closure absorbs the UC creation since it directly raises reachability.
- 2026-06-04: Expert `f306e503` v0.5.82 ships T178 overlay-read fix — serves ALL forward refs from scenario index (DetailView overlays now read complete forward arrays, no truncation). Rule-pair (a)+(b) ✓; (c) STATIC_SHELL unchanged; 836/836 pass.
- 2026-06-04: Tester `c0f61299` authored T183 (7-hop CI gate spec) — formal companion to T178; gate is ready before fill; expert implements per the spec.
- Pending: architect + req finish 6 new UseCases → T128.4 marker retrofit → expert pipeline re-run → tester walks **44/44** + live /trace 7-hop expand with SW active → T183 gate enabled → Tron QA closes R-J fully.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 34 — R-Q (7-step chain DATA-fill — KEYSTONE for R-J + R-E)
**Follows:** T168 (`e714e255` 7-step code/spec) · T172 (`3fefc68` 5-step unit reachability)
**Unblocks:** R-J + R-E full satisfaction in DATA · S17 closure (full chain end-to-end, Tron QA gate)
**Rule-pair scope:** (a)+(b) required; (c) STATIC_SHELL exempt (data-only migration; per learning #24).
