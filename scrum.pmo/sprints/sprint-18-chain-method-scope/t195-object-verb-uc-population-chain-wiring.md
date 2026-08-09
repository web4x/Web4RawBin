<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Object.verb UC population + Class/Method/Impl chain wiring (multi-phase epic)

[task:uuid:2ee62c5c-00e5-4747-8a33-9a5a6fd27c89]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Task Description

Phase A — Object.verb UC scaffolding and parser correctness. Created 24 genuine Object.verb UseCase units to seed the chain (8f4250c5 linked T124's 9 existing UCs from s17-usecases.puml; 434e57fe added 24 fresh Object.verb UCs and deleted 11 parse-artifact requirements; afdde0a7 PARSER FIX so each '+ method' line is treated as ONE method, ending a long-standing fan-out artifact source). Populated UC.class+UC.method on 8 new feature UCs (f83238b1) and created 16 Class+Method+Impl units bringing the population to 0 classless UCs remaining (9394cff2). Marked 36 infra/process/orphan requirements orphan-by-design (b0c8d8a5) and deleted 20 parse-artifact Methods while placing real [impl:uuid] / SpeakingTree markers (de7cc337, 5572c103).

Phase B+C — Method→Impl→Test link pipeline. Built the link pipeline that closes the chain end-to-end: 947fd38a (Phase B+C Impl→Test + Method→Impl pipeline), 0585659f (36 Impl→Test links via source→test component mapping), 0da2ce0c (3 declaring tests linked to chain Impls for the struct-mismatch champagne lift), 8f3ee321 (champagne fix of 22 stale Task→Impl refs + R14.2/R15.6/R15.7 chain closure), d8e9a69a (verifies[] for R17.31/R17.32/R15.3/R15.6 driving another champagne lift), 60607ffd (un-orphaned 6 reqs by creating UCs for chain breaks R18.1/R-ED1/R17.14/R17.18/R17.20/R17.26), c3e92295 (wired 6 architect UCs Class→Method→Impl→Test).

Final pass — contacts UC verb→method mapping fix. Current head 3840049c corrects the contacts UC mapping so .render fallback is replaced by the real .onClickDelegate target, removing the last verb→method mis-routing in the feature UC layer. Net effect of the epic: every feature UC now resolves through a real Class, its narrowed single Method (R18.24), to a real Impl, and onward to a real Test (R18.25). The Class node sits in the chain as a first-class level (R18.16) while the object inspector still shows ALL Class.methods[] (R18.20) — narrowing is on the chain walker, not on the object model.

## QA Audit & User Feedback

2026-06-05 8f4250c5 T195 Phase A: link T124's 9 existing UCs from s17-usecases.puml
2026-06-05 947fd38a T195 Phase B+C: Impl→Test + Method→Impl link pipeline
2026-06-05 5572c103 T195: real [impl:uuid] markers + Impl→Test links + untested-code audit
2026-06-05 de7cc337 T195 close-out: delete 20 parse-artifact Methods + real SpeakingTree markers
2026-06-05 afdde0a7 T195 PARSER FIX: method-name extraction treats each + line as ONE method
2026-06-05 434e57fe T195 Phase A: 24 genuine Object.verb UCs created + 11 artifact requirements deleted
2026-06-05 f83238b1 T195: populate UC.class+method on 8 new feature UCs (16 flagged for expert)
2026-06-05 9394cff2 T195: 16 Class+Method+Impl units for feature UCs (0 classless UCs remain)
2026-06-05 b0c8d8a5 T195: mark 36 infra/process/orphan requirements orphan-by-design
2026-06-05 0585659f T195: 36 Impl→Test links via source→test component mapping
2026-06-05 0da2ce0c T195: link 3 declaring tests to chain Impls (struct-mismatch champagne lift)
2026-06-05 8f3ee321 T195 champagne: fix 22 stale Task→Impl refs + R14.2/R15.6/R15.7 chain closure
2026-06-05 d8e9a69a T195: add verifies[] for 4 feature reqs (R17.31, R17.32, R15.3, R15.6) → champagne lift
2026-06-05 60607ffd T195: un-orphan 6 reqs + create UCs for chain breaks (R18.1/R-ED1/R17.14/R17.18/R17.20/R17.26)
2026-06-05 c3e92295 T195: wire 6 architect UCs — Class→Method→Impl→Test chains
2026-06-05 3840049c T195: fix contacts UC verb→method mapping — .render fallback → .onClickDelegate

## Subtasks

None (atomic task).
