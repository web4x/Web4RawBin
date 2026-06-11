# DnD + Message + Room Chain Scoreboard (live)

**Author:** robbin-planner
**Updated:** 2026-06-11 (CORRECTED v2 — exclude GREEN chains; precise open-node classification)
**Rule:** no chain done until its Test leaf is real.

## Legend
✓ = node exists + wired | ◻ = OPEN | 🟢 = GREEN (end-to-end verified) | (a) = needs Impl unit | (b) = needs Method.implementations[] wiring | (c) = needs Test

## GREEN Chains (EXCLUDE from open-list — SM-verified real markers + tester GREEN)

| Req | Status | Evidence |
|-----|--------|----------|
| R19.36 | 🟢 DONE | Tester 73a70971 8/8 GREEN; SM-verified real `impl:uuid:` markers; uploadFile 9905fbfa + Test 1e763397 (test:R19.14.DnDFileChain) |
| R19.37 | 🟢 DONE | Same test run; routeUnknown 3d4ceb1d verified |

**NOTE:** R19.36/37 show `Method.implementations[]=0` in scenario data — the IOR link is missing but the `[impl:uuid:]` source marker EXISTS and tester verified real behavior. Fix = **(b) wire only** (create or find the Impl unit and add its IOR to Method.implementations[] + Impl.tests[]→Test 1e763397).

## Chain Table (OPEN chains only — R19.30-35, R19.38-40)

| Req | Task | UC | Class | Method | Impl unit | src marker | Test | Classification |
|-----|------|----|-------|--------|-----------|------------|------|----------------|
| R19.30 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ? | ◻ | (a)+(b)+(c) |
| R19.31 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ? | ◻ | (a)+(b)+(c) |
| R19.32 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ? | ◻ | (a)+(b)+(c) |
| R19.33 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ? | ◻ | (a)+(b)+(c) |
| R19.34 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ? | ◻ | (a)+(b)+(c) |
| R19.35 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ? | ◻ | (a)+(b)+(c) |
| R19.38 ✓ | ✓ | ✓ | ✓ | ✓ createMessageUnit | ◻ | ✓ (7ba74970) | ◻ | (a)+(b)+(c) — marker exists in source |
| R19.39 ✓ | ✓ | ◻ | ◻ | ✓ ensureRawBinUser | ◻ | ✓ (7ba74970) | ◻ | architect UC first; then (a)+(b)+(c) |
| R19.40 ✓ | ✓ (9edbc532 NEW) | ◻ | ◻ | ✓ lazyLoadChain | ◻ | ✓ (7ba74970) | ◻ | architect UC first; then (a)+(b)+(c) |

## Summary

| Node | Done | Open | GREEN |
|------|------|------|-------|
| Requirement | 11/11 ✓ | 0 | 2 🟢 |
| Task | 11/11 ✓ | 0 (R19.40 just stood up) | 2 🟢 |
| UseCase | 9/11 ✓ | 2 ◻ (R19.39, R19.40) | 2 🟢 |
| Class | 9/11 ✓ | 2 ◻ (R19.39, R19.40) | 2 🟢 |
| Method | 11/11 ✓ | 0 (all exist) | 2 🟢 |
| Impl unit | 0/9 open | 9 ◻ | 2 🟢 (exist but Method.implementations[] link missing) |
| Test | 0/9 open | 9 ◻ | 2 🟢 (Test 1e763397 exists; Impl.tests[] link missing) |

## Precise OPEN dispatch (excluding GREEN R19.36/37)

| # | What | Reqs | Owner | Notes |
|---|------|------|-------|-------|
| 1 | **UC creation** | R19.39, R19.40 | **architect** | R19.39 Method 971e3531 exists but no UC wired to req; R19.40 Method 94bc8f6e exists but no UC. |
| 2 | **Impl unit creation (a)** | R19.30-35, R19.38-40 (9 chains) | **expert** | Create Implementation scenario units; R19.38/39/40 have `impl:uuid:` markers in source (7ba74970) — just need the unit; R19.30-35 need both marker + unit. |
| 3 | **Method.implementations[] wiring (b)** | ALL 9 open + R19.36/37 (11 total) | **expert** | After Impl units exist, wire each Method.implementations[] IOR. For GREEN R19.36/37: find/create their Impl units and wire (code+Test both exist already). |
| 4 | **Test creation (c)** | R19.30-35, R19.38-40 (9 chains) | **tester** | Create Test units + `test:uuid:` in test files. R19.36/37 already have Test 1e763397 — just needs Impl.tests[] wiring. |

**Bottleneck:** expert — 9-11 Impl units + wiring. Architect has 2 UCs left.

---

*Updated on every commit. Chain complete = ✓ at every column including Test.*
