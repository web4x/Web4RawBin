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
