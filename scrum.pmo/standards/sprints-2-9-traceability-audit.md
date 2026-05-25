# Traceability Audit: Sprints 2–9

**Auditor:** robbin-req
**Date:** 2026-05-25
**Standard:** [Traceability Standard](./traceability-standard.md)
**Companion:** [Sprint 1 Audit](./sprint-1-traceability-audit.md)
**Scope:** 75 task files across 8 sprints

## Summary Table

| Sprint | Tasks | req.md | UUIDs | Trace | Backlinks | Req refs | Chain | Diagrams | PUML UUIDs |
|--------|-------|--------|-------|-------|-----------|----------|-------|----------|------------|
| S1 Foundation | 11 | NO | 11/11 | 11/11 | 9/11 | 0/11 | 0/11 | 0 | — |
| S2 Identity/SSH | 7 | NO | 7/7 | 7/7 | 7/7 | 0/7 | 0/7 | 4 puml, 4 svg | 0 |
| S3 E2E Hardening | 10 | NO | 10/10 | 10/10 | 10/10 | 0/10 | 0/10 | 0 | — |
| S4 Traceability | 8 | NO | 8/8 | 8/8 | 8/8 | 0/8 | 0/8 | 0 | — |
| S5 PWA/Offline | 8 | NO | 8/8 | 8/8 | 8/8 | 0/8 | 0/8 | 0 | — |
| S6 Web Components | 8 | NO | 8/8 | 8/8 | 8/8 | 0/8 | 0/8 | 0 | — |
| S7 Encrypted Storage | 13 | NO | 13/13 | 13/13 | 13/13 | 0/13 | 0/13 | 2 puml, 2 svg | 0 |
| S8 Monaco Editor | 14 | YES | 14/14 | 14/14 | 14/14 | 0/14 | 0/14 | 3 puml, 3 svg | 0 |
| S9 Room Identity | 7 | YES | 7/7 | 7/7 | 7/7 | 0/7 | 0/7 | 2 puml, 2 svg | 0 |
| **TOTAL** | **86** | **2/9** | **86/86** | **86/86** | **84/86** | **0/86** | **0/86** | **11 puml** | **0** |

## What Passes Across All Sprints

- **Task UUIDs:** 100% (86/86). Every task file has a `[task:uuid:]` tag.
- **Traceability sections:** 100% (86/86). Every file has `## Traceability` with up/down links.
- **Backlinks:** 98% (84/86). Only Sprint 1 has 2 missing.

## What Fails Across All Sprints

### GAP-A: requirements.md — 7 of 9 sprints missing (CRITICAL)

Only Sprint 8 and Sprint 9 have `requirements.md` files (written by robbin-req). Sprints 1–7 have none. Requirements are embedded informally in task descriptions but not formalized with UUID tags.

| Sprint | Has requirements.md | Has requirement UUIDs |
|--------|--------------------|-----------------------|
| S1 | No | — |
| S2 | No | — |
| S3 | No | — |
| S4 | No | — |
| S5 | No | — |
| S6 | No | — |
| S7 | No | — |
| S8 | Yes | **No** (file exists but no `[requirement:uuid:]` tags) |
| S9 | Yes | **No** (file exists but no `[requirement:uuid:]` tags) |

Even Sprint 8 and 9, which have requirements.md, lack UUID tags — the requirements are written as use cases (UC-API.1, UC-RM.1, etc.) but without `[requirement:uuid:]` anchors that tasks can link back to.

### GAP-B: Requirement back-references — 0/86 tasks (CRITICAL)

No task file in any sprint contains a `[requirement:uuid:]` reference in its Traceability section. The upward link from task to requirement is completely absent.

### GAP-C: Forward chain — 0/86 tasks

No task file has the full chain section (requirement → use case → PlantUML element → class/method). This is expected for Sprints 1-7 (predates the standard) but also missing from Sprint 8-9 (where requirements.md exists).

### GAP-D: PlantUML UUID annotations — 0/11 diagrams

11 PlantUML files exist across 4 sprints, but none carry `[uc:uuid:]` or `[class:uuid:]` annotations on their elements. Use cases are named (UC-RM.1, UC-API.1, etc.) but not UUID-tagged for machine traceability.

| Sprint | Diagrams |
|--------|----------|
| S2 | use-case.puml, class-diagram.puml, sequence-enrollment.puml, sequence-auth.puml |
| S7 | avatar-lifecycle.puml, avatar-crop-lifecycle.puml |
| S8 | use-cases.puml, class-diagram.puml, sequence-edit.puml |
| S9 | use-cases.puml, class-diagram.puml |

## Per-Sprint Notes

### Sprint 2 — Identity & SSH
- 7 tasks (T7–T12 + T7.0), all well-structured
- 4 diagrams created by architect — highest diagram density
- No requirements.md despite being the "canonical format" sprint

### Sprint 3 — E2E Hardening
- 10 tasks (T13–T22), all pass structural checks
- No diagrams (testing/UX sprint, diagrams not applicable)

### Sprint 4 — Traceability
- 8 tasks (T23–T30), includes the template standardization work (T26)
- Ironic: the traceability sprint itself lacks traceability to requirements

### Sprint 5 — PWA & Offline
- 8 tasks (T31–T38), all pass
- No diagrams despite architectural work (reconnect, SW caching)

### Sprint 6 — Web Components
- 8 tasks (T39–T46), all pass
- Sprint planning has architecture audit but no formal requirements.md
- No diagrams despite architecture audit being done inline in planning.md

### Sprint 7 — Encrypted Storage
- 13 tasks (T47–T59), highest task count
- 2 diagrams (avatar lifecycle, avatar crop lifecycle)
- Sprint planning contains crypto design but no formal requirements.md

### Sprint 8 — Monaco Editor
- 14 tasks, highest task count
- requirements.md EXISTS (written by robbin-req) with 20 use cases — but no `[requirement:uuid:]` tags
- 3 diagrams (use-cases, class-diagram, sequence-edit)
- Tasks don't link back to requirements despite both existing

### Sprint 9 — Room Identity
- 7 tasks + requirements.md (written by robbin-req) with 6 use cases
- 2 diagrams (use-cases, class-diagram)
- Same gap as Sprint 8: requirements exist but no UUID anchors, no task back-refs

## Remediation Plan for Sprint 11

### Tier 1 — MUST (establishes the chain)

| Action | Files | Effort |
|--------|-------|--------|
| Create requirements.md for Sprints 1-7 | 7 new files | 3h |
| Add `[requirement:uuid:]` to Sprint 8-9 requirements.md | 2 files | 30min |
| Add requirement back-refs to all 86 task files | 86 files | 3h (scriptable) |

### Tier 2 — SHOULD (enriches the chain)

| Action | Files | Effort |
|--------|-------|--------|
| Add forward chain section to task files | 86 files | 2h (scriptable) |
| Add `[uc:uuid:]` annotations to 11 PUML files | 11 files | 1h |
| Fix 2 missing backlinks (Sprint 1) | 2 files | 5min |

### Tier 3 — COULD (future incremental)

| Action | Files | Effort |
|--------|-------|--------|
| Add `[impl:uuid:]` to source code | ongoing | incremental |
| Add `[test:uuid:]` to test files | ongoing | incremental |

### Estimated total: ~9.5h for Tier 1+2

Much of Tier 1 and 2 is scriptable — a batch tool can:
1. Generate requirements.md from task descriptions
2. Insert `[requirement:uuid:]` back-refs into task Traceability sections
3. Add chain sections with links to requirements.md

## Conclusion

RawBin's structural foundation is solid — 100% UUID and Traceability coverage. The gap is the **content** of those sections: they link to planning.md but not to formalized requirements. Sprint 8-9 introduced requirements.md (by robbin-req) but didn't close the loop by adding UUID anchors and task back-references. The remediation is mostly mechanical and largely scriptable.
