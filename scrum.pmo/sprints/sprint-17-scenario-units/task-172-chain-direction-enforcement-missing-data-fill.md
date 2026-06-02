[Back to Sprint 17 Planning](./planning.md)

# T172: Chain-direction enforcement + missing-data fill (R-H) + atomic-requirement-split rule (R-H.2)

[task:uuid:7bf0199c-f8e0-4af5-b383-e2fdee1152bc9]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req + architect — **JOINT, Tron-assigned**)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
>
> **Tron-assigned JOINT refinement (architect + req-eng)** — PO 2026-06-02:
> Tron sees **massive orphans + wrong-order deps on live `/trace`** despite
> T169's audit reporting clean metrics. Two possibilities (architect + req to
> diagnose jointly): (a) the audit is too lenient (counts what it shouldn't,
> misses what it should), (b) the display reveals direction violations the
> audit doesn't catch. Likely fix: **strict-direction audit** (every link
> follows the LOCKED chain order strictly, no reverse) + a remigration pass
> to enforce.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — planner-first per PO direction 2026-06-02; refinement is JOINT (Tron assignment):**
1. **robbin-req + robbin-architect — JOINT refinement** — anchor the verbatim Tron R-H observation; diagnose **why live `/trace` shows orphans + wrong-order deps despite audit clean** (audit-too-lenient vs display-reveals-deeper-violation); design strict-direction enforcement (every link must traverse the LOCKED chain `req → task → usecase(s) → class → method → implementation → test(s)` in the forward direction only — never reverse); design the remigration pass that strips wrong-direction links + fills missing forward links; specify how T169's audit must change to catch what it currently misses
2. **robbin-expert** — implement per joint design (strict-direction validator + remigration); rule-pair (a)+(b)
3. **robbin-tester** — verify on live `/trace`: zero visible orphans, zero wrong-order deps; T169 audit re-run with the strict-direction rule reports clean; regression on T169/T171

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:7bf0199c-f8e0-4af5-b383-e2fdee1152bc9]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **PO finding from live /trace observation (2026-06-02):**
    `[requirement:uuid:383c3b28-1f62-488a-b362-8811fc6af9e9]`
    > PO DIRECTIVE (R-H): Tron sees massive orphans + wrong-order deps on live `/trace` despite audit-clean metrics. Means: our audit is too lenient OR the display reveals direction violations the audit doesn't catch. Likely needs strict-direction audit (every link must follow LOCKED order strictly, no reverse) + remigration pass to enforce.
- down
  - None at parent level; architect may split T172.x sub-tasks per fix category
- follows
  - [T169: data-quality audit + remigrate (KEYSTONE)](./task-169-data-quality-audit-remigrate-complete-tree.md) — T172 hardens the audit Tron observed as too lenient
  - [T168: chain order 7-step + atomic requirements as tree ROOTS](./task-168-chain-order-7-step-requirements-as-roots.md) — supplies the LOCKED chain direction T172 enforces strictly
  - [T171: untraced-closure + matrix refresh](./task-171-untraced-closure-r17-26-linkback.md) — closed the original 50 untraced + R17.26 link-back; T172 closes the deeper direction-correctness gap T171 didn't catch
- relates-to
  - [T170: no-stop sustain (CI gates)](./task-170-diligent-plan-no-stop-sustain.md) — strict-direction rule becomes a sustain gate after T172 lands
- chain (req → task → usecase(s) → class → method → implementation → test(s); 1:N at plural hops, per T168 — **forward direction only, strictly enforced by this task**) — architect/req joint fills on refinement
  - **requirement:** R-H (above)
  - **use case:** UC-TBD (architect + req — likely `audit.strictDirection` / `migration.forwardOnly.enforce` / `display.directionValidate`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** strict-direction validator + remigration script + audit-update + display-side check (if applicable) — TBD
  - **implementation:** TBD
  - **test:** live `/trace` direction audit + T169 re-run with strict rule — TBD

## Context

T169 KEYSTONE shipped audit + remigration; T171 closed 50 untraced + R17.26
link-back; tooling reports clean metrics. **But Tron's live `/trace` view
shows massive orphans + wrong-order deps.**

Two diagnoses possible — architect + req-eng jointly determine which (per PO
Tron-assignment for joint refinement):
1. **Audit too lenient** — current audit counts forward-walkability without
   verifying the link's *direction* matches the LOCKED chain order. A link
   could exist but point against the canonical flow; audit accepts it,
   display can't render it as a tree.
2. **Display reveals deeper violation** — the audit checks something other
   than what the tree-builder uses. The display surfaces direction errors
   the audit doesn't model.

Both likely co-exist. Fix is a **strict-direction validator**: every link
must traverse the LOCKED chain `req → task → usecase(s) → class → method →
implementation → test(s)` in the **forward direction only**. No back-refs
(T159 already), AND no wrong-hop forward refs (e.g. requirement → class
skipping task/usecase). Plus a remigration pass to strip wrong-direction
links + fill missing forward links.

## Intention

### Why this task exists
Tron's live view is ground truth. If `/trace` shows orphans + wrong-order
deps despite audit-clean, the audit is hiding the problem — and Tron R-F
("ZERO untraced") + the LOCKED chain (T168) are not actually held in the
data. T172 closes that gap.

### Problems this task solves
- Audit reports clean but live `/trace` shows orphans
- Wrong-order deps in the graph (links skipping canonical hops or going against direction)
- Audit doesn't model strict direction — only reachability
- Display-layer correctness not gated by data layer

### How it solves them
- Architect + req jointly diagnose audit-too-lenient vs display-reveals
- Strict-direction validator: walks every link, verifies it follows the
  LOCKED chain order, in the forward direction, hop-by-hop
- Remigration pass: strips wrong-direction links + fills missing forward
  links uncovered by the strict validator
- T169's audit updated to call the strict-direction validator

## Acceptance Criteria
- [ ] AC1 — JOINT architect + req-eng diagnosis document produced
  (`scrum.pmo/sprints/sprint-17-scenario-units/t172-direction-diagnosis.md`
  or similar) explaining the root cause of Tron's observation
- [ ] AC2 — Strict-direction validator implemented: walks every link in the
  scenario index; reports any link that doesn't traverse the LOCKED chain
  forward (req → task → usecase(s) → class → method → implementation →
  test(s)), hop-by-hop, no skips, no reverse
- [ ] AC3 — Remigration pass: strips wrong-direction links + fills missing
  forward links discovered by AC2's validator
- [ ] AC4 — T169 audit updated to call the strict-direction validator (or
  T172 adds a new audit step T169 invokes) — audit clean now means **strict
  direction enforced**, not just reachability
- [ ] AC5 — Live `/trace` shows: zero visible orphans, zero wrong-order
  deps (tester confirms on the running instance)
- [ ] AC6 — Tree builder rules (T165) consume only strict-direction links
- [ ] AC7 — No regression on T169 / T171 (their checks still pass; T169's
  baseline post-strict-direction is the new ground truth)
- [ ] AC8 — `npm run build` succeeds; all existing tests pass
- [ ] AC9 — **Rule-pair (a)+(b) [#15+#16]:** package.json bump + sw.js
  CACHE_NAME bump in the SAME commit-set; (c) STATIC_SHELL — architect
  confirms (likely exempt)
- [ ] AC10 — `scrum.pmo/standards/traceability-standard.md` updated to
  document the strict-direction rule
- [ ] AC11 — **Atomic-requirement-split rule (R-H.2, PO 2026-06-02, folded
  into T172):** `scrum.pmo/standards/` (traceability-standard or a new
  `standing-rules.md`) documents Tron's rule that **req-eng splits each
  Tron directive into ONE-SENTENCE atomic requirements**. Planner-first
  stand-ups going forward REQUIRE req's atomic split BEFORE refinement
  closes. T172 itself MUST demonstrate the rule: req-eng's anchor anchors
  R-H + R-H.2 (and any other atomic splits joint refinement uncovers) as
  individual one-sentence `requirement:uuid` entries — not a compound.
- [ ] AC12 — Existing compound requirements in S17 (R-A..R-G, R17.x) are
  catalogued for future atomic-split retroactive backfill (architect scopes
  whether T172 does this or it's a follow-on); atomic-split multiplies
  requirement roots, sharpening R-F (each atomic requirement is its own
  tree root)

## Test Scenarios
File: extend `test/vitest/trace-data-audit.test.ts` + new strict-direction unit tests + live `/trace` verification.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Run strict-direction validator on current index | Report baseline (architect's expected count of violations) |
| TS2 | Post-remigration: run validator | Zero strict-direction violations |
| TS3 | Live `/trace` visual sweep | Zero orphans, zero wrong-order deps |
| TS4 | Walk down from any requirement root | Every hop is canonical-order, forward; never skips a hop type |
| TS5 | Add a wrong-direction link by hand, run validator | Caught + reported with file + violation type |
| TS6 | Add a hop-skipping link (req → class) by hand | Caught (skip-violation) |
| TS7 (regression T169) | T169 audit + strict-direction together | Both clean |
| TS8 (regression T171) | T171's orphan-by-design allowlist + strict-direction | Compatible — strict direction respects allowlist |
| TS9 | Rule-pair post-bump | New CACHE_NAME activates |

## Dependencies
- **Requires:** T169 (audit foundation + tooling), T168 (LOCKED chain rule T172 enforces strictly), T171 (matrix + orphan-by-design pattern), T134 (TraceLink units)
- **Coordinate-with:** T170 (no-stop CI gates — strict-direction becomes a gate after T172); T165/T166 (tree consumers — verify direction-strict data renders correctly)
- **Enables:** trustworthy live `/trace` — display reflects audit truth and vice versa

## Drive Plan (planner-coordinated, CMM4 4-role; refinement JOINT per Tron)
1. **robbin-req + robbin-architect (JOINT)** anchor verbatim Tron R-H observation; diagnose audit-too-lenient vs display-reveals; produce diagnosis doc + design strict-direction validator + remigration pass; write Design section here.
2. **robbin-expert** implements per joint design; carries rule-pair (a)+(b).
3. **robbin-tester** runs TS1-TS9 + live `/trace` sweep; commits verification to QA Audit section.

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓
- [ ] Strict-direction validator: clean
- [ ] Live `/trace` clean (zero visible orphans, zero wrong-order deps)
- [ ] `traceability-standard.md` documents the strict-direction rule
- [ ] **Atomic-requirement-split rule (R-H.2) documented in standards (traceability or new standing-rules.md) — planner-first stand-ups require req atomic split before refinement closes**
- [ ] No regression on T169 / T171
- [ ] All 4 roles committed work (joint refinement satisfies the req + architect steps)
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-02: PO directed planner-first stand-up of T172 — Tron observation on live `/trace`: massive orphans + wrong-order deps despite T169/T171 reporting clean. JOINT architect + req-eng refinement (Tron-assigned). CMM4 4-role; real v4 uuids (learning #17); rule-pair (a)+(b) in AC9+DoD (learnings #15+#16). Awaiting joint refinement → expert impl → tester verify (live `/trace` clean) → Tron QA.
- 2026-06-02 (PO amendment): **atomic-requirement-split rule (R-H.2) FOLDED into T172.** Tron: req-eng splits each Tron directive into ONE-SENTENCE atomic requirements; planner-first stand-ups require req's atomic split BEFORE refinement closes. AC11 + AC12 added; DoD updated. T172 itself must demonstrate the rule (req anchors R-H + R-H.2 as separate one-sentence requirements). Atomic-split multiplies req roots, sharpens R-F (each atomic req is its own tree root). Standard/standing-rules file gains the rule.

## Subtasks
None at parent level (joint refinement may split T172.x per fix category).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 close-out (audit-strictness + live-/trace correctness)*
*Owners (CMM4): robbin-req + robbin-architect (JOINT) → robbin-expert → robbin-tester*
*Priority: 1 (Tron's live view shows the data is wrong despite audit clean — audit is hiding the problem; closes the trust gap)*
