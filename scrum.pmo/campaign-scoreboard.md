<!-- planner-owned measurement artifact — regen via `node scripts/campaign-scoreboard.mjs` (numbers move with concurrent churn; re-run for live) -->
# Campaign Scoreboard — drive every S30++ task to QA-Review (measured from UNITS)

**Measured 2026-08-11 from scenario units** (units win over boards; chain-edge = C4(C) StepEvidence: shipped Impl markerPending=false, coverage = two-keyed passing Test only). **Done stays Tron's act via approve — 0 planner Done-flips.**

**★ Counting rule (encoded in the script, right-by-construction):** `supersededBy != null` = **TERMINAL**, orthogonal to the derived status string — a superseded task leaves the remaining-count on every re-run even if its status string is stale (T30.51 was the exemplar: `supersededBy=ac3338b6` R30.53 present+evidenced, status string stale).

## Headline
- **TOTAL S30++ tasks: 113** — Done **66** · QA-Review **33** · SUPERSEDED-terminal **3** · **REMAINING (<QA-Review): 11**
- At QA-Review NOW, awaiting only Tron's verdict: **33**

## Per-sprint (Done / QA-Review / superseded / remaining)
| Sprint | total | Done | QA-Review | superseded | remaining<QA |
|--------|-------|------|-----------|------------|--------------|
| S30 | 55 | 36 | 15 | 3 | 1 |
| S31 | 21 | 19 | 1 | 0 | 1 |
| S32 | 13 | 11 | 1 | 0 | 1 |
| S37 | 11 | 0 | 6 | 0 | 5 |
| S40 | 13 | 0 | 10 | 0 | 3 |

## The 11 remaining — by what each still needs
| need | count | meaning |
|------|-------|---------|
| RIPE (coarse) | 1 | chain reaches a passing Test — but see caveat: T40.5 is a **cross-credit false-RIPE**, HELD |
| gate | 3 | Impl shipped, needs a Test authored |
| marker | 2 | Impl exists but markerPending — needs strict-AST marker-flip |
| build | 5 | no shipped Impl yet — needs building |

**⚠ RIPE caveat:** the script's RIPE (a two-keyed passing Test anywhere in the chain) CANNOT detect a **shared-Impl cross-credit** — that needs the manual verify-owner-first trace (`scratchpad/trace-task.mjs <uuid>`). T40.5 is the live example: RIPE by the coarse rule, but HELD because its passing Test belongs to a sibling req.

## Drive order (verify-owner-first before every flip)
1. **T40.10** `9a70ce5e` — ✅ **FLIPPED → QA-Review 2026-08-11** (commit `9f517ec82`). verify-owner-first PASSED: Impls distinct, Test `67697d86` is R40.10's own; approveByOwner device-verified (r4010 GREEN @390, 403 token-less). AC-6 device = Tron.
2. **T40.5** `a10c3329` — ⛔ **HELD (cross-credit CONFIRMED)**: Impl `ffd44b17` universalActionBar shared with T34.7; passing Test `cbdb3210` = "test:R34.7 universal action bar", NOT R40.5's extra-buttons-dedup facet. Needs a **distinct-intent Test** on the dedup facet (R30.11 no-re-credit) — req preparing the mint, gate from tester — THEN flip. Not put in front of Tron.
3. **T37.6** `32061171` — gate: awaiting the tester's overview-generator gate (`1f38e07e.tests[]`=empty), sits 3rd in the tester queue. Flip the instant it lands.

## EXCLUDE (not campaign debt — evidence-based)
- **T31.6** `6be9a92d` — CONCEPT ONLY, Tron 2026-07-20 "do NOT implement now" → EXCLUDE.
- **T37.4** `79fd2164` — COORDINATION ROOT of the 8-part MVC decomposition → rolls up via subtasks T37.4.1-8, never driven independently.
- **T30.51** `4165a551` — now **SUPERSEDED-terminal** (`supersededBy=ac3338b6` R30.53; R30.51 setHiddenAreas Tron-rejected+reverted v0.7.76 → native-folding rebuild). Left the remaining-count by the script rule above.

## Deferred-backlog (genuine deliverables, Tron/PO-scheduled later)
- **T30.44** `06623fea` — add-repo-by-clone-URL (security backlog). · **T-R31.14** `03f5d536` — deploy-hardening (after go-live).

## Adjusted drivable
11 remaining − T31.6 (concept) − T37.4 (rollup) = **9 real drivable** (2 of which deferred-backlog). **The campaign can reach empty.**

_No status drift (unit.status == derived-from-checklist) across all 113._
