# Planner Shared-Test Classification — drive shared-test→0 (2026-06-11)

**For:** SM (TRONinterface:0.1) + PO. Input to the shared-TEST guard SM is adding.
**Method:** split-aware parse — a test's TRUE target class = the `(split for <Class>.<m>)` suffix when present, else the impl-name prefix. A test is OVER-CREDIT if its Impl.tests[] wirings span unrelated classes; LEGIT dual-cover only if the multiple reqs are authored-together (same feature).
**Honest floor:** 41-42 (canonical 42 includes chains still resolving through over-credited tests).

## HIGH-CONFIDENCE OVER-CREDIT — catch-all-test residuals (un-wire cross-class Impl.tests[])
These are the test-side echo of the eliminated impl catch-alls (94bc8f6e/7f1774c9 family). One test wired to split-impls of UNRELATED classes:
| test | spans classes | verdict |
|------|---------------|---------|
| **b543e1ad** (Logger.logAtLevel) | Assets, Device, FileUnit, Logger, PageNav, Room, SvgViewer, User, server (**9**) | OVER-CREDIT — keep Logger only, un-wire 8 cross-class split-impls |
| **9e1cb105** (R19.40 LazyLoadMessages) | Assets, chat-lazyload, lazyLoadChain, server | OVER-CREDIT — keep lazyLoadChain (R19.40), un-wire Assets/server |
| **dd85c4d7** (chat lazy-load) | Assets, chat-lazyload, server | MIXED — LEGIT for R19.38/R19.40 (authored dual-cover, SM-accepted) BUT over-credited to Assets.rekeyFix/server.ucScoped splits → un-wire those 2, keep the chat pair |
| **f2122854** (R19.39 RawBinSystemUser) | ClassRegistry, ensureRawBinUser | OVER-CREDIT — keep ensureRawBinUser (R19.39), un-wire ClassRegistry split |

## REQ-AUTHORSHIP BORDERLINE — tester/architect judgment (split into per-req tests)
Parse shows 2 "classes" but one token is a req-label artifact; the real question is whether the credited REQUIREMENTS are authored-together. From the earlier worklist these credit UNRELATED reqs → likely SPLIT:
| test | credits reqs | likely |
|------|-------------|--------|
| 2c502c22 (R15.4 defaultItemView) | R15.5 + R16.6/7/8/9 | OVER-CREDIT (R15 vs R16, unrelated) → split into 5 |
| e11c89d0 (R19.14) | R19.46/47/48/49/51 | OVER-CREDIT (unrelated R19.x) → split |
| f301f0b9 (R15.5 ListOverview) | R-V1 + R15.6 | borderline — SM authorship call |
| 1179288e (R17.12) | IORResolver siblings | likely LEGIT (same class) — SM confirm |
| 802363cb (R16.2 UseCaseDetailView) | RbUseCaseDetail siblings | likely LEGIT (same class) |
| 8edfcdd6 (R16.1 DetailViewContainer) | RbDetailDrawer siblings | likely LEGIT (same class) |

## LEGIT dual-cover — KEEP (do NOT split)
- 1e763397 = R19.36/R19.37 (both DropDispatcher, authored together) — SM-confirmed.
- dd85c4d7 chat pair R19.38/R19.40 — SM-confirmed (the cross-class wirings above are the part to remove).

## Fix mechanism
- **Over-credit cross-class wirings** = planner data-lane: remove the cross-class entries from each Impl's tests[] / each Method-chain's test resolution (the impls were split; the TEST wiring wasn't). I can execute on SM ack (same as the impl de-inflation), per-test, det-verified.
- **Req-level splits** (2c502c22, e11c89d0) = tester creates per-req dedicated test units.

**Drives shared-test → 0 (over-credits only; legit dual-cover R19.36/37 + R19.38/40 retained).** Awaiting SM ack to execute the cross-class un-wiring (report-affecting, may drop count to true floor).
