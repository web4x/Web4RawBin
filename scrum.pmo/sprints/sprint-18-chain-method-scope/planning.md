[Back to README](../../../README.md) · [Sprints overview](../sprints.overview.md)

# Sprint 18 Planning — Chain method-scope & role skills

> 🔄 **GENERATED VIEW** — DO NOT HAND-EDIT.
> Source units: `scenario/index/5/b/9/5/0/5b950725-a6f6-4d45-b802-4784ee6ef962.scenario.json` (Sprint) + Task units linked below.
> This Sprint is the **dogfood** of the S17 scenario-unit model — Sprint + Task scenario.json units were authored FIRST; this .md is generated from them (T188). Edit the .json units; regenerate this view.

## Sprint metadata (from Sprint unit)

| Field | Value |
|------|------|
| Sprint IOR | `ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962` |
| Number | 18 |
| Name | Chain method-scope & role skills |
| Status | Planned |
| Compound source | [compound-requirement-source.md](./compound-requirement-source.md) (Tron verbatim 2026-06-05) |
| Joint owners | robbin-planner · robbin-architect · robbin-req |
| Created | 2026-06-05 |

## Sprint Goal
Narrow the traceability chain at the Class→Method hop to the ONE method that fulfills the current requirement (vs scenario browser which shows ALL methods); dogfood the S17 scenario-unit model by authoring Sprint 18 as scenario.json FIRST and generating the planning.md + task-*.md views from those units; co-specify role refinement protocols as SKILL.md files (durable, reboot-surviving) from the Rules 1-11 of [refinement-precedence-analysis.md](../../standards/refinement-precedence-analysis.md).

## Requirements (req-eng owns — to be committed as Requirement scenario.json units)

Decomposition hints (req-eng authoritative when committed; below are placeholders from compound source):

| Hint | Summary | req:uuid |
|------|--------|----------|
| R18.1 | Scenario browser = ALL methods of a Class; Traceability browser = ONLY the one method fulfilling the current requirement | (req-eng) |
| R18.2 | Chain narrows at Class→Method: UC → THE one Method → Impl → Test (not fan-out to every Class.method) | (req-eng) |
| R18.3 | Sprint 18 born as scenario.json units FIRST; planning.md + task-*.md GENERATED (dogfood R17.7-R17.10 view-gen) | (req-eng) |
| R18.4 | Three roles co-specify their refinement protocols as SKILL.md files from Rules 1-11 | (req-eng) |
| R18.5 | Tree expand APPENDS children only (no full re-render); scroll position preserved across click — Tron 2026-06-05 | (req-eng) |

> Per precedence Rule 1: requirements precede tasks. Task units below scaffold with empty `requirements[]` IOR slots that req-eng fills when atomic Requirement units commit.

## Tasks (planner-authored as Task scenario.json units)

- [ ] ⏳ **T187** — Trace-narrowing + R18.8 nav-root rework + `/api/trace/sprints` endpoint
  - Unit: `scenario/index/2/9/2/d/8/292d8931-efff-45ab-b66e-772fac16c6ea.scenario.json`
  - Hints: R18.1 + R18.2 + **R18.8 (PO-folded 2026-06-05 — C3 nav-root + C7 endpoint from architect contradiction review `d7d6404a`)**
  - Scope:
    - (a) Chain walker selects ONE method per UC (`UC.method` singular IOR) — not `Class.methods[]` fan-out (R18.1+R18.2)
    - (b) Browser tree builder produces Sprint→Task as NAVIGATION ROOTS per R18.8; chain walker still starts at atomic Requirements as CHAIN ROOTS — owns the reworked AC2 wording T168 carries as append-only note
    - (c) New endpoint `/api/trace/sprints` returns Sprint units (nav roots); `/api/trace/roots` stays returning Requirement chain-roots for backward compat — two endpoints, clear semantics (architect rec)
    - (d) Tree client switches root fetch from `/api/trace/roots` to `/api/trace/sprints`
  - Owners: req (anchor R18.1+R18.2+R18.8) → architect (UC.method singular + nav-root + endpoint design) → expert (impl; rule-pair (a)+(b); (c) likely EXEMPT — extends existing routes/bundles) → tester (verify both endpoints + browser nav root + chain narrowing in one pass)
  - Status: ⏳ planned (scaffolded; `coveredRequirements[]` pending req-eng atomic Req commits)

- [ ] ⏳ **T188** — Dogfood S17 view-gen: planning.md + task-*.md emitted from scenario.json Sprint+Task units (THIS task)
  - Unit: `scenario/index/8/a/3/1/b/8a31ba75-22b6-48ff-9532-d5da21458543.scenario.json`
  - Hints: R18.3 (req-eng fills `requirements[]`)
  - Owners: req → architect (ViewGenerator design per R17.7-R17.10) → expert (impl) → tester (verify generated view matches unit content)
  - Status: ⏳ planned — bootstrap iteration in progress (Sprint+Task units authored; this view is the first hand-generated proof until ViewGenerator runnable)

- [ ] ⏳ **T189** — Role skills — co-specify planner/architect/req-eng SKILL.md from precedence-analysis Rules 1-11
  - Unit: `scenario/index/a/7/f/7/f/a7f7f216-8389-475c-96b7-3593b185cb01.scenario.json`
  - Hints: R18.4
  - Owners: req → architect (architect SKILL.md from Rules 1-5) → planner (planner SKILL.md from Rules 6-8 — **PARTIAL: extended `.claude/agents/robbin-planner/SKILL.md` 2026-06-05**) → req-eng (req-eng SKILL.md from Rules 9-11) → tester (verify SKILL.md files survive reboot + cover all rules)
  - Status: ⏳ planned — planner's SKILL.md extension landed in this commit; architect + req-eng SKILL.md sections pending

- [ ] ⏳ **T190** — Tree lazy-render + scroll-preservation — expand APPENDS children only (no full re-render)
  - Unit: `scenario/index/0/8/e/4/6/08e46ce3-69f3-40fe-87d7-5ee875a4e94a.scenario.json`
  - Hints: R18.5 (req-eng to formalize); follows T186 R-Y1+R-Y2 (closed in-scope for lazy-LOAD; T190 owns lazy-RENDER + scroll-preservation atom — distinct per Rule 8 closure freeze)
  - Owners: req (anchor R18.5 Tron quote) → architect (DOM-diff approach if non-trivial) → **robbin-expert (impl; rule-pair (a)+(b)) — PO-directed owner** → **robbin-tester (verify scroll preserved + tree appends children only) — PO-directed owner**
  - Status: ⏳ planned — Tron 2026-06-05 via PO: "tree re-renders FULLY on each click ... JUMPS BACK TO TOP — cumbersome. Fix: expand APPENDS child itemview levels only (no full re-render), preserve scroll position."

## Definition of Done
- [ ] R18.1+R18.2: `/trace` Class node renders ONE method per current UC (narrowed); `/scenario` Class node renders ALL methods (full); same data, two traversal verbs.
- [ ] R18.3: planning.md + task-187.md + task-188.md + task-189.md are GENERATED by ViewGenerator from the scenario units (this hand-generated view replaced once ViewGenerator handles Sprint+Task views).
- [ ] R18.4: 3 SKILL.md files exist under `.claude/agents/<role>/` covering all 11 rules; each role's SKILL.md survives reboot test.
- [ ] T183 7-hop CI gate continues to PASS (44/44) — narrowing must not break reachability.
- [ ] No regression on /trace + /scenario routes; rule-pair (a)+(b) per task.

## Dependency Graph
```
R18.1+R18.2 → T187 (narrowing)
R18.3 → T188 (dogfood view-gen — bootstrap iteration)
R18.4 → T189 (role SKILL.md trio)
(no cross-task scheduling dependency; three parallel tracks)
```

---

**Generated from:** Sprint unit `5b950725-a6f6-4d45-b802-4784ee6ef962`
**Generated by:** planner hand-iteration 2026-06-05 (ViewGenerator runnable target = T188 completion)
**Joint authors:** robbin-planner (this view + T187/T188/T189 Task units) · robbin-architect (refinement, UC.method narrowing design) · robbin-req (4 Requirement units when committed)
**Anchor:** [scrum.pmo/standards/refinement-precedence-analysis.md](../../standards/refinement-precedence-analysis.md) (11 rules — chain-vs-dependency framing)
