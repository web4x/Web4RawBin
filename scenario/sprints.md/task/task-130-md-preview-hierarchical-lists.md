# T130: md preview renders hierarchical lists (nested checkboxes) incorrectly
[task:uuid:6461b45e-3b73-4023-bc66-f753662ff798]

## Status

- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing (expert — in flight)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:6461b45e-3b73-4023-bc66-f753662ff798]`

- up
  - [Sprint 13 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:b2dfe117-d591-4715-ba62-07b13a8433c0]` —
    "md preview renders hierarchical lists incorrectly (the CMM3 Status nested
    checkboxes)" (Tron directive 2026-05-30; req-eng to anchor the literal
    verbatim quote in this slot.)
- down
  - None (atomic task)
- follows
  - existing `/md/` markdown renderer (server.ts pageRender / marked configuration); affects every planning.md + task file we publish via /md/
- chain (req → usecase → puml → class/method)
  - **requirement:** Tron 2026-05-30 (req-uuid above)
  - **use case:** md.render (existing); T130 fixes nested-list/checkbox handling within it
  - **puml:** N/A (server-side renderer fix; no new UC needed)
  - **class/method:** `src/ts/server/server.ts` md-render path (marked config / extension) and/or `src/public/app.css` MD_CSS for nested-list indentation

## Task Description

The CMM3 Status block (parent checkbox + nested sub-step checkboxes) renders
incorrectly in `/md/` previews — the hierarchical list structure collapses,
nesting is lost, or sub-items appear at the wrong indent level. Confirm exact
symptom by previewing a known task file (e.g. T100 or T118) at `/md/...` and
note the rendered defect vs the source markdown.

**Expected source (the canonical Web4Articles Status block):**
```markdown

## Acceptance Criteria

- [ ] AC1 — `/md/scrum.pmo/sprints/sprint-13-stability/task-118-e2e-cleanup.md` (or any task with the canonical Status block) renders the In-Progress sub-steps visibly indented under "In Progress"
- [ ] AC2 — Checkboxes render as visual markers (✅/⬜ or equivalent — architect/expert call) at the correct level
- [ ] AC3 — Deeper nesting (3+ levels) also renders correctly (Acceptance Criteria with sub-bullets, etc.)
- [ ] AC4 — No regression: existing non-hierarchical lists, tables, code blocks, links, headings still render the same
- [ ] AC5 — `/md/.../planning.md` files render the symbol-prefixed task list (⏳📝🔧✅🧪🏁 per learning #14) intact
- [ ] AC6 — `npm run build` succeeds; vitest + playwright pass; **(a) package.json + (b) sw.js CACHE_NAME bumped** per learnings #15. **(c) STATIC_SHELL exempt** per #16 (no new route — renderer fix only)
- [ ] AC7 — At least one E2E or visual-regression test covers the nested-Status render (architect/expert decides scope)

## QA Audit & User Feedback

- 2026-05-30: Tron directive — md preview renders hierarchical lists incorrectly (CMM3 Status nested checkboxes). PO routed to S13 stability. Expert in flight. Awaiting impl commit + tester verify, then Tron QA.

## Subtasks

None (atomic task — server-side renderer fix).

---

*Sprint 13 — Stability*
*Owner: robbin-expert (impl, in flight), robbin-tester (verify)*
*Priority: 9 (rendering correctness — affects every planning.md + task on /md/)*
