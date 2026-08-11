<!-- planner-owned measurement artifact — regen via `node scripts/campaign-scoreboard.mjs` -->
# Campaign Scoreboard — drive every S30++ task to QA-Review (measured from UNITS)

**Measured 2026-08-11 from scenario units** (units win over boards; pure-node walk, chain-edge = C4(C) StepEvidence logic: shipped Impl markerPending=false, coverage = two-keyed passing Test only). **Done stays Tron's act via approve — 0 planner Done-flips.**

## Headline
- **TOTAL S30++ tasks: 113** — Done **68** · QA-Review **32** · **REMAINING (<QA-Review): 13**
- At QA-Review NOW, awaiting only Tron's verdict: **32**

## Per-sprint (Done / QA-Review / remaining)
| Sprint | total | Done | QA-Review | remaining<QA |
|--------|-------|------|-----------|--------------|
| S30 | 55 | 38 | 15 | 2 |
| S31 | 21 | 19 | 1 | 1 |
| S32 | 13 | 11 | 1 | 1 |
| S37 | 11 | 0 | 6 | 5 |
| S40 | 13 | 0 | 9 | 4 |

## The 13 remaining — by what each still needs
| need | count | meaning |
|------|-------|---------|
| RIPE (flip-ready) | 2 | chain-complete-to-Test, board-lags — flip after verify-owner-first |
| gate | 3 | Impl shipped, needs a Test authored |
| marker | 3 | Impl exists but markerPending — needs strict-AST marker-flip |
| build | 5 | no shipped Impl yet — needs building |
| two-key | 0 | — |
(device-only AC overlay on 2 — that blocks **Done**, not QA-Review)

## 3 CLOSEST to QA-Review (drive first)
1. **T40.10** `9a70ce5e` — Tron-QA-verdict-from-task (R40.10 approve/decline) — **RIPE**, flip-ready (R40.10 already device-verified in prior work). Device-AC gates Done only.
2. **T40.5** `a10c3329` — detail/feature-view extra-buttons dedupe — **RIPE but verify-owner-first FIRST** (prior scan flagged medium: possible shared-chain cross-credit — confirm the passing Test is T40.5's own before flip).
3. **T37.6** `32061171` — sprints.overview generated view — **gate**: awaiting the tester's overview-generator gate (measured `1f38e07e.tests[]`=empty). Flip the instant it lands (tonight's 7th-of-8).

## EXCLUDE recommendations (not campaign debt — a campaign must be able to reach empty)
- **T31.6** `6be9a92d` — **EXCLUDE**: description = "FUTURE / CONCEPT ONLY (Tron 2026-07-20 — do NOT implement now; deferred until Tron authorizes build)". Tron-deferred concept, not a current deliverable.
- **T37.4** `79fd2164` — **EXCLUDE from direct-drive**: it is the COORDINATION ROOT of the 8-part MVC decomposition (rollup = its subtasks T37.4.1-8 complete). It reaches QA-Review/Done via its subtasks, never driven independently.
- **T30.51** `4165a551` — **UNIT SAYS In-Progress** (marker-needed). My stale boot.md claimed "superseded by R30.53" but the unit carries no supersede marker → units win, NOT auto-excluded. **PO/req: reconcile the unit** — if truly superseded, mark it on disk; else it is an active marker-flip.

## Deferred-backlog (genuine deliverables, Tron/PO-scheduled later — not active debt)
- **T30.44** `06623fea` — add-repo-by-clone-URL (security backlog; re-activate before exposed/multi-user).
- **T-R31.14** `03f5d536` — deploy-hardening (scheduled after go-live).

## Adjusted drivable
13 remaining − T31.6 (concept) − T37.4 (rollup) = **11 real drivable** · of which 2 are deferred-backlog · 1 (T30.51) pending supersede-vs-active reconcile. **The campaign can reach empty.**

## S37 batch-1 detail (the C4 fold — expert wiring in BUILD ORDER)
- T37.4.1 `236918e9` (build) · T37.4.2 `fe6b4379` (gate) · T37.4.3 `1b8ebc9a` (gate) — architect-confirmed generic; expert wires per BUILD ORDER (evidenceForStep step-1 minted 688d6f842).

## S40 remaining detail
- T40.11 `6e3cc1b2` (build, UC-absent trap) · T40.6 `95d74272` (marker) · + the 2 RIPE above.

_No status drift found (unit.status == derived-from-checklist across all 113)._
