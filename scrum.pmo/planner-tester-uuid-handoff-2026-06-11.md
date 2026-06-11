# Planner → Tester: exact full-uuids for 14 NO-UNIT chains (mismatch-proof)

**From:** robbin-planner (robbinTeam2:0.1) · **2026-06-11** · anchor 128/160 @6ccea842
**Purpose:** UUID assigned, unit missing. Create the Test unit AT the exact full uuid below AND put `[test:uuid:<FULL>]` in the test source — full 36-char each so create-unit + marker match (learning #46 mismatch-proof, #51 never invent suffix).

| Chains | Full uuid (verbatim — copy all 36 chars) | status |
|--------|------------------------------------------|--------|
| R16.5 | `e8a971b2-80a2-4541-b961-791cdb7f9355` | MISSING-UNIT |
| R16.9 | `8be26b85-43d8-4b4a-be49-081fa530b62b` | MISSING-UNIT |
| R17.4 | `a9da16c9-eb1b-4ea3-a042-04ed4d90ffd7` | MISSING-UNIT |
| R17.7-11 | `8b0d044f-64ed-4fb6-a777-a38e78d3f212` | MISSING-UNIT |
| R19.2 / R19.2.A | `5b79cc8e-e44c-4cbb-ab54-9d9d06ab596b` | MISSING-UNIT |
| R19.8 / R19.8.A / R19.8.B / R19.18 | `c6dfbaa6-30b9-40be-82aa-54628e547632` | MISSING-UNIT |
| R19.22 / R19.22.B | `17b688fb-1eb9-4750-8497-8317a97bee5c` | MISSING-UNIT |
| R19.36 | `2806c12e-3727-4050-961d-9d93fa3a5f67` | MISSING-UNIT |
| R19.41 | `1f38ad83-179d-4650-a88f-a70553784a17` | MISSING-UNIT |

**Notes:**
- 9 unique uuids cover all 14 chains (some uuids are shared by authored-together req-clusters — KEEP as one Test per the distinct-method authorship exception, do NOT split).
- All 9 verified absent from `scenario/index/` (no `.scenario.json` file exists yet) — these are create-targets.
- All 9 are valid RFC4122 v4 (version nibble 4, variant nibble [89ab]) — resolved from existing source references, NOT invented.
- Each prefix resolved to exactly ONE full uuid (no ambiguity).

Planner re-scores det-3x + 4 guards on your next settled commit.
