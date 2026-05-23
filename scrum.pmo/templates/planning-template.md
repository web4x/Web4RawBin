# Sprint <N> Planning — <Sprint Name>

## Sprint Goal
One sentence: what this sprint delivers and why.

## Sprint Overview
**Duration:** <YYYY-MM-DD> – <YYYY-MM-DD or ongoing>
**Focus:** <2-3 word focus areas>
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directives via iphone:0.0
**Prerequisite:** <external dependency if any, or omit>

## Task List

_Tasks listed in dependency order. Use checkboxes for completion tracking._
_Each entry: checkbox, link, one-line status summary._

- [ ] [T<N>: <Name>](./task-<N>-<slug>.md)
  **Status:** PLANNED — <one-line scope summary>

- [ ] [T<N+1>: <Name>](./task-<N+1>-<slug>.md)
  **Status:** PLANNED — <one-line scope summary>
  **Depends on:** T<N>

## Dependency Graph

_ASCII or text representation of task dependencies._

```
T<A> ──→ T<B> ──→ T<C>
  └──→ T<D> [parallel]
```

## Architecture Diagrams

_Optional. Added by architect when diagrams are produced._

| Diagram | Source | Description |
|---------|--------|-------------|
| [Name](./diagrams/name.svg) | [name.puml](./diagrams/name.puml) | One-line description |

## Sprint Totals

| Metric | Value |
|--------|-------|
| Tasks | <count> |
| Expert effort | ~<N>h |
| Tester effort | ~<N>h |
| New files | <count> |
| New lines (est.) | ~<N> |

## Definition of Done

- [ ] All task acceptance criteria met
- [ ] `npm run build` succeeds
- [ ] All vitest tests pass
- [ ] No regression in prior sprint functionality

## Sprint Metrics

_Filled at sprint completion._

- Tasks completed: <done>/<total>
- Sprint completed: <YYYY-MM-DD>
- Actual effort: <N>h expert + <N>h tester

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** <YYYY-MM-DD>
**Sprint:** Sprint <N> — <Sprint Name>

---

## Template Section Reference

| Section | Required | Notes |
|---------|----------|-------|
| Sprint Goal | Yes | One sentence, actionable |
| Sprint Overview | Yes | Duration, focus, team, inputs |
| Task List | Yes | Checkbox + link + status per task |
| Dependency Graph | Yes | ASCII art showing task order |
| Architecture Diagrams | No | Only if architect produced diagrams |
| Sprint Totals | Yes | Estimated at creation, actual at completion |
| Definition of Done | Yes | Sprint-level acceptance (not per-task) |
| Sprint Metrics | No | Filled at sprint completion |
| Footer | Yes | PO, Tron, created date, sprint name |
