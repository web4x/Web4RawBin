<!-- planner-owned measurement artifact — regen via `node scripts/campaign-scoreboard.mjs` (numbers move with concurrent churn; re-run for live) -->
# Campaign Scoreboard — drive every S30++ task to QA-Review (measured from UNITS)

**Measured 2026-08-11 from scenario units** (units win over boards; chain-edge = C4(C) StepEvidence: shipped Impl markerPending=false, coverage = two-keyed passing Test only). **Done stays Tron's act via approve — 0 planner Done-flips.**

**★ Counting rules (encoded in the script, right-by-construction — a scripted boundary does not decay, a remembered one does):**
- `supersededBy != null` = **TERMINAL** — leaves the count even if the status string is stale (exemplar T30.51: `supersededBy=ac3338b6` R30.53, status string stale).
- **campaign-scope boundary** = a task covering **R40.30** (`dc353c14`) or **R40.31** (`70bbaec5`) is **NEXT-PHASE**, outside the S30++ finish-count (PO ruling 2026-08-11: reqs minted DURING the campaign in response to discoveries are next-phase hardening, else the target recedes as fast as we advance = un-finishable). Currently 0 tasks (both req-only) → forward-guard.

**★ S40.requirements[] AUDIT (2026-08-11, commit 84590a66c):** the list was partial — **15 parent==S40 Requirements were missing** (R40.16–R40.30, all Backlog, invisible on the board), not just R40.30 as first believed. Added all 15 → requirements[]=31 (== parent-count). A partial requirements[] under-reports scope and every count on it inherits the error; now complete.

## Headline
- **TOTAL S30++ tasks: 114** — Done **66** · QA-Review **34** · SUPERSEDED-terminal **3** · **REMAINING (<QA-Review): 11**
- At QA-Review NOW, awaiting only Tron's verdict: **34**
- **2026-08-11 deltas:** +**T40.17** `50f51ac1` (credited-but-taskless live-pin, req-minted, entered directly at QA-Review — real work made visible, TOTAL 113→114 / QA 33→34) · the **15 S30/S32 gate re-certs** at 0.8.90 (r3035/3036/3037×2/3038/3052b/325/3041/3042/3043×2/3045/3046/3050/3052) = all 12 covering tasks (T30.35/36/37/38/39/42/43/45/46/50/52 + T32.5) were ALREADY at QA-Review = **anti-regression re-certification only, NO campaign movement** (no honest flip to claim). R30.49 skipped (still-holding). ⚠ NOT moved backward without evidence: r311/R31.1 RED = architect-diagnosed supersede-vs-regression (S31's 1 remaining, verdict pending); 5 stale-gate-suspected + r309 NOT-RUN=RED are unconfirmed, not product regressions.

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

## ★ Last-mile expert queue (named, PO-requested) — the 11 remaining by what each needs
**REAL expert-build/marker queue (ordered by value — this is what to hand the expert when it frees):**
1. **T37.4.1** `236918e9` (S37, build) — MODEL self-heal on read (generic validate-on-read); part of the pinned C4, architect-confirmed generic.
2. **T40.6** `95d74272` (S40, **gate — implementing DONE 2026-08-11**) — the build-coupling is CLEARED: the expert BUILT `buildTypedModel` on DeploymentModel.ts (now **5 src hits**, was 0), Impl `e009ace7` strict-AST-flipped `d3e02a99b` markerPending=false, **durable on origin**; verify-owner-first passed (sharedByTasks=[95d74272 only], distinct chain). Now NEEDS a Test wired to `e009ace7` (verify-owner-first when it lands — the code also serves R40.11) → then QA-Review.
3. **T40.11** `6e3cc1b2` (S40, build) — **★ LARGE / SPLIT CANDIDATE:** deploymentRefs as scenario-first units + generic M2-type default view + fail-loud (the deep depref migration, UC 249fdab6 absent = unbuilt). NOTE: `buildTypedModel` (once the measured coupling that would have been T40.11's first slice) got **built early** for T40.6, so that specific slice is already done — but T40.11's own units/default-view/fail-loud remain to build.

**★ Classification provenance (PO ask — by-need is the least-verified bucket; 3 misses caught by measuring: 15-invisible-reqs, T31.1-already-QA, T40.6-build-coupled):** RIPE = chain reaches a two-keyed passing Test (coarse — can't see cross-credit, verify with `trace-task.mjs`) · gate/marker/build = walked the chain (shipped-Impl? Impl exists? Test wired?) · **build-coupled = MEASURED override** (`grep src <host-decl>` = 0 hits → fictional-marker → rides another task, encoded in `BUILD_COUPLED` in the script) · EXCLUDE/deferred/next-phase = named + evidenced. The script's coarse buckets (marker/RIPE) can misclassify — the measured overrides (supersededBy, next-phase, build-coupled) and manual verify-owner-first are where the truth is.

**Gate-needing (expert wires C4 → tester gates; not fresh build):** T37.4.2 `fe6b4379` + T37.4.3 `1b8ebc9a` (S37, C4 controller — expert wiring in BUILD ORDER after evidenceForStep) · T37.6 `32061171` (S37 — overview generator UNBLOCKED 2026-08-11, awaiting tester r3706 re-gate).

**HELD (not queue):** T40.5 `a10c3329` (RIPE-but-cross-credit — awaiting req's distinct-intent dedup Test).

**NOT expert queue (excluded/deferred):** T31.6 `6be9a92d` (EXCLUDE concept) · T37.4 `79fd2164` (EXCLUDE rollup) · T30.44 `06623fea` (deferred-backlog, security) · T-R31.14 `03f5d536` (deferred-backlog, deploy-hardening).

⇒ Net **new-build for the expert = T37.4.1, T40.6, T40.11(split)**; everything else is gate/wire, held, excluded, or deferred.

## EXCLUDE (not campaign debt — evidence-based)
- **T31.6** `6be9a92d` — CONCEPT ONLY, Tron 2026-07-20 "do NOT implement now" → EXCLUDE.
- **T37.4** `79fd2164` — COORDINATION ROOT of the 8-part MVC decomposition → rolls up via subtasks T37.4.1-8, never driven independently.
- **T30.51** `4165a551` — now **SUPERSEDED-terminal** (`supersededBy=ac3338b6` R30.53; R30.51 setHiddenAreas Tron-rejected+reverted v0.7.76 → native-folding rebuild). Left the remaining-count by the script rule above.

## Deferred-backlog (genuine deliverables, Tron/PO-scheduled later)
- **T30.44** `06623fea` — add-repo-by-clone-URL (security backlog). · **T-R31.14** `03f5d536` — deploy-hardening (after go-live).

## Adjusted drivable
11 remaining − T31.6 (concept) − T37.4 (rollup) = **9 real drivable** (2 of which deferred-backlog). **The campaign can reach empty.**

_No status drift (unit.status == derived-from-checklist) across all 113._
