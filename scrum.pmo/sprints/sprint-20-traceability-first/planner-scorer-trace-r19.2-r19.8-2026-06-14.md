# DETERMINISTIC SCORER TRACE — R19.2/R19.8 (planner, 2026-06-14) — the tiebreaker
Tool: scripts/trace-req.ts (calls the canonical Chain.walkReq/summarize reflectively — scorer's OWN logic, un-summarized). Re-run: npx tsx scripts/trace-req.ts

## R19.2 (req 18ecdab4) — INCOMPLETE. Method `init` drags it (multi-impl, 2 of 3 open)
| method | methodUuid | impl | test | row complete |
|---|---|---|---|---|
| editOpen | 6fc898ab | f9b579c1 PASS | 5b79cc8e | **true** |
| init | 4fed4fda | 2ab8a3dd **OPEN** (marker in CONSTRUCTOR Room.ts:113) | 47971f31 | false |
| init | 4fed4fda | 9fbb1f6e **OPEN** (FILE-HEADER Room.ts:1) | 57bc3556 | false |
| init | 4fed4fda | 4c8a91a5 PASS (label dedup R19.8.B) | 9d6a901d | true |
→ summarize: **incomplete** (ALL rows must be complete; init has 2 open impl-rows). Note: init has 3 wired impls — non-canonical per singular-chain #38; the 2 open ones (constructor/file-header markers) drag it. 4c8a91a5 passes on its own label but is semantically R19.8.B's dedup impl mis-wired to init.

## R19.8 (req 30dcb1a0) — INCOMPLETE. retainOrPrune impl strict-fails
| method | methodUuid | impl | test | row complete |
|---|---|---|---|---|
| memberAdd | ea02fa6d | 4246c0a8 PASS | da3d0186 | **true** |
| retainOrPrune | f82d09a5 | 4c21d2ee **OPEN** (marker INSIDE removeMember Room.ts:202, name≠retainOrPrune) | c6dfbaa6 | false |
→ summarize: **incomplete** (retainOrPrune's sole impl strict-fails).

## RESOLVES the 3-way contradiction
- (1) orig name-mismatch FAIL: right symptom, missed multi-impl structure.
- (2) cc0f1c7 2nd-leg open: RIGHT (R19.8 retainOrPrune genuinely open; R19.2 init has open impl-rows).
- (3) architect "all legs done → complete": WRONG. Node-walk saw "method has an impl" but the scorer requires ALL of a method's wired impl-rows complete; init's 2 strict-failing impls (constructor/file-header) + R19.8 retainOrPrune's mis-placed marker make them incomplete.

## VERDICT: 21 STANDS — NOT an under-report. Both reqs deterministically incomplete.
## Climb paths (genuine, det-3x each)
- R19.8 (+1): EXPERT relocate 4c21d2ee marker from inside removeMember INTO the retainOrPrune named-method body (name-match). Clean.
- R19.2 (+1): untangle method `init`(4fed4fda) impl wiring — it has 3 impls (constructor/file-header/dedup), none cleanly the canonical init impl. ARCHITECT designates init's true singular impl (#38), EXPERT adds a strict-valid marker in the init method body; PLANNER unwires the stale 2ab8a3dd/9fbb1f6e once confirmed orphan. Not a unilateral flip.
