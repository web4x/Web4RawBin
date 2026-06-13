# CLIMB 21→27 — per-req-trace VERIFIED genuine (planner, 2026-06-14)
Trigger: expert commit 3558cb097 — extracted Room.init() (Room.ts:116) + Room.retainOrPrune() (Room.ts:204) into real named methods, markers IN-body, name-matched. PO+tester verified (room.test.ts 30/30). det-3x = 27/205 excl 46 stable.

## It's +6, NOT +2 — init/retainOrPrune are SHARED methods (honest, each verified)
| req | UC.method legs | completing impl(s) | genuine? |
|---|---|---|---|
| R19.1 | room.bootstrapAsUnit→init | 2ab8a3dd (named init()) | YES |
| R19.2 | room.editConfig→editOpen + bootstrapAsUnit→init | f9b579c1 + 2ab8a3dd | YES |
| R19.8 | maintainPersistentMembers→memberAdd + retainOnDisconnect→retainOrPrune | 4246c0a8 + 4c21d2ee | YES |
| R19.8.A | room.retainOnDisconnect→retainOrPrune | 4c21d2ee | YES |
| R19.8.B | room.retainOnDisconnect→retainOrPrune | 4c21d2ee | YES |
| R19.18 | room.retainOnDisconnect→retainOrPrune | 4c21d2ee | YES |

## Guard checks (per-req trace, not summary)
- Each req's ALL UC.method legs complete via real named-method strict-valid markers + tests. Confirmed via scripts/trace-req.ts (scorer's own walkReq).
- retainOrPrune cluster (R19.8.A/B/18 + R19.8 share room.retainOnDisconnect→retainOrPrune): LEGIT refinement-cluster — each req's description genuinely describes retain-on-disconnect; SM-pre-confirmed cluster (test c6dfbaa6). shared-IMPL guard clean: 4c21d2ee→ONE method f82d09a5 (not fanned across methods). Reqs share the METHOD via their UC.method, the canonical singular-chain pattern.
- R19.8.B completes via retainOrPrune (matches "persistent rejoin" behavior), NOT the mis-wired 4c8a91a5 dedup marker.

## Planner unwire hygiene (PO-instructed, count-neutral)
Removed from method init(4fed4fda).implementations[]: 9fbb1f6e (file-header line1, invalid impl) + 4c8a91a5 (marker heads addMember, mis-wired to init; does NOT own R19.8.B's UC.method retainOrPrune → left unwired per PO). init now singular-genuine = [2ab8a3dd]. det-3x 27 unchanged → confirms hygiene, not credit.

## Note on my earlier "21 final" verdicts
Correct AT THAT TIME (markers were mis-placed → genuinely incomplete). My finding DROVE the expert's fix (relocate markers into named methods). 21→27 is a GENUINE climb, not a reversal.

## HONEST COUNT = 27/205 excl 46 (det-3x). Was 21. +6 all genuine.
