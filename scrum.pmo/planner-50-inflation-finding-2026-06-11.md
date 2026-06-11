# Planner: the claimed 50/159 is INFLATED — req-level shared-test over-credit (2026-06-11)

**For:** SM (holding the +14) + PO (about to credit 50). **Answer to SM's decisive Q: YES — 50 complete chains DO ride the over-credit tests.**

**Cause:** tester e9cc0579 **MARKERED the over-credit shared tests** (2c502c22, e11c89d0, 9aec7689, ...) that the worklist/classification said to **SPLIT** per-req. Markering a shared test completes ALL its reqs off ONE test = the same miscrediting just eliminated for impls. shared-IMPL=0 doesn't catch this (it's shared-TEST at the REQUIREMENT level — same-class or cross, multiple reqs/one test).

## Complete chains on multi-req tests (34 of 50) — CLASSIFY
### ⛔ OVER-CREDIT (1 legit owner, rest FALSE → SPLIT):
| test | reqs (complete) | false | why |
|------|-----------------|-------|-----|
| 2c502c22 (SM: fanned to 13 impls!) | R15.5, R16.7, R16.8, R16.9 | 3 | R15 vs R16 unrelated |
| 9aec7689 | R17.3, R17.17, R19.61 | 2 | class-instances vs task-FSM vs templates, unrelated |
| 9b9c8ae6 | R19.3, R19.4, R19.53, R19.59 | 3 | visibility vs default-flip, mixed |
| bbd2439f | FLAG, R19.45 | 1 | unrelated |
| e11c89d0 (SM-flagged, 5 impls) | R19.47, R19.48, R19.49, R19.51 | up to 3 | SM authorship call (file-versioning siblings? if unrelated → split) |

### ✅ LEGIT dual-cover (KEEP — authored-together pairs/siblings):
- 5b79cc8e R19.2/2.A (refinement pair) · 2420ff7d R19.5/6 (apply-join pair)
- 1e763397 R19.36/37 + dd85c4d7 R19.38/40 (SM-confirmed)
- da3d0186 R19.7/8/9 · c6dfbaa6 R19.18/8.A/8.B (lifecycle/persistent siblings) — SM confirm
- 8682fa95 R19.42/43/44 (feedback-cycle siblings) — SM confirm

## Honest floor
- Clearly-over-credit excess (2c502c22:3 + 9aec7689:2 + 9b9c8ae6:3 + bbd2439f:1) = **9 false-completes** → honest ≈ **41**.
- If SM judges e11c89d0 + borderline siblings over-credit too: down to ~38.
- **HOLD 50. Honest floor 38-41 pending SM authorship + the splits.**

## Fix
The 5 over-credit tests must be SPLIT into per-req dedicated Test units (tester) — NOT markered as shared. The legit dual-cover pairs stay. Planner re-scores post-split for the clean number. SM's hold instinct is correct: big jump + unresolved over-credit = the 38→36 vector repeating at the test level.

**Recommend: tester reverts the shared-test markers on the 5 over-credit tests + creates per-req dedicated tests; planner feeds the exact full-uuids for the dedicated ones only.**
