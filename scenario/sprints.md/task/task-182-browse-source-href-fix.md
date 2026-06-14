# T182: Browse-source href fix — rb-task-detail.ts:41 must link to obj.source (file:line), not /scenario?ior=
[task:uuid:383938b1-19e3-46c5-a7c6-0e4bdbae7af1]

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - PO directive 2026-06-04 (Tron-relayed): Browse-source affordance wrong target; should be source file:line not /scenario tree
  - **R-W** `[requirement:uuid:f230df9d-6c18-4591-ac09-7c2e28853093]` — DetailView affordances labeled "Browse source" / "📄 Source" / similar MUST navigate to the actual source file + line (per the unit's `model.source` IOR), NOT to the scenario tree view (which is a different affordance with its own existing link). Each affordance must clearly do what it says. (planner pre-seed; req-eng to anchor verbatim Tron quote if relayed)
- follows
  - R17.24 (source-location IOR — `model.source`) — T182 makes a DetailView consumer of it
  - T141 (chain-link icon convention) — same icon/affordance pattern but distinct target
  - T177 (`e83c8c05` ior-format normalization; /scenario?ior= resolver) — T177 is fine for /scenario clicks; T182 fixes a DIFFERENT affordance that was misrouted to /scenario
- unblocks
  - User can actually navigate from a Task's DetailView to its implementing source code; the affordance label matches the destination
- down
  - None (atomic task — single href correction + tester verify)

## Acceptance Criteria

**R-W (Browse-source affordance routes to source, not scenario):**
- [ ] AC1 — `rb-task-detail.ts:41` source affordance links to `model.source` (file+line view) NOT `/scenario?ior=`
- [ ] AC2 — Same fix applied to any analogous DetailView (Method, Class, Implementation, Test) where a source affordance exists
- [ ] AC3 — The /scenario?ior= navigation remains available from its intended affordance (tree icon, etc.) — no regression on existing /scenario UX
- [ ] AC4 — When a unit has no `model.source`, the affordance is absent or visibly disabled (no broken/dead link)
- [ ] AC5 — Affordance label and behaviour match: "Browse source" → source file; "Scenario view" → /scenario?ior=

**Backwards-compat + ship rules:**
- [ ] AC6 — No regression on other DetailView links (Traceability Chain, etc.)
- [ ] AC7 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump; **(c) STATIC_SHELL** per architect declaration (DetailView bundle hash change likely)
- [ ] AC8 — `npm run build` clean; full test suite passes; new affordance spec passes (SW active per strict-bar 2b)

## QA Audit & User Feedback

- 2026-06-04: PO directs T182 stand-up as a formal task — Browse-source affordance in rb-task-detail.ts:41 wrong target (/scenario tree instead of source file:line). Architect diagnosed; expert implementing in-flight. Planner reconciles structure per learning #20 (work landed/landing before formal stand-up).
- 2026-06-04: PO labels this "B" (likely shorthand for the bug or backlog category). Stand-up is the formal track.
- Pending: expert ships → tester verifies (each DetailView, SW active per strict-bar 2b) → Tron QA closes the affordance correctness.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 38 — R-W (Browse-source affordance correctness — DetailView source link routing)
**Follows:** R17.24 (source-location IOR `model.source`) · T141 (chain-link icon convention) · T177 (/scenario?ior= resolver — unrelated; T182 fixes a DIFFERENT affordance)
**Unblocks:** Source-navigation UX from Task DetailView (and analogous DetailViews); affordance label-vs-behaviour clarity
**Rule-pair scope:** (a)+(b) required; (c) STATIC_SHELL per architect declaration.

## Subtasks

None (atomic task — single affordance correction across affected DetailViews).
