# Strict-Champagne Defect Catalog: 21 Unreachable Tests

[task:uuid:abc78991-a98b-4221-8ab6-d2b8fa280502]

**Author:** robbin-architect (2026-06-07)
**Source:** `npx tsx scripts/trace-audit.ts --strict` → 23/44 reachable, 21 FAIL

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — root-cause analysis 2026-06-07)
  - [ ] creating test cases
  - [ ] implementing (expert — quick fix or proper fix per architect's recommendation)
  - [ ] testing (tester — re-run strict audit, expect 44/44 reachable)
- [ ] QA Review
- [ ] Done

> QA Review + Done = TRON's gate.

## Traceability
- up
  - [Sprint 18 Planning](./planning.md)
  - Champagne metric directive (R-G/R-J test-reachability follow-on; S17 R-batch)
- related
  - T111 (S16 Specialized DetailViews — the funnel-point Task with no Requirement parent)
  - impl-bridge units created by expert for shared-class fan-out (the root-cause structural issue)
- down
  - None (atomic defect-catalog task — fix is a single Requirement-link or impl-bridge cleanup)

---

## Single Root Cause: ALL 21 funnel through T111→Sprint 16 (no Requirement)

Every unreachable test reverse-walks the SAME path:

```
Test → impl-bridge → RbTaskDetail.render → RbTaskDetail → UC taskDetail.render → Task T111 → Sprint 16 → DEAD END
```

**Break point:** Task T111 (Specialized DetailViews) has NO Requirement parent. It's in Sprint 16 but no Requirement's `tasks[]` includes T111.

**Why they ALL hit this:** The impl-bridge units (created by expert for shared-class fan-out) link every test to `RbTaskDetail.render` as a common ancestor. The reverse-walk finds this path FIRST and follows it to Sprint 16 (dead end) instead of finding the test's REAL requirement path.

## The Fix (ONE action closes all 21)

**Link T111 to a Requirement.** T111 implements the S16 DetailViews feature. Find/create the requirement and add T111 to its `tasks[]`.

OR: the impl-bridge units are the problem — they create a SHARED path through RbTaskDetail that overrides each test's REAL chain. The reverse-walk BFS finds the RbTaskDetail path before the test's own requirement path because impl-bridges have more connections.

**Better fix:** Remove/fix the impl-bridge→RbTaskDetail.render links. Each test should chain through its OWN task's UC→Class→Method→Impl, not through a shared impl-bridge that funnels everything to RbTaskDetail.

## The 21 Tests (grouped by actual sprint)

### S02 (2): T7 user profile, T9+T10 SSH device key tests
### S03 (7): T13 × 5 variants + T20 room chat parity
### S05 (2): T31+T32+T33 PWA caching, T36 offline persistence
### S06 (1): T39-T41 web components
### S07 (2): T47 file encryption, T48+T49 avatar storage
### S08 (2): T63 editor entry, T73 editor E2E
### S09 (3): T74 room identity SSH, T78 lobby badges, T79 room identity E2E
### S17 (1): T176 R-O module exec proof
### Other (1): vCard photo fix

## Expert Action

1. **QUICK FIX:** Add T111 UUID to a Requirement.tasks[] (e.g., R16.2 or create R16.5 for DetailViews) → all 21 become reachable because T111 gains a Requirement parent
2. **PROPER FIX:** Audit impl-bridge units — they shouldn't ALL chain through RbTaskDetail.render. Each test's impl-bridge should chain through its OWN feature's class/method, not a shared DetailView renderer

---

**Filed by:** robbin-architect · **Blocks:** 44/44 strict audit

## Subtasks
None (atomic — single coordinated fix: either T111 Requirement-link OR impl-bridge restructuring per architect's recommendation).

## QA Audit & User Feedback
- 2026-06-07: Architect filed defect catalog — all 21 strict-audit-unreachable tests funnel through T111→Sprint 16 (no Requirement). Two fix paths offered (quick: Requirement.tasks[] entry for T111; proper: impl-bridge restructuring).
- Pending: expert chooses quick vs proper fix → implements → tester re-runs `trace-audit.ts --strict`, expects 44/44.
