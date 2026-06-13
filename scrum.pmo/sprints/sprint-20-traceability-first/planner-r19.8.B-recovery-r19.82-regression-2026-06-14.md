# R19.8.B recovery VERIFIED genuine, BUT R19.82 REGRESSED — NET 26, not 27 (planner, 2026-06-14)
det-3x = 26/205 excl 46. PO rule: credit +1→27 ONLY if CLEAN. It is NOT clean.

## R19.8.B: +1 GENUINE (verified, shared-method clean)
Architect extracted a DEDICATED named method Room.rejoinDedup (6c3cfb82) — R19.8.B no longer shares addMember.
- Chain: R19.8.B(417918a5) → UC rejoinDedup(fa121190) → Class Room → Method rejoinDedup(6c3cfb82) → Impl 4c8a91a5 → Test 9d6a901d.
- 4c8a91a5 marker "Room.rejoinDedup" @ Room.ts:179-180 HEADS `private rejoinDedup(member)` — name-MATCH ✓. Method.implementations=[4c8a91a5] singular. UC.method=6c3cfb82.
- per-req trace (trace-req.ts walkReq): complete=true via rejoinDedup→4c8a91a5→9d6a901d. R19.8.B.useCases re-pointed [61e01080]→[fa121190].
- SHARED-METHOD verdict: NO sharing. R19.8.B method=rejoinDedup(6c3cfb82); R19.8 method=memberAdd(ea02fa6d). DISTINCT methods, distinct impls. Not double-credit. CLEAN.

## R19.82: −1 REGRESSION (collateral, blocks the climb)
R19.82 (addMemberTakeover, req 14a5a9ca) was COMPLETE at the 21-baseline. The rejoinDedup extraction (d8e825870/ae4338a36) restructured the addMember region and **DELETED the impl marker [impl:uuid:84910216] from Room.ts**.
- trace: R19.82 → method addMemberTakeover(f2a2129b) → impl 84910216 OPEN ("Add real [impl:uuid:84910216] in source") → test 3c153212 (still wired) → INCOMPLETE.
- grep confirms: 84910216 marker GONE from Room.ts.
- FIX (EXPERT): restore [impl:uuid:84910216] marker into the addMemberTakeover named-method body (name-match) in Room.ts.

## NET: 21 + 6 genuine flips (R19.1/2/8/8.A/8.B/18) − 1 regression (R19.82) = 26. HOLD 26.
After expert restores 84910216 → R19.82 re-completes → 27 GENUINE (R19.8.B recovery + no regression).

## Note (PO Q): R19.8's memberAdd leg impl 4246c0a8 label "Room.memberAdd" vs source member "addMember" — memberAdd≠addMember by exact/substring. Yet scorer credits it (pre-established since 21-baseline). Flag for separate review whether the scorer's name-match has tolerance, or 4246c0a8 should re-label to "Room.addMember". NOT part of this recovery; R19.8 unaffected.
