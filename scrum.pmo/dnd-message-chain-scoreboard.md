# DnD + Message + Room Chain Scoreboard (live)

**Author:** robbin-planner
**Updated:** 2026-06-11
**Rule:** no chain done until its Test leaf is real.

## Legend
✓ = node exists + wired | ◻ = OPEN (needs work) | — = N/A

## Chain Table

| Req | Task | UC | Class | Method | Impl(marker) | Test | Owner of next OPEN |
|-----|------|----|-------|--------|---------------|------|--------------------|
| R19.30 ✓ | T-room-edit-pen ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.31 ✓ | T-room-link-404 ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.32 ✓ | T-share-link-offline ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.33 ✓ | T-sticky-drawer-close ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.34 ✓ | T-singular-chain-detail ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.35 ✓ | T-member-iors ✓ | ✓ room.persistMembers | ◻ | ◻ | ◻ | ◻ | **architect** (Class+Method on UC) |
| R19.36 ✓ | T-dnd-file-chain ✓ (impl[x] v0.5.157) | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.37 ✓ | T-dnd-unknown-dispatcher ✓ (impl[x] v0.5.157) | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.38 ✓ | T-message-units ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.39 ✓ | T-rawbin-user ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | **architect** (UC) |
| R19.40 ✓ | ◻ | ◻ | ◻ | ◻ | ◻ | ◻ | **planner** (Task unit) |

## Summary

| Node | Done | Open |
|------|------|------|
| Requirement | 11 ✓ | 0 |
| Task | 10 ✓ | 1 ◻ (R19.40) |
| UseCase | 1 ✓ (R19.35 room.persistMembers) | 10 ◻ |
| Class | 0 | 11 ◻ |
| Method | 0 | 11 ◻ |
| Impl (marker) | 0 | 11 ◻ |
| Test | 0 | 11 ◻ |

## OPEN nodes — dispatch list

| # | Node type | Req | What's needed | Owner |
|---|-----------|-----|---------------|-------|
| 1 | **Task** | R19.40 | Create task unit for "Room holds lastMessageIor; chat lazy-loads 5 messages" | **planner** |
| 2-11 | **UseCase** | R19.30-39 (10 reqs) | Architect creates singular UC per task, wires UC.classes[]+UC.methods[] | **architect** |
| 2-11 | **Class** | R19.30-39 | Architect assigns Class (existing or new) per UC | **architect** |
| 2-11 | **Method** | R19.30-39 | Architect assigns singular Method per UC on the Class | **architect** |
| 2-11 | **Impl** | R19.30-39 | Expert adds `impl:uuid:` marker in source for each Method | **expert** |
| 2-11 | **Test** | R19.30-39 | Tester creates Test unit + adds `test:uuid:` marker in test file | **tester** |

**Bottleneck:** architect — 10 UCs needed before any downstream progress.

## Notes

- R19.35 is furthest along: UC `room.persistMembers` exists (architect `0fdd5089`) but UC.classes[]+methods[] still empty → Class+Method+Impl+Test all blocked.
- R19.36+R19.37 have expert impl shipped (v0.5.157 `6afbc901`) but the chain from UC downward isn't wired — code exists, traceability doesn't.
- R19.40 has no task unit yet — planner to create.

---

*Updated on every commit. Chain complete = ✓ at every column including Test.*
