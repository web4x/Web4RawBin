# T201: 6-step chain correction — propagate `Requirement→UseCase→Class→Method→Implementation→Test` (Task is NAVIGATION, not chain) across skill → standards → code → data → views
[task:uuid:53b926d6-3b94-4ade-9226-910963cf1350]

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

## Subtasks

None as separate files — the 5 layers are tracked under "Multi-Layer Plan" above with explicit per-layer gates. Architect-led orchestration; planner monitors gate transitions.
