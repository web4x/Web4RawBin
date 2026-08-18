<!-- planner-owned measurement artifact — regen via `node scripts/campaign-scoreboard.mjs` (numbers move with concurrent churn; re-run for live) -->
# Campaign Scoreboard — drive every S30++ task to QA-Review (measured from UNITS)

**Measured 2026-08-11 from scenario units** (units win over boards; chain-edge = C4(C) StepEvidence: shipped Impl markerPending=false, coverage = two-keyed passing Test only). **Done stays Tron's act via approve — 0 planner Done-flips.**

**★ Counting rules (encoded in the script, right-by-construction — a scripted boundary does not decay, a remembered one does):**
- `supersededBy != null` = **TERMINAL** — leaves the count even if the status string is stale (exemplar T30.51: `supersededBy=ac3338b6` R30.53, status string stale).
- **campaign-scope boundary** = a task covering **R40.30** (`dc353c14`) or **R40.31** (`70bbaec5`) is **NEXT-PHASE**, outside the S30++ finish-count (PO ruling 2026-08-11: reqs minted DURING the campaign in response to discoveries are next-phase hardening, else the target recedes as fast as we advance = un-finishable). Currently 0 tasks (both req-only) → forward-guard.

**★ S40.requirements[] AUDIT (2026-08-11, commit 84590a66c):** the list was partial — **15 parent==S40 Requirements were missing** (R40.16–R40.30, all Backlog, invisible on the board), not just R40.30 as first believed. Added all 15 → requirements[]=31 (== parent-count). A partial requirements[] under-reports scope and every count on it inherits the error; now complete.

<!-- GENERATED-INDEX:BEGIN -->
<!-- do not edit between these markers — regen: npm run regen:board (auto-staged by the pre-commit hook) -->

### LIVE — auto-regenerated from units on commit (cannot go stale; do not hand-edit between the markers)

- **TOTAL S30++ tasks: 155** — Done **98** · QA-Review **44** · SUPERSEDED-terminal **3** · **REMAINING (<QA-Review): 10** (155 = 98+44+3+10)
- **★ ACTIONABLE (the campaign number Tron cares about — REMAINING minus law#103 excluded/deferred): 6**

| Sprint | total | Done | QA-Review | superseded | remaining<QA |
|--------|-------|------|-----------|------------|--------------|
| S30 | 55 | 36 | 15 | 3 | 1 |
| S31 | 21 | 19 | 1 | 0 | 1 |
| S32 | 13 | 11 | 1 | 0 | 1 |
| S33 | 15 | 15 | 0 | 0 | 0 |
| S34 | 7 | 7 | 0 | 0 | 0 |
| S35 | 4 | 4 | 0 | 0 | 0 |
| S36 | 5 | 5 | 0 | 0 | 0 |
| S37 | 19 | 1 | 12 | 0 | 6 |
| S40 | 16 | 0 | 15 | 0 | 1 |

**ACTIONABLE by blocker:** gate 1 · marker 5

#### Actionable — drivable now
| sprint | task | status | blocker | name |
|--------|------|--------|---------|------|
| S37 | 1bf4acc5 | Planned | marker | Task 37.21: Room Members/Files become real Folder scenario-u |
| S37 | a39efc32 | In Progress | marker | Task 37.25: Realtime-MVC ONE VIEW BUS — unify to a single vi |
| S37 | ae01f065 | Planned | marker | Task 37.20: ONE shared DnD drop contract — buffer carries th |
| S37 | d6dae432 | Planned | marker | Task 37.23: Server-manager root discovered from ssh config o |
| S37 | fdee4809 | Planned | marker | Task 37.22: IOR carries a clear origin (class+host+path) for |
| S40 | 2e831ffd | Planned | gate | Task 40.37: Context-sensitive actions — invalid-for-type/sta |

#### Excluded — law#103 campaignDisposition (not a current deliverable; leaves the actionable count by construction)
- **S31 6be9a92d** — Task 31.6: Shared pan/zoom viewer capability for EVERY embed — _excluded-concept — Tron 2026-07-20 'FUTURE/CONCEPT ONLY, do NOT implement now; deferred until Tron authorizes build'; not a current deliverable, leaves the actionable count by construction (law#103)._
- **S37 79fd2164** — Task 37.4: Objects self-heal (validate on init/read, never r — _excluded-rollup — COORDINATION ROOT of the 8-part MVC decomposition; reaches QA-Review/Done via its subtasks T37.4.1-8, never driven independently; leaves the actionable count by construction (law#103)._

#### Deferred — law#103 campaignDisposition (Tron/PO-scheduled later; leaves the actionable count by construction)
- **S32 03f5d536** — T-R31.14: Deploy-hardening — scripted deploy + served!=commi — _deferred-backlog — deploy-hardening (scripted deploy + served!=commit guard); scheduled after go-live; Tron/PO-scheduled later, leaves the actionable count by construction (law#103)._
- **S30 06623fea** — Task 30.44: Add a repository by clone URL + checkout locatio — _deferred-backlog — security (add-repo-by-clone-URL); re-activate before exposed/multi-user; Tron/PO-scheduled later, leaves the actionable count by construction (law#103)._

_Measured from units. **Unmeasured input (declared, GAP B):** src host-decl existence for build-coupled markers is not AST-measured here — the interim BUILD_COUPLED override map holds **0** entries (a hand-maintained 2nd source; target 0 via AST src-measure, then delete the map — enforced: the check FAILS if it grows). Gate results reach this board ONLY via Test-unit.status._

<!-- GENERATED-INDEX:END -->

## Headline

**★ CURRENT (2026-08-17, disk-measured, HEAD 877e9abfb v0.8.96):**
- Campaign (per the GENERATED-INDEX region above, live): TOTAL **151** · Done **97** · **QA-Review 42** · SUPERSEDED-terminal 3 · REMAINING 9 (**5 ACTIONABLE** + 2 excluded + 2 deferred).
- ★ The 5 ACTIONABLE (S37 T37.20/21/22/23 = shared-DnD-contract / real-Folder-units / IOR-origin / ssh-root-discovery, + S40 T40.37 context-sensitive-actions) are ALL `[Planned]` needing an expert-MARKER or a tester-GATE = **0 PLANNER-flips** (actionable-0 for the planner; the remaining work is expert/tester lane, not a board flip).
- ★ TRON's queue (qa-evidence-audit, measured): 42 QA-Review, ALL evidence-passing (would-409 = 0) = **24 non-device APPROVALS + 18 DEVICE-taps**. **0 Done till Tron** (Done is his act, R40.10).
- ★ **DEPLOY (updated 2026-08-17):** prod serves **v0.8.97** — **inc-3 DEPLOYED + LIVE** (served==committed==HEAD==origin, PO-verified). The inc-3 boot-check RED (a boot-path SYNC loop over ALL ~5677 units = O(all-units) latent scaling outage) is being fixed BY CONSTRUCTION via **R40.39** (structural registry re-frame — feature missing its type-index folder; captureOnly OUTSIDE, awaiting Tron) + **R40.41** (prod-build no-sourcemaps; captureOnly OUTSIDE). (Deploy = expert/architect lane; tracked here for board reality.)
- _★ The 2026-08-12 numbers BELOW (145 / QA-40 / REMAINING-5, SIGNABLE 33-of-40, ACTIONABLE 1/3) are SUPERSEDED by this block + the live GENERATED-INDEX region — kept for history only; per law#103 the counts live ONLY in the machine region, never re-typed in prose._

- **TOTAL S30++ tasks: 145** — Done **97** · QA-Review **40** · SUPERSEDED-terminal **3** · **REMAINING (<QA-Review): 5** (145 = 97+40+3+5)
  - _★ 2026-08-12: T37.4.1 + T37.4.3 flipped into QA-Review (38→40, both verify-owner-first clean on own distinct facets — R37.16 honored, all 3 C4 siblings own-Tested); BELOW-QA 7→5 = ACTIONABLE 1 (T40.11 alone, expert-frozen) + 2 deferred + 2 excluded._
  - _★ 2026-08-12: T37.4.2 + T40.6 flipped into QA-Review (36→38); REMAINING 9→7; T37.4.1 reconciled to In-Progress (impl-not-test, still in REMAINING)._
- **★★ SIGNABLE = 33 of the 40 at QA-Review** (2026-08-12; 40 after the T37.4.1/T37.4.3 flips, 7 held unchanged) — carry BOTH numbers to Tron (signable ≠ at-QA-Review). **7 HELD-FROM-BATCH, ALL stale-GATE with ZERO broken features (tester-diagnosed; status NOT downgraded per PO). Every stamp reads 'gate stale/unverifiable — feature NOT implicated', never a product defect:**
  - **R37.3** (T37.3 `364785b1`) · **R37.7** (T37.7 `bb31965b`) · **R40.8** (T40.8 `b0be0668`) = status:pass over a currently-RED gate DET-3x (hollow-row).
  - **R30.9** (T30.9 `6a6a56d3`) · **R30.35** (T30.35 `16379ac9`) · **R30.50** (T30.50 `7ed31b36`) · **R30.52** (T30.52 `a0b24e6b`) = r309-backed rows, status:pass over the currently-RED r309 gate.
  - ✓ **RELEASED (now SIGNABLE): R40.10** (T40.10 `9a70ce5e`) — chain-complete-to-Test on origin via its OWN approve-facet Test `d94b17e0` (measured-from-gate, NOT the 67697d86 BUG-A facet = no borrowed credit); gate GREEN DET-3x. PO's earlier 'chain-incomplete-no-Test' was inaccurate — it was never chain-incomplete.
  - _Cause tally (tester): ALL 7 = stale GATES (un-loadable import / synthetic fixture vs hardened-or-churned contract / line-pin drift / a contract our own commit changed) — 0 broken features. Hollow-row class (status:pass with no green gate) → by-construction candidate (like R37.15/16), capture once the per-row causes are booked._
  - _★ SCOPE-BUG FIXED 2026-08-12: the first cut counted only S30/31/32/37/40 (TOTAL 114/Done 66) — it OMITTED S33-S36 (all-Done: 15+7+4+5=31). "S30++" = every sprint ≥ S30. QA-Review (36) + REMAINING (9) were UNAFFECTED (S33-36 have 0 of each). Measured @ /var/dev/Workspaces/web4x/Web4RawBin HEAD 9090873aa (LIVE tree, not .old). Two-source concurrence: tester's MD-scan S30++ subtotal = 36 = my units count._
  - _★★ CANONICAL COUNTING CONVENTION (so the number stops shifting between agents): **BELOW-QA (units-status Planned/In-Progress, minus superseded-terminal) is the denominator** — as of HEAD 018f3ffb7 = **7 = 3 ACTIONABLE + 2 DEFERRED + 2 EXCLUDED**. ACTIONABLE (the campaign number Tron cares about) = T37.4.1 `236918e9` / T37.4.3 `1b8ebc9a` / T40.11 `6e3cc1b2` (all expert-held). DEFERRED = T30.44 `06623fea` / T-R31.14 `03f5d536`. EXCLUDED = T31.6 `6be9a92d` (concept) / T37.4 `79fd2164` (coordination rollup — completes via subtasks; a "6" count drops it). ✓ **RIPE-SHARED GUARD IMPLEMENTED (2026-08-12, by-construction): the script now downgrades a shared-requirement task's RIPE → RIPE-SHARED** (never auto-flip-ready; verify-owner-first required) + a stub-must-fail bite (`node scripts/campaign-scoreboard.mjs --bite`, weaken-proof, non-vacuous). T37.4.3 `1b8ebc9a` now correctly reads RIPE-SHARED (shares R37.11 with T37.4.2). This kills the borrowed-credit-from-the-board class STRUCTURALLY, not by vigilance. (--bite is available for the expert to wire into ci:gates — package.json is the expert's lane, not the planner's.)_
  - _Refreshed 2026-08-11 (re-run `node scripts/campaign-scoreboard.mjs`): T40.5 `a10c3329` (own chain corrected-at-source, quad-verified) + 1 more advanced QA-Review 34→36 / REMAINING 11→9. The script is the authoritative live list; the detail sections below may lag by ≤2 until re-transcribed._

## ★ REMAINING 9 — BY BLOCKER TYPE (measured from units + src, 2026-08-11)
Purpose: decide what is drivable NOW vs frozen on the walled minter / rewinding tester. Measured each chain (Impls minted? markerPending?) + src (code exists?).
_★ CORRECTED 2026-08-12 (fresh units+src measure @ HEAD 9090873aa; supersedes the 2026-08-11 cut, which mis-called T40.11/T40.6 off a RELAYED stale grep note — my measure-don't-relay violation, PO+expert caught it):_
- **(a) REQ-MINT-GATED** (req WALLED/rewinding → FROZEN): **T37.4.1 `236918e9`** — self-heal chain NOW minted (`3d354fa0d`): Impl `79f2dec1` (SelfHeal.selfHealOnRead) markerPending=**true** → needs strict-AST marker-flip = req. `src/ts/scenario/self-heal.ts` code present. **CLOSEST (one req marker-flip away).**
- **(b) TRON-GATED to reach QA-Review**: NONE (Tron gates Done, not QA; the 36 at QA-Review are his).
- **(c) BUILD-GATED (codeable NOW — expert):** **T40.11 `6e3cc1b2`** — its OWN chain (R40.11 = deploymentRefs-as-scenario-units) has NO Impl → build. NOTE: T40.11 Slice-1 `buildTypedModel` IS DONE+REAL (`DeploymentModel.ts:42`, marker `e009ace7:41`) but that Impl is credited to **R40.6**, not R40.11 — so R40.11's own facet still needs building.
- **(d) GATE-GATED (built + marked, needs a gate run — tester mid-rewind):** T37.4.2 `fe6b4379` + T37.4.3 `1b8ebc9a` (7 Impls markerPending=false — UnitController.apply/emit, TaskPolicy.*, MvcBoundaryGuard, `task-policy.ts`) · **T40.6 `95d74272`** (Impl `e009ace7` buildTypedModel markerPending=**false**, code-done+marked — **CORRECTED from build-coupled/fictional**). All need tester gate + req Test-mint. **CLOSEST: T37.4.2 (policy#1 core).**
- **(e) EXCLUDE:** T31.6 `6be9a92d` (concept-only, Tron do-not-implement) · T37.4 `79fd2164` (coordination ROOT, rolls up via subtasks).
- **Deferred-backlog (Tron-scheduled later):** T30.44 `06623fea` (security, before multi-user) · T-R31.14 `03f5d536` (deploy-hardening after go-live; 3 Impls markerPending=true).

**STRATEGIC READ (corrected):** drivable-NOW = T40.11 (build, expert — its own R40.11 facet) + the (d) gate items T37.4.2/4.3/**T40.6** are code-done+marked and land the moment the **tester** is back (gate) + **req** mints the Tests. T37.4.1 is one req marker-flip away. So the tail is expert(T40.11) + tester(gates) + req(marker/Test-mints) — mostly frozen on the two rewinding roles; only T40.11 is planner-independent build. No planner busywork; protect req/tester context so the C4 gates + mints land in one pass.
- At QA-Review NOW, awaiting only Tron's verdict: **34**
- **2026-08-11 deltas:** +**T40.17** `50f51ac1` (credited-but-taskless live-pin, req-minted, entered directly at QA-Review — real work made visible, TOTAL 113→114 / QA 33→34) · the **15 S30/S32 gate re-certs** at 0.8.90 (r3035/3036/3037×2/3038/3052b/325/3041/3042/3043×2/3045/3046/3050/3052) = all 12 covering tasks (T30.35/36/37/38/39/42/43/45/46/50/52 + T32.5) were ALREADY at QA-Review = **anti-regression re-certification only, NO campaign movement** (no honest flip to claim). R30.49 skipped (still-holding). ⚠ NOT moved backward without evidence: r311/R31.1 RED = architect-diagnosed supersede-vs-regression (S31's 1 remaining, verdict pending); 5 stale-gate-suspected + r309 NOT-RUN=RED are unconfirmed, not product regressions.

## ★★ PRE-DEPLOY TRUTH-TEST (2026-08-11, `node scripts/qa-evidence-audit.mjs`)
The hardened approve path (built, not yet deployed) enforces a testing-evidence precondition: a QA-Review task without a two-keyed passing Test would **409** on Tron's approve tap. Audited all QA-Review tasks for that exact chain-edge (Test ∈ Impl.tests[] ∧ Test.implementations[] back-ref ∧ status=pass): **WOULD-PASS approve = 36 / 36 · WOULD-409 = 0.** Every task flipped to QA-Review genuinely carries the evidence the approve path checks — the headline (36 QA-Review, zero held) is **not overstated**. (Coverage-existence test = what the precondition checks; per-flip verify-owner-first separately established each Test tests the *right* facet.)

## Per-sprint + remaining-by-blocker — ★ MIGRATED to the machine-measured LIVE region above (law#103 / [[status-discriminator-is-a-unit-field]])
The per-sprint table + REMAINING-by-blocker + ACTIONABLE/EXCLUDED/DEFERRED now render LIVE in the GENERATED-INDEX region (cannot go stale; the hand-transcribed copies here had already drifted to 11/9 while the machine said 5/1 — exactly why they're deleted). Re-run `node scripts/campaign-scoreboard.mjs` or `npm run regen:board` for the authoritative numbers. The manual RIPE cross-credit caveat is now the **by-construction RIPE-SHARED guard** (see the ★★ note above + `node scripts/campaign-scoreboard.mjs --bite`).

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

## Adjusted drivable — ★ see the machine-measured **ACTIONABLE** count in the LIVE region above
ACTIONABLE = REMAINING minus law#103 EXCLUDED/DEFERRED, **computed not curated** (a "9 real drivable" here already drifted vs the machine ACTIONABLE=1). The campaign can reach empty.

_No status drift (unit.status == derived-from-checklist) across all 113._
