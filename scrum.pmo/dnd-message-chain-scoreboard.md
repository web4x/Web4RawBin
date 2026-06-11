# DnD + Message + Room Chain Scoreboard (live)

**Author:** robbin-planner
**Updated:** 2026-06-11 (CORRECTED — re-measured via Requirement.useCases[] chain, not Task.useCases[])
**Rule:** no chain done until its Test leaf is real.

## CORRECTION NOTE

Prior scoreboard (29d431c2) showed 0 UC/Class/Method across the board — **WRONG**.
Root cause: walked `Task.useCases[]` (empty on traceability-closure tasks) instead of
`Requirement.useCases[]` (where architect wired the chain). PO caught the contradiction
against architect's committed IORs + SM's independent verify.

## Legend
✓ = node exists + wired | ◻ = OPEN (needs work) | — = N/A

## Chain Table (measured via Requirement.useCases[] → UC.classes[] → Class.methods[] → Method.implementations[] → Impl.tests[])

| Req | Task | UC | Class | Method | Impl(marker) | Test | Next OPEN owner |
|-----|------|----|-------|--------|---------------|------|-----------------|
| R19.30 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ◻ | **expert** (impl:uuid marker) |
| R19.31 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ◻ | **expert** (impl:uuid marker) |
| R19.32 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ◻ | **expert** (impl:uuid marker) |
| R19.33 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ◻ | **expert** (impl:uuid marker) |
| R19.34 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ◻ | **expert** (impl:uuid marker) |
| R19.35 ✓ | ✓ | ✓ | ✓ | ✓ | ◻ | ◻ | **expert** (impl:uuid marker) |
| R19.36 ✓ | ✓ (impl v0.5.157) | ✓ dropZone.uploadFile | ✓ DropDispatcher | ✓ uploadFile | ◻ | ◻ | **expert** (impl:uuid marker — code exists, marker missing) |
| R19.37 ✓ | ✓ (impl v0.5.157) | ✓ | ✓ | ✓ routeUnknown | ◻ | ◻ | **expert** (impl:uuid marker — code exists, marker missing) |
| R19.38 ✓ | ✓ | ✓ | ✓ | ✓ createMessageUnit | ◻ | ◻ | **expert** (impl:uuid marker) |
| R19.39 ✓ | ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC for ensureRawBinUser) |
| R19.40 ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | ◻ | **planner** (Task unit) then **architect** (UC) |

## Summary

| Node | Done | Open |
|------|------|------|
| Requirement | 11/11 ✓ | 0 |
| Task | 10/11 ✓ | 1 ◻ (R19.40) |
| UseCase | 9/11 ✓ | 2 ◻ (R19.39, R19.40) |
| Class | 9/11 ✓ | 2 ◻ (R19.39, R19.40) |
| Method | 9/11 ✓ | 2 ◻ (R19.39, R19.40) |
| Impl (marker) | 0/11 | 11 ◻ — Method.implementations[] empty on ALL; code exists for R19.36/37 but no `impl:uuid` marker wired |
| Test | 0/11 | 11 ◻ — blocked on Impl |

## TRUE OPEN nodes — dispatch list

| # | Node | Req | What's needed | Owner |
|---|------|-----|---------------|-------|
| 1 | Task | R19.40 | Create task unit (lastMessageIor + chat lazy-load) | **planner** |
| 2 | UC | R19.39 | Create UC for ensureRawBinUser (Method 971e3531 exists but no UC wired to req) | **architect** |
| 3 | UC+Class+Method | R19.40 | Full chain after task stands up | **architect** |
| 4-14 | Impl | ALL 11 | Create Implementation units + add `impl:uuid:` markers in source. For R19.36/37 code already exists in `src/public/ts/drop-dispatcher.ts` — just needs marker annotation + Impl scenario unit. For R19.30-35/38 code is shipped — needs marker + unit. | **expert** |
| 15-25 | Test | ALL 11 | Create Test units + add `test:uuid:` markers in test files. Blocked until Impl wired. | **tester** |

**Bottleneck SHIFTED:** architect has only 2 open nodes (R19.39 UC, R19.40 UC+Class+Method). The **real bottleneck is expert** — 11 Impl units + markers needed across all chains.

## Architect IORs (cross-checked, all confirmed present)

| Req | UC uuid | Class uuid | Method uuid | Method sourceFile |
|-----|---------|------------|-------------|-------------------|
| R19.36 | d2ab1540 | 3fca4816 DropDispatcher | 9905fbfa uploadFile | drop-dispatcher.ts |
| R19.37 | (via R19.36 UC) | (via DropDispatcher) | 3d4ceb1d routeUnknown | drop-dispatcher.ts |
| R19.38 | (wired) | (wired) | 7a983076 createMessageUnit | message-unit.ts |
| R19.39 | ◻ MISSING | ◻ | 971e3531 ensureRawBinUser | classes.ts |
| R19.40 | ◻ MISSING | ◻ | 94bc8f6e lazyLoadChain | server.ts |

---

*Updated on every commit. Chain complete = ✓ at every column including Test.*
