# DnD + Message + Room Chain Scoreboard (live)

**Author:** robbin-planner
**Updated:** 2026-06-11 (v3 — R19.38/39 GREEN excluded; R19.30-35 per-chain source:line)
**Rule:** no chain done until its Test leaf is real.

## GREEN Chains (EXCLUDED — SM/tester verified, end-to-end real)

| Req | Status | Evidence |
|-----|--------|----------|
| R19.36 | 🟢 | Tester 73a70971 8/8; uploadFile 9905fbfa; Test 1e763397. Data-link (b) only. |
| R19.37 | 🟢 | Same run; routeUnknown 3d4ceb1d. Data-link (b) only. |
| R19.38 | 🟢 | f76a02e2 excluded per PO. createMessageUnit 7a983076. |
| R19.39 | 🟢 | f76a02e2 excluded per PO. ensureRawBinUser 971e3531. |
| R19.40 | 🟡 partial | Impl shipped 37c6712b; Test pending. lazyLoadChain 94bc8f6e. |

## TRUE REMAINING: R19.30-35 backfill (code shipped v0.5.149-156)

### Per-chain detail: Method → shipped source:line → what's needed

| Req | UC | Method (uuid) | Class (ownerIor) | Source file:line | `[impl:uuid:]` marker | Impl unit | M.impls[] | Test | Status |
|-----|-----|--------------|-------------------|------------------|----------------------|-----------|-----------|------|--------|
| R19.30 | room.editCanonical | RbRoomDetail.editCanonical `1f2a3b4c` | RbRoomDetail | `src/ts/server/RoomKeys.ts:123` | ✓ marker EXISTS | ◻ need unit | ◻ | ◻ | **(a)+(b)+(c)** |
| R19.31 | room.linkResolve | RbRoomContent.linkResolve `3b4c5d6e` | RbRoomContent (`src/public/ts/room/rb-room-content.ts`) | no marker found | ◻ need marker | ◻ need unit | ◻ | ◻ | **marker+(a)+(b)+(c)** |
| R19.32 | sw.ignoreSearchNav | ServiceWorker.ignoreSearchNav `5d6e7f8a` | ServiceWorker | `src/public/sw.js:62` | ✓ marker EXISTS | ◻ need unit | ◻ | ◻ | **(a)+(b)+(c)** |
| R19.33 | detailDrawer.stickyClose | RbDetailDrawer.stickyClose `3a671bfc` | RbDetailDrawer | `src/public/ts/trace/rb-detail-drawer.ts:53` | ✓ marker EXISTS | ◻ need unit | ◻ | ◻ | **(a)+(b)+(c)** |
| R19.34 | detailView.singularChain | RbDetailDrawer.singularChain `e945e562` | RbDetailDrawer | `src/public/ts/trace/singular-chain.ts:25` (fn `singularChain`) — marker `19f0d4e0` exists but for `.narrowChain`, NOT for `e945e562` | ◻ need marker for `e945e562` | ◻ need unit | ◻ | ◻ | **marker+(a)+(b)+(c)** |
| R19.35 | room.persistMembers | Room.persistMembers `2dabc43d` | Room | `src/ts/server/Room.ts:298` | ✓ marker EXISTS | ◻ need unit | ◻ | ◻ | **(a)+(b)+(c)** |

### Summary of what each chain needs

| Req | Need marker? | Need Impl unit (a) | Need M.impls[] wire (b) | Need Test (c) |
|-----|-------------|--------------------|-----------------------|---------------|
| R19.30 | no (✓ RoomKeys.ts:123) | **yes** | **yes** | **yes** |
| R19.31 | **YES** (no marker for `3b4c5d6e`) | **yes** | **yes** | **yes** |
| R19.32 | no (✓ sw.js:62) | **yes** | **yes** | **yes** |
| R19.33 | no (✓ rb-detail-drawer.ts:53) | **yes** | **yes** | **yes** |
| R19.34 | **YES** (marker for wrong uuid `19f0d4e0`) | **yes** | **yes** | **yes** |
| R19.35 | no (✓ Room.ts:298) | **yes** | **yes** | **yes** |

### Dispatch

| Owner | Count | What |
|-------|-------|------|
| **expert** | 6 Impl units + 2 markers + 6 M.impls[] wires | Create 6 Impl scenario units; add `[impl:uuid:3b4c5d6e]` at the linkResolve fn in rb-room-content.ts + `[impl:uuid:e945e562]` at singularChain in singular-chain.ts:25; wire each Method.implementations[]→Impl IOR |
| **tester** | 6 Tests | Create 6 Test scenario units + `[test:uuid:]` markers in test files; one per chain |

### Data-link-only wiring (GREEN chains — expert or architect)

R19.36/37/38/39 need `Method.implementations[]` IOR wired to their existing (or to-be-found) Impl units + `Impl.tests[]` linked. R19.40 needs Test after Impl ships. These are data-link fixes, not new code.

---

*Updated on every commit. Chain complete = ✓ at every column including Test.*
