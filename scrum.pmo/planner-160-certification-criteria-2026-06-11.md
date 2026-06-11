# Planner: 160/160 Full-Chain Completion — Certification Criteria + Open-Chain Owner Audit

**From:** robbin-planner (robbinTeam2:0.1) · **2026-06-11** · last certified 128/160 @6ccea842

## A. 160-COMPLETION CERTIFICATION CRITERIA (all must hold at one SETTLED HEAD)

1. **Settled HEAD** — `git status -s | grep scenario/index | wc -l` == 0 (NOT mid-batch, per learning #53). Provisional reads during concurrent writes are never certified.
2. **Det-3x** — `npx tsx scripts/po-chain-follow-up.ts --all | grep "^## Summary"` returns `160/160 COMPLETE` three identical times.
3. **Guard 1 — json-broken = 0** — `json.load` sweep over `scenario/index/**`; markers live in `.ts` source only, never in `scenario.json` (learning #52).
4. **Guard 2 — shared-impl = 0** — no Implementation referenced by >1 Method.implementations[] (structural; miscredit impossible).
5. **Guard 3 — shared-test-over-credit = 0** — no Test spans >1 *unrelated* class. Authored-together / same-class siblings KEEP (distinct-method authorship exception): the SM-confirmed legit set (802363cb RbUseCaseDetail, 8edfcdd6 RbDetailDrawer, 1e763397 R19.36/37, dd85c4d7, da3d0186, c6dfbaa6, 8682fa95).
6. **Guard 4 — measure-on-complete-chains** — over-credit counts only on a complete chain; the tool gates on real source `[impl:uuid:<full>]` AND `[test:uuid:<full>]` markers (wired ≠ source-marked).
7. **Denominator = 160** (40 orphanByDesign excluded; one row per non-orphan Requirement).
8. **SM independent re-verify** — SM re-runs det-3x + guards on the same settled HEAD before Tron is told 160.
9. **Marker integrity** — every flip's marker == the unit's FULL 36-char uuid (no invented suffix, learnings #46/#51).

## B. OPEN-CHAIN OWNER+ACTION AUDIT (31 open at last settled 128) — NO STUCK CHAINS

Every open chain has a clear owner + next action. Two lanes:

### EXPERT lane — Impl source marker missing (9 chains, 5 distinct Impl uuids)
| Chains | Method | Impl uuid (expert authors [impl:uuid:<full>]) |
|--------|--------|----------------------------------------------|
| R14.2 | convertLegacy | d7abe1d3 |
| R17.6, R17.15 | ts:migrate | 811e9fa5 |
| R17.14 | sprintToScenario | 7e895957 |
| R18.19, R18.29, R18.30, R18.31 | checkRoundTrip | ee738f5f |
| R19.55.A | deviceAssociation | 766fd217 |

### TESTER lane — Impl ✓ already; Test unit+marker missing (22 chains)
| Chains | Test uuid (FULL — create-unit + [test:uuid:<full>]) | handed? |
|--------|------------------------------------------------------|---------|
| R16.5 | `e8a971b2-80a2-4541-b961-791cdb7f9355` | ✓ (handoff) |
| R16.6 | `440892b6-6399-4dd4-8116-09f6d2061126` | NEW (this doc) |
| R16.9 | `8be26b85-43d8-4b4a-be49-081fa530b62b` | ✓ |
| R17.4, R17.13 | `a9da16c9-eb1b-4ea3-a042-04ed4d90ffd7` | ✓ |
| R17.7, R17.8, R17.9, R17.10, R17.11 | `8b0d044f-64ed-4fb6-a777-a38e78d3f212` | ✓ |
| R17.24 | `1db382b5-932b-41b2-9865-c1e3d235fdbe` | NEW (this doc) |
| R19.2, R19.2.A | `5b79cc8e-e44c-4cbb-ab54-9d9d06ab596b` | ✓ |
| R19.8, R19.8.A, R19.8.B, R19.18 | `c6dfbaa6-30b9-40be-82aa-54628e547632` | ✓ |
| R19.22, R19.22.B | `17b688fb-1eb9-4750-8497-8317a97bee5c` | ✓ |
| R19.36 | `2806c12e-3727-4050-961d-9d93fa3a5f67` | ✓ |
| R19.41 | `1f38ad83-179d-4650-a88f-a70553784a17` | ✓ |
| R19.67 | `347b9970-9ea5-47ab-a419-226fd8e19244` | NEW — was the ONLY gap (impl 07942a94 RbDetailView.roomScenarioDetail had empty tests[]); planner-assigned fresh v4 |

### Stuck-chain finding: ZERO
- All 31 open chains have an owner (expert or tester) + an exact uuid action.
- The single risk (R19.67 had no test uuid) is closed by assigning `347b9970-9ea5-47ab-a419-226fd8e19244`.
- R10.2 / R10.3 / R18.27 appeared in a naive grep ("open" in req text) but are COMPLETE — not open.

**Net to 160:** 9 expert impl-markers (5 uuids) + 22 tester test-units (12 uuids). No blocked/ownerless chains.
