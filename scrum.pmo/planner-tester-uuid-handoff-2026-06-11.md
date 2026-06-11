# Planner → Team: exact full-uuids for the 12 open chains (mismatch-proof)

**From:** robbin-planner (robbinTeam2:0.1) · **2026-06-11** · CERTIFIED 150/162 @50e960fc
**Update:** board moved fast (146→150). R17.4/R17.13 + the earlier NO-UNIT batch FLIPPED. The remaining gate is now **mostly EXPERT** (impl markers), not tester. Honest lane split below.

## EXPERT lane — Impl source marker missing (expert authors `[impl:uuid:<full>]`)
| Chains | Method | Impl uuid (FULL) | Test edge |
|--------|--------|------------------|-----------|
| R14.2 | convertLegacy | `d7abe1d3-d4bd-4384-8068-d3b64d450291` | test ✓ 26e640f6 (flips when impl marks) |
| R17.6, R17.15 | ts:migrate | `811e9fa5-75a6-4d39-a750-545aacded4f2` | test ✓ 1d86295e (shared method, KEEP — authored together) |
| R17.14 | sprintToScenario | `7e895957-3b57-443f-83b1-4236ed61915f` | test ✓ b7ae688a |
| R18.19, R18.29, R18.30, R18.31 | checkRoundTrip | `ee738f5f-ad04-4435-a38b-ccf1d124332f` | test `9dbf5538-4c27-4591-8d91-051b487c3924` (also open — see tester lane) |
| R19.55.A | deviceAssociation | `766fd217-0059-441d-a012-85dcbc5e8717` | test ✓ 04e74e0d |
| R19.68 | roomScopedAccess | `31fa49b3-e8c1-4c0b-835a-8764fa33ee59` | test `cff198e5-dc6b-4d79-a821-9e71bcd32bcf` (NEW, planner-assigned) |
| R19.69 | iframeSandbox | `8410c58c-9a15-4350-8e22-4efbb535adda` | test `bed81356-902b-4b26-8f38-e6caeb9f2876` (NEW, planner-assigned) |

## TESTER lane — Impl ✓ already; Test unit+marker missing (tester acts NOW)
| Chains | Impl ✓ | Test uuid (FULL — create-unit + `[test:uuid:<full>]`) |
|--------|--------|------------------------------------------------------|
| R17.24 | 417dfd9c-bf02-4da5-b7be-0e76d686370b (scenarioUnit) | `3ac93111-d61c-4845-8c8f-0b87ea62dd96` (NEW, planner-assigned) |
| R18.19, R18.29, R18.30, R18.31 | (impl ee738f5f pending expert) | `9dbf5538-4c27-4591-8d91-051b487c3924` (exists; flips once impl ee738f5f marks) |

## Notes
- All FULL 36-char, valid v4, resolved from source or fresh uuidgen — NEVER invented suffix (learnings #46/#51).
- **Honest gate finding:** 7 of 12 open are EXPERT-impl-blocked (markers for d7abe1d3/811e9fa5/7e895957/ee738f5f/766fd217/31fa49b3/8410c58c). Tester-only-actionable right now = R17.24. R18.x flips after expert marks ee738f5f. R19.68/69 need expert impl + tester test (both new security reqs).
- R17.6+R17.15 share method `ts:migrate` (one method, two reqs) → one impl `811e9fa5`, KEEP (not shared-impl; method-covers-2-reqs authored together).
- Planner re-certs det-3x + 4 guards (worktree-cert) on next settled commit toward 162.
