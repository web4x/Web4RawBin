[Back to Sprint 17 Planning](./planning.md)

# T182: Browse-source href fix — rb-task-detail.ts:41 must link to obj.source (file:line), not /scenario?ior=
[task:uuid:383938b1-19e3-46c5-a7c6-0e4bdbae7af1]

> **PO direction 2026-06-04:** Stand up T182 as a formal task. The "Browse-
> source" affordance in `rb-task-detail.ts:41` currently links to
> `/scenario?ior=${obj.uuid}` (which renders the scenario tree at that
> instance). That is NOT a source-code view — it is the same /scenario view
> reached from other affordances. The intent of "Browse source" is to navigate
> to the **actual source file + line** (e.g. `/md/src/.../File.ts#L42`) per the
> unit's `model.source` IOR (R17.24 source-location). 4-role: architect
> diagnosed; expert implementing. (Stand-up follows the work — per learning #20
> architect-concurrent pattern, planner reconciles structure to existing work.)

## Status — ✅ impl-shipped (expert cf6182f1 v0.5.81 — scenario-view link on ALL 7 DetailViews)
- [x] Planned
- [x] In Progress
  - [x] refinement (architect diagnosis — `rb-task-detail.ts:41` href is wrong target; should use `obj.model.source` IOR or generated /md/ path)
  - [x] creating test cases
  - [x] implementing (expert `cf6182f1` v0.5.81 — scenario-view link applied to ALL 7 DetailViews; rule-pair (a)+(b)+(c) ✓ verified — STATIC_SHELL updated; 836/836 pass)
  - [ ] testing (PENDING — tester SW-active per strict-bar 2b: each DetailView affordance routes correctly; /scenario unchanged for the other affordance)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

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

## Task Description (planner seed — architect diagnosed; expert implementing)

**Current code (`src/public/ts/trace/rb-task-detail.ts:41`):**
```typescript
<div class="dv-field">
  <a href="/scenario?ior=${obj.uuid}" class="dv-file-link" style="color:#ff9800;font-size:0.75rem;text-decoration:none">📄 Scenario view</a>
</div>
```

Although the label currently reads "📄 Scenario view," the bug is that this is
the only "browse" affordance in the Task DetailView and it goes to the
scenario tree — duplicating the natural `/scenario?ior=` navigation from
elsewhere. There is no affordance that takes the user to the actual source
file. Per PO direction this should become a **Browse source** affordance
linking to the unit's `model.source` IOR (typically `src/...:line`).

**Architect diagnosis:**
- Each scenario unit carries `model.source` (R17.24) when migrated — typically
  a file path + optional line range (e.g. `"src/ts/server/server.ts:626-642"`)
- DetailViews can render two distinct affordances:
  1. **Browse source** (T182 — new fix): `href="/md/<source-path>#L<line>"`
     for in-app source render, OR a direct file path link if a dedicated
     source viewer exists
  2. **Scenario view** (existing /scenario?ior= — fine): clicked from the
     tree icon or a separate explicit link, NOT the "Browse source" slot
- The label "📄 Browse source" should be reserved for affordance (1)

**Expert implementation:**
- Modify `rb-task-detail.ts:41` (and analogous DetailViews — Method, Class,
  Implementation, Test — wherever a source affordance exists) to:
  - Read `obj.model.source` (typed Source IOR per R17.24)
  - Build a `/md/<file>#L<line>` href (or whatever in-app convention applies)
  - Fall back gracefully when `model.source` is absent (hide the affordance
    or show a disabled state)
- Keep the existing /scenario?ior= link if architect decides it should remain
  as a separate affordance, but in a DIFFERENT slot/label

**Tester verifies:**
- For a Task with `model.source` set, the Browse-source affordance navigates
  to the source file/line view (not /scenario)
- For a Task without `model.source`, the affordance is absent or disabled
- The /scenario?ior= navigation still works from its intended affordance(s)

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — anchor R-W verbatim if Tron relays additional context
- **robbin-architect** — diagnosed (this task file captures the diagnosis); confirms which DetailViews need the fix beyond rb-task-detail
- **robbin-expert** — implementing in-flight per PO 2026-06-04; rule-pair (a)+(b); (c) STATIC_SHELL likely required if DetailView bundle hash changes (architect declares per learning #16)
- **robbin-tester** — verify each affected DetailView: source-affordance routes to source file/line; /scenario affordance unchanged; SW-active per strict-bar (2b)

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

## Subtasks
None (atomic task — single affordance correction across affected DetailViews).

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
