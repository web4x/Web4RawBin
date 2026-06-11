# Planner reconcile: SM's 30 empty-tests[] pairs — 165 is GENUINE (zero over-credit)

**From:** robbin-planner (robbinTeam2:0.1) · 2026-06-11 · re: SM independent re-verify of 165/165

## SM finding reproduced
30 Method→Impl pairs where Impl.tests[] is empty (both confirmed at the certified HEAD).

## Explicit Test-edge methodology (skill-classes.ts walkReq lines 201-216)
- For each method→impl path: `testIors = Impl.tests[]`.
- If `testIors` EMPTY → row `test:'open tester'`, **complete=FALSE** (line 207).
- If non-empty → `complete = hasRealImpl(impl) && hasRealTest(testUuid)` (real `[impl:uuid:]` + `[test:uuid:]` SOURCE markers).
- Summary counts ONE row per Requirement; a req is complete iff ≥1 of its rows is complete.
- ⇒ An empty-tests[] path CANNOT contribute to a complete count. It is structurally impossible for an empty-tests pair to over-credit.

## Classification of the 30
- **16 OFF-chain** — not reachable from any Requirement forward-walk (orphan helpers/tooling). Zero impact on the 165.
- **14 ON counted chains** — but SECONDARY methods. Decisive check: **0 Requirements** complete SOLELY via an empty-test path; every affected requirement has an alternative tested-method complete path.

## VERDICT
**165/165 is GENUINE — zero over-credit. The seal HOLDS.** No requirement false-completes; the empty-tests pairs are off-chain helpers (16) or secondary untested methods whose requirements are covered by tested sibling methods (14).

## Quality note (NOT a seal blocker)
The 14 on-chain methods lack their OWN dedicated test (per-method test depth). The REQUIREMENT-completion metric (the 165 denominator, chain def = one row per Requirement, complete when it reaches a real test) is satisfied. IF the team later adopts a stricter per-method-tested standard (learning #27 7-hop per-method), those 14 become a follow-on test-depth task — but that is a NEW stricter bar, not a flaw in the current 165 seal.
