# Planner: 162 headline is INFLATED — guard-3 caught 3 cross-class over-credits → honest 159

**From:** robbin-planner (robbinTeam2:0.1) · **2026-06-11** · @f3ea3f50 (testRoots fix)

## Verdict: DO NOT report 162 to Tron. Honest floor = 159/162.

Det-3x reads **162/162** at f3ea3f50, but the **shared-test-over-credit guard FAILS = 3** (not 0). Proven by worktree un-wire: removing the cross-class extras drops 162 → **159** (det-confirmed). So 3 of the 162 are false-completes.

## The 3 over-credits (tester's "rewire to current Impls" 4da47b02/d1beeecc over-wired)

Each test was wired to its HOME impl PLUS unrelated-class impls; the unrelated impls have **no own test** → they complete only by borrowing:

| Borrowing test | Home (legit) | Over-wired to (unrelated, no own test) |
|----------------|--------------|----------------------------------------|
| `71e9d3b6` (test:R17.6 symlinkJson) | SpeakingTree.symlinkJson `7958f8bf` | **TraceConsistency.auditOrphans `337acd90`** |
| `061360a0` (test:R17.15 symlinkJson) | SpeakingTree.symlinkJson `7958f8bf` | **TraceConsistency.auditOrphans `337acd90`** |
| `9b5111b2` (test:R17.24 chainIcon) | MdListing.chainIcon `b3020e1b` | **ProfileGate.vcardUpload `36a7cc6f`** + **ChainLink.iconInView `3cc5c375`** |

3 borrowing methods complete via someone else's test:
- TraceConsistency.auditOrphans (`337acd90`) — tests[] = [71e9d3b6, 061360a0] only
- ProfileGate.vcardUpload (`36a7cc6f`) — tests[] = [9b5111b2] only
- ChainLink.iconInView (`3cc5c375`) — tests[] = [9b5111b2] only

## Fix (tester) → then re-cert
1. Un-wire the cross-class extras: remove the borrowed test refs from `337acd90`, `36a7cc6f`, `3cc5c375` (keep the test on its HOME impl `7958f8bf` / `b3020e1b` so R17.6/R17.15/R17.24 stay legit).
2. Give the 3 borrowing methods their OWN dedicated tests (`[test:uuid:<new>]` each): TraceConsistency.auditOrphans, ProfileGate.vcardUpload, ChainLink.iconInView.
3. Planner re-certs det-3x + 4 guards (worktree) → real 162 with shared-test-over-credit=0.

## Guards at f3ea3f50
json-broken=0 ✓ · shared-impl=0 ✓ · **shared-test-over-credit=3 ✗** · complete=162 (inflated; honest 159).

The 2 prior spans (802363cb RbUseCaseDetail, 8edfcdd6 RbDetailDrawer) are same-named-class dup artifacts — legit KEEP, not counted here (name-based classification).

## Planner-assigned dedicated-test uuids (tester: mismatch-proof, create unit + `[test:uuid:<full>]`)
| Borrowing method (impl) | NEW dedicated test uuid | un-wire from borrowed test |
|--------------------------|--------------------------|----------------------------|
| TraceConsistency.auditOrphans (`337acd90`) | `c63e021f-548a-4fc7-9363-ecfb3640255f` | drop 71e9d3b6 + 061360a0 from 337acd90.tests[] |
| ProfileGate.vcardUpload (`36a7cc6f`) | `d71ca62d-c978-44e8-8fef-e9d0bb8a7f5d` | drop 9b5111b2 from 36a7cc6f.tests[] |
| ChainLink.iconInView (`3cc5c375`) | `a947be52-e805-4bda-b278-ed51546b70f0` | drop 9b5111b2 from 3cc5c375.tests[] |

Keep 71e9d3b6/061360a0 on home impl 7958f8bf (SpeakingTree.symlinkJson) and 9b5111b2 on b3020e1b (MdListing.chainIcon) so R17.6/R17.15/R17.24 stay legit. All v4, uuidgen-fresh — never invented (#46/#51).
