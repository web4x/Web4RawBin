<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->


[Back to Planning](./planning.md)

# Trace-narrowing: chain walker selects ONE method per UC, not Class.methods[] fan-out

[task:uuid:292d8931-efff-45ab-b66e-772fac16c6ea]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] Done

## Task Description

When the traceability chain passes through a Class node, narrow to the SINGLE method that fulfills the current requirement (the chain walks UC → THE one Method → Impl → Test). The scenario browser MUST keep showing all Class.methods[] (full object model). Add UseCase.method (singular IOR) as the authoritative narrowing edge. Two traversal verbs: 'trace' (uses UC.method, narrows) vs 'browse' (uses Class.methods[], full). Forward-only preserved per Rule 9 — no back-refs introduced. SCOPE EXTENSION 2026-06-05 (C3+C7 from architect review d7d6404a, PO-directed): T187 formally owns the R18.8 navigation-root rework that T168 AC2 originally wrote in chain-root terms. (a) Browser tree builder produces Sprint→Task as NAVIGATION ROOTS (per R18.8); chain walker still starts at atomic Requirements as CHAIN ROOTS. (b) New endpoint /api/trace/sprints returns Sprint units (navigation roots); /api/trace/roots stays returning Requirement chain-roots for backward compat — two endpoints, clear semantics (architect rec in r18-8-contradiction-review.md C7). (c) Tree client switches root fetch from /api/trace/roots to /api/trace/sprints; existing chain-root API consumers unaffected.
