# 21-vs-23 RECONCILE — source-verified (planner, 2026-06-14)

## Not a tool-logic disagreement — the two tools MEASURE DIFFERENT THINGS
- **Live `objectVerb.ts Chain followUp` = 21** = FULL-CHAIN champagne (Req→UC→Class→Method→Impl→Test ALL present + strict).
- **Standalone `strict-marker-audit.ts` = 23** = count of impl MARKERS passing the strict-test among the (stale) credited set. It judges impl markers, not whole chains.
- Both pass the 5 source-verified anchors. The delta is 2 chains, and it is a UNIT/WIRING difference, NOT a strict-logic difference.

## The 2 differing chains (standalone-PASS, live-NOT-champagne)
| chain | method | live chain wires Method→Impl | that impl's marker | live verdict | genuine strict impl that EXISTS (unwired) |
|---|---|---|---|---|---|
| R19.2 | editOpen | `2ab8a3dd` | `Room.init` @ Room.ts:113 — NAME-MISMATCH | **Impl node OPEN** (strict-fail) → not champagne | `f9b579c1` "RbRoomDetail.editOpen" @ RoomView.ts:128 (name-match, strict-PASS) |
| R19.8 | memberAdd | `4c21d2ee` | `Room.retainOrPrune` @ Room.ts:202 — NAME-MISMATCH | **Impl node OPEN** (strict-fail) → not champagne | `4246c0a8` "Room.memberAdd" @ Room.ts:164 (name-match, strict-PASS) |

## Source verdict
- The OPEN node is the **Impl** node (not UC/Class/Test): each chain's canonically-wired impl (2ab8a3dd / 4c21d2ee) carries a marker whose label NAME-MISMATCHES the chain method → the live AST strict-test correctly FAILs it → chain not champagne.
- My standalone-23 over-counted these 2 because its `/tmp/credited.json` is a STALE pre-fold snapshot that had R19.2/R19.8 pointing at the genuine sibling impls (f9b579c1 / 4246c0a8). Standalone measures impl-markers, so it scored those genuine strict markers — which are real, but NOT the impls the current chains wire to.

## RECONCILED CHAMPAGNE FLOOR = 21 (full-chain). FINAL.
The live full-chain count is authoritative. 23 was impl-marker-only on stale wiring.

## Recoverable (climb backlog, NOT counted now)
R19.2 + R19.8 each have a genuine strict-valid named-member impl marker (editOpen / memberAdd) that is UNWIRED. A pure DATA re-wire (Method.implementations[] → f9b579c1 / 4246c0a8; planner lane) — no new code — would make both champagne → 21→23. Verify the mis-wired 2ab8a3dd(Room.init)/4c21d2ee(retainOrPrune) belong to their OWN reqs first.

---
## CORRECTION (planner, 2026-06-14, post data-inspection) — the "+2 re-wire" premise was WRONG
Ownership-verify BEFORE editing (per PO mandate) overturned my recoverable-re-wire claim:
- Method `6fc898ab` (RbRoomDetail.editOpen, R19.2) **already wires → f9b579c1** (editOpen impl, strict-marker @ RoomView.ts:134, test 5b79cc8e). COMPLETE leg. Nothing to re-wire.
- Method `ea02fa6d` (Room.memberAdd, R19.8) **already wires → 4246c0a8** (memberAdd impl, marker @ Room.ts:164, test da3d0186). COMPLETE leg. Nothing to re-wire.
- `2ab8a3dd` is NOT R19.2's impl — it's R19.1's `impl:Room.init`, marker sits INSIDE the Room **constructor** (Room.ts:113), strict-FAILs as mislabeled(label=init vs member=constructor).

### TRUE reason R19.2/R19.8 are not champagne (corrects the doc above)
They are MULTI-METHOD reqs. Their editOpen/memberAdd legs ARE complete + correctly wired. The live full-chain counts each req incomplete because ANOTHER method-leg in the req's chain is open (the summarize() representative surfaced a different open impl). Standalone-23 over-counted because it scores ONE impl-marker per credited row — it saw the passing editOpen/memberAdd leg and marked the whole req PASS, missing the second open leg.

### Implication
- Champagne floor = 21 STILL CORRECT and FINAL (R19.2/R19.8 genuinely have an open leg).
- There is NO planner data re-wire that climbs +2. The climb for R19.2/R19.8 needs the OTHER method-leg's real impl (expert) and/or a Class.method chain-scope narrowing (architect) — NOT my lane.
- **Do not execute the re-wire** proposed earlier — it would be a no-op/harmful (the targets are already wired). Premise retracted.

---
## CORRECTED CLIMB BACKLOG — R19.2 / R19.8 (PO-accepted 2026-06-14; 21 unchanged)
Multi-method reqs; the editOpen/memberAdd legs are DONE. The OTHER method-leg is the blocker.
| req | done leg (wired+tested) | open leg → owner |
|---|---|---|
| R19.2 | editOpen: method 6fc898ab → impl f9b579c1 (RoomView.ts:134) + test 5b79cc8e | 2nd method-leg open → **EXPERT** (real named-method impl + marker-in-body) and/or **ARCHITECT** (Class.method chain-scope narrowing, T187/T202-class) |
| R19.8 | memberAdd: method ea02fa6d → impl 4246c0a8 (Room.ts:164) + test da3d0186 | 2nd method-leg open → **EXPERT** + **ARCHITECT** (same) |
NOT planner lane (no data re-wire). Each = +1 champagne when its open leg lands a strict-valid named-method impl + full chain. Floor stays 21 until then.
