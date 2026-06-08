[Back to Sprint 18 Planning](./planning.md)

# T201: 6-step chain correction — propagate `Requirement→UseCase→Class→Method→Implementation→Test` (Task is NAVIGATION, not chain) across skill → standards → code → data → views

[task:uuid:53b926d6-3b94-4ade-9226-910963cf1350]

> **PO direction 2026-06-08:** Foundational correction (architect's SKILL.md #79).
> The prior 7-step chain (with Task in chain) was the ROOT ERROR that caused
> Req→Task 2-cycles, Tasks-as-chain-children display bugs, and the navigation/
> traceability confusion. Multi-layer correction; each layer VERIFIED before the
> next. Tron wants this diligent. Stand up with per-cycle pre-gate.

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement (architect leads — propagation sequence + per-layer gate criteria)
  - [ ] creating test cases
  - [ ] implementing (multi-role per layer; see Layers below)
  - [ ] testing (tester re-runs `trace:audit:strict` per layer; expects post-correction reachability holds)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only. Never checked by planner/sync.

## Pre-gate triple-check (applied at stand-up 2026-06-08)
**(a) Chain wiring:** `coveredRequirements[]` + `useCases[]` BOTH populated (real v4 placeholders per learnings #17, adoption per #20). ✓
**(b) Rule-pair (#15/#16):** Layers 3/5 touch user-facing surface — AC enforce (a) `package.json` + (b) `sw.js` CACHE_NAME bump per impl-shipped layer. Layers 1/2/4 are docs/data-only — exempt per learning #24 (expert/architect self-notes). ✓
**(c) Tron-QA gate (#9/#10):** `[ ] Done` unchecked; gate stays Tron's. ✓
**Self-reflexive note:** this task itself uses the new (correct) 6-step chain in its Traceability — `coveredRequirements` (Task→Requirement, navigation) + `useCases` (Requirement→UseCase, chain start). NO `task→useCase` edge in T201's own chain. The fix dogfoods itself.

## Traceability

`[task:uuid:53b926d6-3b94-4ade-9226-910963cf1350]`

- up
  - [Sprint 18 Planning](./planning.md)
  - **coveredRequirements[]** — Task→Requirement NAVIGATION (not chain hop):
    - **R-chain-6step** (planner placeholder; req-eng to canonicalize verbatim Tron quote on chain correction): `[requirement:uuid:1632009f-624f-4ceb-854e-564d0ffc646a]` — "The chain is `Requirement → UseCase → Class → Method → Implementation → Test` (6 steps). Task is NOT in the chain — it is in the NAVIGATION layer (`Sprint → Task → coveredRequirements → [chain starts at Requirement]`)." Authority: architect SKILL.md Rule 1 (`session/agents/robbin-architect/SKILL.md:25`); traceability-standard.md header (already corrected 2026-06-08).
- chain (Requirement → UseCase → Class → Method → Implementation → Test) — **6 steps; Task is NOT a chain node**
  - **requirement:** R-chain-6step (above)
  - **useCases[]** (planner placeholder; architect to canonicalize at design):
    - `[usecase:uuid:88a1c3a0-5c94-4ed0-af62-01442a6d4fd7]` — likely `chain.walk.requirementRooted` or `chain.audit.sixStep`. Architect to canonicalize at design.
  - **class:** TBD (architect — chain walker + audit script classes; e.g. ScenarioIndex, trace-audit-strict)
  - **method:** TBD
  - **implementation:** TBD
  - **test:** TBD — Playwright + scripted audit gates per layer
- follows
  - T168 (the LOCKED 7-step T168 was the prior-incorrect version; this task supersedes T168's chain definition with the corrected 6-step)
  - T178 (R-Q 7-step chain DATA-fill keystone) — the data populated under the old 7-step assumption; Layer 4 re-validates
  - T172 (strict-direction audit + massive orphan fix) — audit infrastructure to re-run per layer
  - T199 (`ownerIor` + `unitLinks[]` integrity) — adjacent data-integrity task
- down
  - None (atomic across layers; each layer's verification gate is the only sub-structure)

## Standards consistency audit (planner, 2026-06-08)

Grepped `scrum.pmo/standards/` for the prior 7-step (Task-in-chain) statements:

| File | Status | Evidence |
|------|--------|----------|
| `traceability-standard.md` | **PARTIAL** — header corrected (line 8: "LOCKED 6-step canonical chain (corrected 2026-06-08; was 7-step with Task in chain — Task is NAVIGATION, not chain)"; line 18: "Task is NOT in the chain"), BUT residual 7-step language at lines 25 + 309 ("the 7-step chain"). Needs full sweep. |
| `intention-verification-model.md` | **WRONG (uncorrected)** — line 30: literal "Requirement → Task → UseCase → Class → Method → Implementation → Test"; line 35: "This is the LOCKED 7-step chain"; line 55: "7-step chain (code traceability ✓)"; line 153: "7-step forward-only". Whole doc still uses the old 7-step. |
| `refinement-precedence-analysis.md` | **MIXED** — line 17 references the LOCKED 7-step (T168) as basis; line 58 has the corrected 6-step note ("Task is NAVIGATION, not chain — corrected 2026-06-08"); line 126 has the WRONG forward-only sequence "Requirement → Task → UseCase". Need to resolve internal contradiction. |
| `scenario-data-pipeline.md` | **PROBABLY OK** — references `model.tasks[]`, `useCases[]` as Sprint arrays + the 9 unit types (Sprint, Requirement, Task, …, TraceLink); these are accurate (Task is a unit type / Sprint navigation child). NO claim that the chain includes Task. Layer 2 to confirm with a careful read. |

**Total wrong-chain files:** 3 (intention-verification-model.md + refinement-precedence-analysis.md + traceability-standard.md residuals) — matches PO's count. `scenario-data-pipeline.md` flagged for verification but appears clean.

## Multi-Layer Plan — each layer VERIFIED before the next

Architect leads the orchestration. Per-layer gate criteria are explicit; the next layer does NOT start until the prior layer's gate is recorded PASS in this task file's "Layer status" section (added during refinement).

### Layer 1 — SKILL files (planner + architect + req-eng SKILL.md)
**Already (largely) DONE:**
- Architect SKILL.md Rule 1 (line 25): "Requirement→UseCase→Class→Method→Implementation→Test (6 steps). No Task in the chain." ✓
- Planner SKILL.md: must adopt the chain definition in the Operating Discipline + Sync Rule (currently references chain via `coveredRequirements[]` + `useCases[]` which is structurally correct; verify wording).
- Req-eng SKILL.md: must use 6-step chain in `chain-walk.md` skill + related rules.

**Gate (Layer 1 PASS):** all three SKILL.md files state the 6-step chain identically; no residual "7-step" wording. Planner verifies by grep.

### Layer 2 — STANDARDS (4 files audited above)
Architect rewrites the chain statements consistently across:
- `intention-verification-model.md` (whole doc; ~5 occurrences)
- `traceability-standard.md` (residual lines 25 + 309)
- `refinement-precedence-analysis.md` (lines 17 + 126; reconcile with line 58 note)
- `scenario-data-pipeline.md` (verify clean; no edit expected)

**Gate (Layer 2 PASS):** `grep -rE "7.step|→ Task → UseCase|Requirement → Task → UseCase"` returns 0 hits across `scrum.pmo/standards/`. Planner runs the grep.

### Layer 3 — CODE (chain walkers + audit scripts)
**Targets:** `scripts/trace-audit*.mjs|ts`, `scripts/populate-forward-refs.ts`, `ScenarioIndex` chain walk methods, `IOR.resolve()` callers that walk hops, `rb-trace-tree.ts` lazy-load `/api/trace/children/<uuid>` FORWARD_KEYS map.

Specifically: the `FORWARD_KEYS` map in `server.ts` (T173 endpoint) currently has:
```
'Task': ['subtasks', 'useCases'],
```
The `'useCases'` exit from Task is the old 7-step edge. Under the 6-step correction:
- Chain walks from Requirement use `Requirement.useCases[]`
- Task→useCase is NAVIGATION metadata, not a chain hop
- The lazy-load endpoint must distinguish "navigation children" (Sprint→Task, Task→coveredRequirements) from "chain children" (Requirement→useCase, etc.)

Architect designs the code-level distinction.

**Gate (Layer 3 PASS):** all chain walks short-circuit at Task→Req boundary (Task does not contribute a chain hop); navigation walks (Sprint→Task→coveredReq) work independently. Tests pass. Rule-pair (a)+(b) bump if surface impact.

### Layer 4 — DATA (scenario units re-validation)
With Layer 3 walkers corrected, re-run `trace:audit:strict` against the existing 768 units. Expected outcome:
- Chain reachability from Requirement roots remains intact (no Task-mediated paths anyway under correct walking; just confirms the count holds when Task→UC is excluded).
- Orphan-by-design count unchanged (Sprint + TraceLink only).

Any orphans newly exposed = a Requirement that previously chained ONLY via a Task→UC edge (data bug, not architecture). Architect/expert backfill the missing `Requirement.useCases[]` direct edge.

**Gate (Layer 4 PASS):** champagne metric (e.g. 44/44 7-hop earlier → re-measured under 6-step) holds at the same or better number; no chain regression. Newly-found Requirement→UC edge gaps backfilled.

### Layer 5 — VIEWS (/trace tree + DetailViews)
The `/trace` tree currently roots at Requirement (T173+T178) and shows chain via `rb-trace-tree.ts`. Under the 6-step correction the tree must:
- Show Sprint → Task → Requirement as NAVIGATION (the parent path of every Requirement)
- Show Requirement → UseCase → Class → Method → Implementation → Test as CHAIN (the 6 hops below the Requirement)
- DetailViews must label each link by its TYPE (navigation vs chain) so users see the distinction

T200 (tree↔detail sync) interacts here — coordinate.

**Gate (Layer 5 PASS):** rendered tree visually distinguishes navigation vs chain (e.g. icon/label); no "Tasks appear as chain children of Requirements" display bug. Playwright TS confirm.

## Acceptance Criteria
- [ ] AC1 (Layer 1) — All three SKILL.md files state the 6-step chain identically; grep returns 0 residual "7-step" / "Task in chain" wording
- [ ] AC2 (Layer 2) — All 4 standards files consistent: `grep -rE "7.step|→ Task → UseCase|Requirement → Task → UseCase" scrum.pmo/standards/` returns 0 hits
- [ ] AC3 (Layer 3) — Chain walkers + audit scripts treat Task as navigation (no Task→useCase chain hop); `FORWARD_KEYS['Task']` removed or redirected to navigation-only
- [ ] AC4 (Layer 4) — Champagne metric re-measured under 6-step; no chain reachability regression; any newly-exposed Req→UC gaps backfilled
- [ ] AC5 (Layer 5) — `/trace` tree visually distinguishes navigation (Sprint→Task→Requirement) from chain (Req→UC→Class→Method→Impl→Test); no Task-as-chain-child display bug
- [ ] AC6 — Per-layer gate criteria recorded PASS in this task file BEFORE the next layer starts (architect maintains the Layer Status section during refinement)
- [ ] AC7 — Rule-pair (a)+(b) [#15/#16] verified for Layer 3 + Layer 5 impl-shipped commits (Layers 1/2/4 are docs/data-only exempt per learning #24)
- [ ] AC8 — `npm run build` succeeds; full test suite passes after every layer
- [ ] AC9 — Self-reflexive: T201's own task file uses the 6-step chain in Traceability (no Task→useCase edge in its own chain section) — already enforced at stand-up

## Owners (CMM4 4-role; architect LEADS the multi-layer orchestration)
- **robbin-architect** (LEAD) — design the per-layer propagation sequence + gate criteria; supply canonical `useCases[]` (replacing placeholder uc:uuid `88a1c3a0-…`); ensure each layer's gate PASSES before the next begins
- **robbin-req** — canonicalize R-chain-6step requirement scenario unit (replacing planner placeholder req:uuid `1632009f-…`); ensure verbatim Tron quote captured
- **robbin-expert** — implement code/data changes per architect's design at each layer (Layer 3, Layer 4 backfill, Layer 5 render)
- **robbin-tester** — re-run `trace:audit:strict` + Playwright at each layer's gate; confirm PASS before signaling next layer

## Dependencies
- **Requires:** architect SKILL.md Rule 1 (line 25 — already documented); req-eng atomic quote capture; consensus that the 7-step T168 LOCKED definition is superseded
- **Coordinate-with:** T200 (tree↔detail sync) — Layer 5 view changes interact with the sync surface
- **Supersedes:** T168 chain definition (the 7-step LOCKED chain is REPLACED by the 6-step canonical chain)

## Definition of Done
- [ ] All AC met across all 5 layers
- [ ] Each layer's gate recorded PASS in this task file (architect maintains)
- [ ] Per-cycle pre-gate triple-check passed at every transition (⏳→📝→✅→🧪)
- [ ] T168 task file annotated with link to T201 + note "chain definition superseded; see T201"
- [ ] Standards-consistency grep returns 0 hits across `scrum.pmo/standards/`
- [ ] Tron QA approved

## Subtasks
None as separate files — the 5 layers are tracked under "Multi-Layer Plan" above with explicit per-layer gates. Architect-led orchestration; planner monitors gate transitions.

## QA Audit & User Feedback
- 2026-06-08: PO directive — stand up 6-step chain correction (architect's SKILL.md #79) as foundational multi-layer task; each layer VERIFIED before next. Real v4 uuids; standards-consistency audited (3 of 4 standards files have wrong-chain residuals).
- 2026-06-08: Pre-gate triple-check applied at stand-up: (a) chain wiring populated with placeholders (adoption-note); (b) rule-pair captured per-layer (1/2/4 doc-only exempt; 3/5 user-facing); (c) Tron-QA gate untouched.
- 2026-06-08: Self-reflexive — T201's own Traceability uses the new 6-step chain (no Task→useCase edge in its own chain section). The fix dogfoods itself.
- Pending: req-eng canonicalize R-chain-6step → architect orchestrate Layer 1→5 → expert+tester per-layer → Tron QA.

---

**Sprint:** Sprint 18 — Chain Method-Scope & Role Skills
**Requirement:** R-chain-6step (placeholder; req-eng canonicalizing)
**Priority:** HIGHEST (foundational — supersedes T168 chain definition; all subsequent chain-aware code/data/views depend on this)
**Supersedes:** T168 chain definition (7-step LOCKED → 6-step canonical)
