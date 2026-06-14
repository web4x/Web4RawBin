# T186: Tree-view lazy-load at every chain level — seed-mode TREE-UI fix (R-Y1 + R-Y2)
[task:uuid:daf76389-603e-4507-af7a-1597c2633c83]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect `c0ddf1af` — 3-bug diagnosis in seed-mode `buildSeedNode`)
  - [x] creating test cases (tester — 7-level live-expand verification)
  - [x] implementing (expert `69c3ef83` v0.5.84 — grandchildren fetch + has-children flag + toggle-children handler)
  - [x] testing (tester verified live 7-level expand per PO 2026-06-05)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) — R-Y1 + R-Y2 (req-eng `58acb8e4`; planner replaced fake-suffix uuids per learning #17)
  - **R-Y1** `[requirement:uuid:fbbbf9cb-8e9b-4cb4-9d99-56110ca209b5]` — TREE view lazy-loads children on expand at every level of the canonical chain (req→task→useCase→class→method→implementation→test).
  - **R-Y2** `[requirement:uuid:75db0534-28d8-4fae-bb1f-bf60ace6ae57]` — Tree expand/collapse works for children of ANY scenario type (all 7 uniformly).
- follows
  - T178 (DATA-side 44/44 KEYSTONE — `452f8d5d`; provides the chain data this TREE-UI then walks)
  - T173 (file-browser `.scenario.json` click → `/trace?ior=`) · T175 (Tree base + parent/children getters)
- down
  - None (atomic task — single TREE-UI bug class shipped in one commit)

## Acceptance Criteria

**R-Y1 — tree lazy-loads at every chain level:**
- [x] AC1 — Tree fetches children on expand at depth ≥ 2 (grandchildren+) via `/api/trace/children/<uuid>` (`69c3ef83`)
- [x] AC2 — `has-children` flag reflects API truth, not `children.length` — expander shows even before children are loaded (`69c3ef83`)
- [x] AC3 — Tester live-verified 7-level expand on a real chain (req→task→UC→class→method→impl→test) per PO 2026-06-05

**R-Y2 — expand/collapse uniform across all 7 types:**
- [x] AC4 — Method → Implementation expand works
- [x] AC5 — Implementation → Test expand works
- [x] AC6 — All 7 types behave identically (no silent failures by type)

**Backwards-compat + ship rules:**
- [x] AC7 — Rule-pair (a) `package.json` v0.5.84 ✓
- [x] AC8 — Rule-pair (b) `sw.js` CACHE_NAME `rawbin-v0.5.84` ✓
- [x] AC9 — Rule-pair (c) EXEMPT (existing route + existing bundles; expert-declared)
- [x] AC10 — Full test suite passes (verified at expert commit)
- [ ] AC11 — Tron QA approval (gate — pending)

## QA Audit & User Feedback

- 2026-06-05: Tron live feedback (post-T178 cascade): TREE view does not lazy-load below first level despite DetailView drill-down working. expand/collapse must work for ALL types.
- 2026-06-05: req-eng `58acb8e4` captured R-Y1+R-Y2 (fake-suffix uuids planner-replaced per learning #17 with real v4: R-Y1 `fbbbf9cb-…`, R-Y2 `75db0534-…`).
- 2026-06-05: Architect `c0ddf1af` diagnosed 3 bugs in seed-mode `buildSeedNode` (grandchildren fetch / has-children flag / toggle-children handler).
- 2026-06-05: Expert `69c3ef83` v0.5.84 shipped fix (rule-pair (a)+(b) ✓; (c) EXEMPT).
- 2026-06-05: Tester live-verified 7-level expand (per PO confirmation when directing T186 stand-up).
- 2026-06-05: PO direction — "stand up T186 for the v0.5.84 tree-lazy-load fix (R-Y1+R-Y2); do NOT fold into closed T178. Distinct layer, distinct fix — own task = clean traceability." T186 ✅ impl-shipped + tester-verified; Tron QA pending.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 42 — Tron R-Y (TREE-UI lazy-load at every depth + uniform expand/collapse)
**Priority:** Mid — Tron-visible regression on /scenario tree drill-down; shipped same-day
**Companion:** T178 (DATA-side 44/44 — provides the chain data this TREE-UI walks; clean separation per PO 2026-06-05)
**Status symbol:** ✅ impl-shipped + tester-verified (Tron QA pending)

## Subtasks

None (atomic task — single TREE-UI bug class shipped in one commit).
