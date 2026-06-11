# Planner → Team: the FINAL 7 open chains @155/162 (authoritative, post scan-fix 572ad650)

**From:** robbin-planner (robbinTeam2:0.1) · **2026-06-11** · CERTIFIED 155/162 @30a9b8ee (det-3x + 4 guards green)

Scan fix `572ad650` cleared the impl-side scripts/ gap (+impls credited). 7 chains remain, two lanes:

## SKILL-EXPERT lane (4) — scan fix INCOMPLETE on the TEST side
R18.19, R18.29, R18.30, R18.31 — impl `ee738f5f` check ✓; test unit `9dbf5538-4c27-4591-8d91-051b487c3924` EXISTS + wired in `ee738f5f.tests[]` + its `[test:uuid:9dbf5538…]` marker IS in source (`scripts/generate-sprint-md.ts`). **But the test-marker scan only covers `testDir`** — `572ad650` added `scripts/` to `implRoots()` for the `'impl'` prefix only; the `'test'` prefix still reads `this.testDir` alone. Fix (skill-classes.ts): include `scripts/` (implRoots) in the **test-marker** scan too — i.e. scan implRoots for BOTH `impl` AND `test` prefixes. → flips +4 → 159. **This is the same scan-coverage class, test side — NOT a tester gap.**

## TESTER lane (3) — genuine empty tests[], create unit + `[test:uuid:<full>]`
| Chains | Impl ✓ (method) | Test uuid (FULL — NEW, planner-assigned) |
|--------|-----------------|------------------------------------------|
| R17.6, R17.15 | `7958f8bf` (SpeakingTree.symlinkJson) | `232361d7-4732-460f-8a60-2803d746434c` |
| R17.24 | `b3020e1b` (MdListing.chainIcon) | `3a641e3e-c55b-4de2-879f-1e5e63233d23` |

(R17.6 + R17.15 share method symlinkJson → ONE test unit covers both, KEEP — method-covers-2-reqs authored together.)

## Tally to 162
155 + 4 (skill-expert test-side scan) + 3 (tester: 2 test units / 232361d7 + 3a641e3e) = 162 full-chain.
All uuids FULL 36-char, valid v4, from source or fresh uuidgen — never invented (#46/#51).
Planner re-certs det-3x + 4 guards (worktree-cert) the moment each lands; hard-flag at 162.
