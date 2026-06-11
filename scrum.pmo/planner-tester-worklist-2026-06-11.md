# Planner → Tester Worklist (de-risked) — path 39→80 (2026-06-11)

**Scoreboard:** 39/159 det 3×. shared-IMPL = 0 (structural). **shared-TEST is NOT yet 0** — this worklist prevents re-introducing it.

The "71 tester-only one-step" headline is misleading. Real breakdown:

## ✅ CLEAN — marker now, flips immediately (4 chains)
Unique Test unit, `.test.ts` sourceFile. Add the EXACT-full-uuid marker (copy verbatim, learning #46):
- (run `objectVerb.ts Chain followUp --all | grep "open tester"` for the 4 with a single resolvable unique uuid; planner hands these per-batch)

## ⛔ SHARED-TEST TRAP — do NOT marker as-is (6 tests → 21 chains) [RE-INFLATION RISK]
Each of these tests is wired to MULTIPLE distinct requirements. Markering one shared test would false-complete all of them off one test — the SAME miscrediting pattern just eliminated for impls. **Fix: split into per-requirement dedicated Test units (like the impl 60-split), each with its own `[test:uuid:]` in `.test.ts`. Then marker each.**
| shared test | reqs (count) | file |
|-------------|--------------|------|
| 2c502c22 | R15.5, R16.6, R16.7, R16.8, R16.9 (5) | components.test.ts |
| e11c89d0 | R19.46, R19.47, R19.48, R19.49, R19.51 (5) | (.test.ts) |
| 9aec7689 | R17.3, R17.17, R19.61 (3) | (.test.ts) |
| 8682fa95 | R19.42, R19.43, R19.44 (3) | (.test.ts) |
| 440892b6 | R10.2, R10.3, R10.4 (3) | **rb-object-item.ts = WRONG (a .ts SOURCE file, not .test.ts)** — fix sourceFile too |
| f301f0b9 | R-V1, R15.6 (2) | server.test.ts |

## 🆕 NO TEST UNIT — create per-req dedicated test + marker (45 chains)
Tester creates a per-requirement Test scenario unit (real v4 uuid) + writes its `[test:uuid:<full>]` in the appropriate `.test.ts`, then wires Impl.tests[].

## Honest lever to 80
The path is NOT "marker 71 tests" → it's **4 clean markers + split 6 shared into ~21 dedicated tests + create 45 new tests = ~70 dedicated per-req tests**. That keeps shared-test → 0 (no re-inflation) and drives the count to ~110 cleanly. Markering the 6 shared as-is would show a fake jump that de-inflation later reverses (the 25→8 lesson).

**Planner provides:** exact full-uuids per batch for the CLEAN + split tests (mismatch-proof). **Do NOT** marker a test wired to >1 requirement — flag it back to planner for the split first.
