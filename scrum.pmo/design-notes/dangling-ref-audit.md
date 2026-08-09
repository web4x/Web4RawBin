# Dangling-Ref Audit — traceability graph (read-only, chain-filtered, fabrication-split)

**By:** robbin-req 2026-08-09 per PO (read-only, report-before-repair). Swept all 5412 scenario units; analysed the 3694 CHAIN-class units across chain fields. Runtime classes (Room/Message/Device/Skill) + non-uuid fixtures excluded.

**Defect class:** a dangling ref renders as 'open'(incomplete), not 'broken'(referentially inconsistent) — invisible, indistinguishable from unfinished work. Same disease as false-credit, at the graph layer.

## Counts

- **mint_safe**: 42
- **fabricated_suspect**: 4
- **orphan_review**: 114
- **orphan_fabricated**: 10
- **legacy_singular_impl**: 51
- **truncated_resolvable**: 64
- **truncated_missing**: 4
- **fixture**: 1

## Classification (the (c) the PO asked for)

- **mint_safe** — full valid-v4 uuid missing via a forward/child field on an authoritative referrer → **mint-at-uuid SAFE (R40.19 pattern).** Repairable by me.
- **fabricated_suspect** — forward-field target is a PATTERNED/invalid uuid (bad v4 variant e.g. `…-c3b9-…`, or ascending tail e.g. `…-e1f2a3b4c5d6`). **DO NOT MINT — minting entrenches a fabrication (R5).** The REF is the defect; architect/origin must supply the real uuid or delete the ref.
- **orphan_review** — full uuid missing via ownerIor/parent → unit unattributed. **Do NOT mint a parent from a child** (fabricates identity); fix by repointing to the real owner or is a genuinely-deleted parent.
- **orphan_fabricated** — ownerIor/parent target is patterned/invalid → repoint, never mint.
- **legacy_singular_impl** — `Method.implementation` (singular) dangles BUT the Method's plural `implementations[]` resolves → **dead legacy field, NOT a real chain break** (scoreboard reads plural). Sweep-delete the singular field; do not mint.
- **truncated_resolvable** — 8-char ref; the unit EXISTS (prefix-resolves) → **fix the REF to the full uuid**, do not mint (the R1 truncation defect, ~fragile-under-measurement).
- **truncated_missing** — 8-char ref AND no unit.
- **fixture** — test/placeholder strings (`orphan`, etc.), not real defects.


## MINT-SAFE (R40.19 pattern — repairable) (42)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| UseCase | 9394f330-f3e1-4499-9d20-ee0820c91d23 | tasks | 51d53769-c7d8-46e4-978c-99bf0af86cbc | nav/coverage -> missing unit |
| Task | 600fa089-c8a4-4977-a89b-504969e78170 | useCases | a07def59-1e57-40bc-9b92-7c64b1229516 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Task | 6e3cc1b2-abf6-4468-a6c3-a7e54471e39c | useCases | 249fdab6-2eab-4997-86cc-9f8624ff090c | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Requirement | 7db6bfba-7b4a-499a-b35f-fd750e40ea09 | useCases | 92660a08-a192-4429-bd8d-6395602af598 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Test | bbf94471-90bf-48d5-bb69-4a3f0dc3bddd | implementations | ae217ea7-c1ad-41f4-9ef5-33dd21e9c7da | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | bb27178a-10d8-485f-a865-c9dd6a8c0909 | implementations | 2de1a16e-0265-4f43-a3ef-b93f62525771 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | bb21076a-3f56-4d58-adfc-e0fc7ee20bed | implementations | 8c1f2f29-c4db-4464-bb62-12405c274ce2 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | b05666be-d5c7-48f3-8ea4-adaace612d14 | useCases | d5fcbfdd-e6d3-4d82-9f24-828ee9a3da62 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| UseCase | b169e69b-3f00-43bd-b759-f12243a617ea | tasks | eff42eff-f5a4-4b19-80b7-1a89c8ab06cf | nav/coverage -> missing unit |
| Requirement | b8c7fe29-b6bb-43bb-abe7-f985ad60eaf7 | useCases | 3778ccc7-64bb-4de7-b0ee-b103f8a510cc | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Requirement | ba3fa399-750a-4201-a93d-923530f88d3d | tasks | fa8fffc8-8e2e-4b8c-a79b-8e7c1d1c8f0e | nav/coverage -> missing unit |
| Requirement | b55fe0f5-816c-4c48-bb43-9f7e8918e7c8 | useCases | 94693864-cd99-4340-b8cc-040e85fcfb6c | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Task | 3c7d1853-a5ee-4c7c-9c94-04b2e4f5bbb4 | requirements | 553be449-3b4f-4d5a-8e6f-7a8b9c0d1e2f | Sprint->missing Req |
| Requirement | 3a7d4df2-7588-4b09-a959-21708d68b8b1 | useCases | a07def59-1e57-40bc-9b92-7c64b1229516 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Test | 19541335-76ca-495b-b0b3-be8f84fa945e | implementations | 536a5ea2-ee00-4832-9178-fa95d6fc64ae | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | 1070b9cd-4590-44d2-9935-18a889790dd6 | implementations | d8f406ce-40df-4d51-87ec-fff7dec44374 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | 10c2e3ca-bd66-46c9-ad53-8dea1604b484 | implementations | 094c18a4-77a7-4208-a6a7-6a049e4e332e | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | 1c3b86ad-2b3f-4a73-9ea1-a5f3c6674f61 | useCases | ba738beb-f1ab-46f2-86dd-3f24f7f753f4 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Requirement | 83528e2f-60d3-4d62-acf3-2e3b4068fce5 | useCases | 249fdab6-2eab-4997-86cc-9f8624ff090c | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Test | 801b4eaf-bc40-4826-bab5-b143efd273fd | implementations | 8038dc71-1fab-43f2-a3f8-57f26152ac11 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | f783eed9-de0e-4f97-a2e8-83ce2d5627bc | implementations | 7af3bdc4-5032-4bc2-9974-a5be51f5a497 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | f3b61367-a470-42a1-87a8-727ebee4beca | tasks | fa8fffc8-8e2e-4b8c-a79b-8e7c1d1c8f0e | nav/coverage -> missing unit |
| Test | 2925cb20-085d-4510-8abf-5b50ab6a6ab2 | implementations | c78255a7-244d-40b5-bfaa-ee27fd56c1df | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | 26636ae4-8a9f-44ab-9981-6e49778c5a21 | implementations | f65121b1-c0c1-4608-ab47-6d20bce1c335 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | 2182c412-54d1-4e25-8938-41c6e7133337 | useCases | 6c9fc9bf-7075-40ce-b794-91c9712b4cb1 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Test | 28859f0f-a750-4b09-b594-16a0b3af5587 | implementations | 1366045c-166a-4d9e-a077-986e4c9a5c78 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | 22b614a7-1fa8-44af-a115-08f8ce98385b | implementations | 1251c42e-cf75-4d7d-8001-37bfb3f4efe1 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | 2e7cf761-ffa0-44ca-aef6-cf3e659efef7 | implementations | 23073248-b67d-4e82-9054-0066f5834939 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Test | 4c7745e3-f4b9-438d-a99d-b7dc3f434a96 | implementations | 9c4b49aa-f0f2-4c9c-9a30-0cc5d17e71ae | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| UseCase | 4a25e77b-e522-4915-870a-3399bc4d793a | tasks | 5da32d29-0a3b-4bb3-90a5-05ee7e0c0c82 | nav/coverage -> missing unit |
| UseCase | c8d9ce4b-9c90-4b8e-938d-fc5119338af0 | tasks | b2baea58-6e1a-4e33-b2e5-c91e83e5ff99 | nav/coverage -> missing unit |
| Requirement | cc875e35-772b-4352-b99c-4070f0370a68 | useCases | 966de307-0d5e-470e-b983-37db7ee3ec60 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Test | cd756e88-4731-48e5-894c-9a6b317943d3 | implementations | e8d226f6-d8e2-4a8d-9db9-2edd5bb33bfb | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | ce2734ea-2590-4491-a9a3-3be22629cacb | useCases | 4715978d-8210-4441-9af0-0f7b5edc46f6 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Test | d9eb4ccc-ffe4-462c-ae9b-3c9b0f812d74 | implementations | 93d42a25-f106-4580-a037-e15878eac7bd | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | acbfe6e7-cb3f-4845-82c9-e749cbd7d1ff | useCases | c0a58546-449d-450b-84b0-6aab67e65b2d | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Requirement | ad977999-b747-4527-95b6-29bac8deae1c | useCases | 38ef2453-4746-449c-af3f-4e0a382e81e3 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Requirement | e344927f-4ac9-4073-a4ce-640e0da015e2 | useCases | c2ac1391-3d05-441e-bc73-3f1e98877b20 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| Requirement | e8ab7aa2-92e2-423e-b3d1-794796c530fe | useCases | b25ce219-e059-48ac-a824-0dc9754e80f8 | chain renders 'open'(incomplete) not 'broken' — R40.19 class |
| UseCase | ec9fc9a0-17c7-4080-9876-8cbb59ed3a2d | tasks | c2118a07-89d0-44f7-a5e5-e5a2fdd64cc9 | nav/coverage -> missing unit |
| Task | ec187a1f-8e12-41ea-973c-49042d15b170 | coveredRequirements | 62e1b2e1-8715-47e4-9fdb-8b882d0f42dc | Task coverage -> missing Req |
| Test | e543aac4-708a-43d9-9e6e-9a57e3c9f1f9 | implementations | 4dc1bd9b-6d9c-41ca-bea6-a96b7c72263b | Test->missing Impl: verify-link broken (Test orphaned from Impl) |

## FABRICATED-SUSPECT (do NOT mint) (4)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| Test | d57ae802-d32c-4fb4-861f-df279f109d1f | implementations | d1135c9f-a037-4b24-e5d1-4c3b9f602e83 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | a97ccbab-2d41-47a8-a8cf-2d005d10b5f7 | tests | 7e717383-0000-0000-0000-000000000000 | unit claims a Test not on disk — FALSE-GREEN risk |
| Test | a570f8c7-8c19-4087-aa6e-d9d7d12cb021 | implementations | b1113a7d-8e15-4f02-c3b9-2a1f7d4e0c61 | Test->missing Impl: verify-link broken (Test orphaned from Impl) |
| Requirement | 5a42764a-3e87-4777-9a26-14862f2a7c29 | tests | ae410763-0000-0000-0000-000000000000 | unit claims a Test not on disk — FALSE-GREEN risk |

## LEGACY-SINGULAR-IMPL (dead field, sweep-delete) (51 — top 25)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| Method | 963b67a2-488c-4580-b5ba-697537f02754 | implementation | 27a4ff38-d0ae-4a7b-9a97-060d45fd2e2b | plural implementations[] resolves; singular field is legacy/dead |
| Method | 9a0914b8-4158-4b90-a898-c082cff5c737 | implementation | 39e0ab19-3de9-405b-ac47-1b054db2f63c | plural implementations[] resolves; singular field is legacy/dead |
| Method | 9a20a3f9-67c6-42e4-bd0a-919f92e79217 | implementation | 79923f04-dd5f-4155-8c49-3e61365726f1 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 66484695-b395-4415-a676-299f67d8318b | implementation | 2ddda0aa-abf3-47d9-9ba3-d9a1ad3e80c3 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 674fc9b0-98de-40e4-8287-54908f979065 | implementation | d7ac0a32-520f-41f5-9cf4-ddcab3ff08f8 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 635545cd-c483-4cfe-a385-b57fafc768ac | implementation | 750f7175-f462-4d6e-9f64-4b86a6c1b7fa | plural implementations[] resolves; singular field is legacy/dead |
| Method | 615ad9dd-12ed-470e-aac6-6a73a48ec69e | implementation | 43cc8d76-c20c-4a75-aa7e-0821d716a3c6 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 688c10c8-9aa1-463b-b35a-af08b1bc4e84 | implementation | 53cb55ce-1f29-4cad-bff9-c0e18fa7cf2e | plural implementations[] resolves; singular field is legacy/dead |
| Method | 7601e257-afe5-4495-a7b5-b4c4bf79c6ce | implementation | be1c5456-ce74-4fb7-a4fe-94639d73e19b | plural implementations[] resolves; singular field is legacy/dead |
| Method | b0e09fb1-8392-49fb-b398-24eac95c1b3c | implementation | 43e55219-7f80-46e4-b8dc-083cf9696316 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 32ae650c-d936-4696-89cd-8f9369fdc52e | implementation | d8f406ce-40df-4d51-87ec-fff7dec44374 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 3dc29df9-0da7-4164-8035-4e4a131e6e6b | implementation | ada13130-df78-4de9-9128-f754436dba8d | plural implementations[] resolves; singular field is legacy/dead |
| Method | 00d9e37e-46ef-40d1-9e1c-7243ace69729 | implementation | b1113a7d-8e15-4f02-c3b9-2a1f7d4e0c61 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 0fc2b48d-ba59-4211-b5a1-fb1f3018e220 | implementation | bc52c1bc-6e2d-4623-8fb7-3a8944b85dd5 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 0f5e0c40-f24d-4dbf-9990-f7e6d771ae17 | implementation | f91aae23-0e3e-43b1-9d63-81b74f5f2307 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 0d99b7e1-f423-48b2-8243-4fc6f8d2c6ea | implementation | 5592cffb-5408-4185-b6d9-261a53163cfa | plural implementations[] resolves; singular field is legacy/dead |
| Method | 055a7f68-1d98-4a95-9572-22dcb0c40712 | implementation | 1864c7bd-bfb2-4865-be41-1ae2d0ea909f | plural implementations[] resolves; singular field is legacy/dead |
| Method | 13231016-ce87-4c16-ac1a-a1af8d1353b8 | implementation | 9b286116-ad01-4a01-9884-3bfe5892d7d0 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 87a5dffe-54bc-466e-9579-10bd2f02476b | implementation | 81567694-3a0a-496e-a8e5-941258d512a5 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 87e56c4b-b1bd-4369-a011-2e83bb2521b3 | implementation | 7c7ac4b1-b214-448a-9c01-ba94363395d2 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 838bab78-e346-4101-96a0-624a2ead7cde | implementation | 7dc0ba61-a392-4854-b3b3-35e2766b2418 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 804593fc-adba-4087-97fd-471835c2aa40 | implementation | 21a4e210-6ee6-42f9-9e10-c808cb1a66a4 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 81c44474-9e78-498f-b4ad-0fc43d480432 | implementation | 13c971e3-a40b-41af-930a-0bc2789dacd2 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 8ff0accb-0b33-4935-8045-86bdf2261d6d | implementation | b2e861b6-9b03-4196-8954-0fcd14bebb08 | plural implementations[] resolves; singular field is legacy/dead |
| Method | 8c296fa6-a726-4dad-b550-47192cb92328 | implementation | 39921b04-18f1-4eee-8d62-e6e1c699de16 | plural implementations[] resolves; singular field is legacy/dead |

## ORPHAN-REVIEW (repoint, do not mint) (114 — top 25)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| Test | 916b8bb0-08ef-4287-98f0-031ddf004723 | parent | 976147f4-1940-466f-b44d-7d54f5f4c788 | ORPHAN unattributed to parent |
| Test | 916b8bb0-08ef-4287-98f0-031ddf004723 | ownerIor | 976147f4-1940-466f-b44d-7d54f5f4c788 | ORPHAN unattributed to owner |
| Task | 9c9d4eda-ed8b-466b-b738-a5d4c621be7a | ownerIor | 2aac7676-bc8a-4f9a-aa07-e9a8dba3f0cd | ORPHAN unattributed to owner |
| Method | 9d5369a9-17af-4884-bfdd-f981450f3852 | parent | 4dfd37fd-d30f-4ec1-af8c-2647ff865ba7 | ORPHAN unattributed to parent |
| Method | 9a0914b8-4158-4b90-a898-c082cff5c737 | parent | 0dd08b2f-30ba-433f-a9de-285065f3fb8e | ORPHAN unattributed to parent |
| Task | 676f309c-101a-4567-ba86-caa3077d6a01 | ownerIor | 29d92990-3514-4627-8780-eb0d2e462eeb | ORPHAN unattributed to owner |
| Method | 635545cd-c483-4cfe-a385-b57fafc768ac | parent | e4c9c03c-37b3-4fc5-85f2-d34697d6aaa1 | ORPHAN unattributed to parent |
| Task | 7662f276-9cd4-4a67-a1d3-5c47a8294195 | ownerIor | 2aac7676-bc8a-4f9a-aa07-e9a8dba3f0cd | ORPHAN unattributed to owner |
| Test | 76a00001-0001-4a01-a001-000176010001 | parent | 5ccce08e-21c7-4a79-b91c-3c870b10603c | ORPHAN unattributed to parent |
| Test | 76a00001-0001-4a01-a001-000176010001 | ownerIor | 5ccce08e-21c7-4a79-b91c-3c870b10603c | ORPHAN unattributed to owner |
| Test | 73ba7577-becc-4c43-be64-26a255872090 | parent | 87a85986-0ef9-4bcd-bd43-34a5192d0ba0 | ORPHAN unattributed to parent |
| Test | 73ba7577-becc-4c43-be64-26a255872090 | ownerIor | 87a85986-0ef9-4bcd-bd43-34a5192d0ba0 | ORPHAN unattributed to owner |
| Task | 7051e416-1087-422b-a271-a5575d2475fc | ownerIor | 29d92990-3514-4627-8780-eb0d2e462eeb | ORPHAN unattributed to owner |
| Test | 71396672-5795-47a9-8074-b314ecfe092d | parent | c518166d-4eb0-4435-8589-5a6a99f434f1 | ORPHAN unattributed to parent |
| Test | 71396672-5795-47a9-8074-b314ecfe092d | ownerIor | c518166d-4eb0-4435-8589-5a6a99f434f1 | ORPHAN unattributed to owner |
| Test | 747f4bab-17c2-4274-9349-b5b9e9478df7 | parent | d608bf73-c520-48c3-8b6c-7eaa5cbe31ae | ORPHAN unattributed to parent |
| Test | 747f4bab-17c2-4274-9349-b5b9e9478df7 | ownerIor | d608bf73-c520-48c3-8b6c-7eaa5cbe31ae | ORPHAN unattributed to owner |
| Task | 7d439851-a7d2-4193-b3fa-4ac0d893a86d | ownerIor | 2aac7676-bc8a-4f9a-aa07-e9a8dba3f0cd | ORPHAN unattributed to owner |
| Task | 7ab42153-9cb4-41e5-befe-8c7af894da9d | ownerIor | 29d92990-3514-4627-8780-eb0d2e462eeb | ORPHAN unattributed to owner |
| Method | 75f0015c-3a04-4946-846b-2553c6c66cd4 | parent | a4f056d2-463c-4613-8f3b-d3af2069b26c | ORPHAN unattributed to parent |
| Task | b6772860-ded7-4a10-afe7-ee8d6d79f91e | ownerIor | 2aac7676-bc8a-4f9a-aa07-e9a8dba3f0cd | ORPHAN unattributed to owner |
| Test | b774751d-5094-478b-b659-ec6e569d25bf | parent | d55124c4-0de0-45bc-9fb8-8375cad61de7 | ORPHAN unattributed to parent |
| Test | b774751d-5094-478b-b659-ec6e569d25bf | ownerIor | d55124c4-0de0-45bc-9fb8-8375cad61de7 | ORPHAN unattributed to owner |
| Test | bbf94471-90bf-48d5-bb69-4a3f0dc3bddd | ownerIor | ae217ea7-c1ad-41f4-9ef5-33dd21e9c7da | ORPHAN unattributed to owner |
| Test | bb27178a-10d8-485f-a865-c9dd6a8c0909 | ownerIor | 2de1a16e-0265-4f43-a3ef-b93f62525771 | ORPHAN unattributed to owner |

## ORPHAN-FABRICATED (10)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| Task | 3c7d1853-a5ee-4c7c-9c94-04b2e4f5bbb4 | ownerIor | 64af2638-0000-0000-0000-000000000000 | ORPHAN unattributed to owner |
| Method | 1ae8de15-6cb2-4fe3-a78f-f25c40e57bbb | ownerIor | 3e0ceb94-90f3-4c5b-b13b-e1f2a3b4c5d6 | ORPHAN unattributed to owner |
| Method | 20a5703b-df2c-4187-80b5-ae50c6d8e50d | ownerIor | 3e0ceb94-90f3-4c5b-b13b-e1f2a3b4c5d6 | ORPHAN unattributed to owner |
| Test | 490c3106-4b8d-4d9f-8d43-da2e3a91b1d3 | parent | 6fab203e-9554-472f-8f75-cafebec000de | ORPHAN unattributed to parent |
| Test | 490c3106-4b8d-4d9f-8d43-da2e3a91b1d3 | ownerIor | 6fab203e-9554-472f-8f75-cafebec000de | ORPHAN unattributed to owner |
| Method | d42ad180-9f09-404d-ab8a-45744b83efd8 | ownerIor | 3e0ceb94-90f3-4c5b-b13b-e1f2a3b4c5d6 | ORPHAN unattributed to owner |
| Test | d57ae802-d32c-4fb4-861f-df279f109d1f | ownerIor | d1135c9f-a037-4b24-e5d1-4c3b9f602e83 | ORPHAN unattributed to owner |
| Test | a570f8c7-8c19-4087-aa6e-d9d7d12cb021 | ownerIor | b1113a7d-8e15-4f02-c3b9-2a1f7d4e0c61 | ORPHAN unattributed to owner |
| Method | 5397634d-2fca-442e-92d0-2957c3810928 | ownerIor | 3e0ceb94-90f3-4c5b-b13b-e1f2a3b4c5d6 | ORPHAN unattributed to owner |
| Method | 5afb6fc2-fe11-4935-a9c4-205750a1d8b6 | ownerIor | 3e0ceb94-90f3-4c5b-b13b-e1f2a3b4c5d6 | ORPHAN unattributed to owner |

## TRUNCATED-RESOLVABLE (fix ref) (64 — top 30)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| Method | 9357333d-6a94-44a2-a74f-c19b0cd85fd4 | ownerIor | 819aacf9 | →819aacf9-323d-4d38-9b08-d5f0ec11de76 |
| Implementation | 90089602-d819-4df3-80a9-ef5524931ae3 | ownerIor | aa046d50 | →aa046d50-751a-465e-bea7-51e28a94b09d |
| Requirement | 92ed98b8-77dc-45c3-bd4a-73aaf6d94ee1 | ownerIor | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| Implementation | 6b4d7714-5b86-4f08-9560-3cbd3cc03015 | ownerIor | ccbf83af | →ccbf83af-6387-4b49-990f-d24703fbc326 |
| Method | 637afb30-7621-4fbd-beed-5ce7f0340b46 | ownerIor | 5a057914 | →5a057914-9106-439a-8733-dd1d0058ca5e |
| Method | 6a9bc473-da00-42f6-9c0b-2df5d3bcb18c | ownerIor | d48dc6bc | →d48dc6bc-fe32-4df4-8f22-b8ba8f9d3323 |
| Test | 6a03bcb6-7719-4125-8f63-265a6479cf68 | verifies | d64f6288 | →d64f6288-1402-4a88-8f33-e58bcd80a785 |
| Test | 6a03bcb6-7719-4125-8f63-265a6479cf68 | ownerIor | d64f6288 | →d64f6288-1402-4a88-8f33-e58bcd80a785 |
| Test | 7147ca60-adc0-479f-8923-e319baad83d0 | verifies | c5b331a7 | →c5b331a7-d844-4cea-a7a4-1e5eebceec37 |
| Test | 7147ca60-adc0-479f-8923-e319baad83d0 | ownerIor | c5b331a7 | →c5b331a7-d844-4cea-a7a4-1e5eebceec37 |
| Class | 740385cb-ce33-4216-a857-a5b63d35abb5 | parent | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| Class | 740385cb-ce33-4216-a857-a5b63d35abb5 | ownerIor | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| Method | b96baaec-7753-4140-9c2f-3d59e527542f | ownerIor | 94e7bf82 | →94e7bf82-f867-4352-88b4-8c2a45bff4d4 |
| Requirement | bd9543e0-76b1-476f-9692-cb87afde47cf | ownerIor | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| Implementation | 36b6ce2e-efe9-4ad8-9382-104ee07d0266 | ownerIor | 7e6a0361 | →7e6a0361-1b23-4e12-97c2-abbc0772b5fa |
| Requirement | 3ba633f3-4a88-4438-a003-9f3b75ec2f01 | ownerIor | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| UseCase | 347ed620-e300-4fe1-bdd7-fe0ed82b3046 | parent | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| UseCase | 347ed620-e300-4fe1-bdd7-fe0ed82b3046 | ownerIor | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| Implementation | 3ee03bde-aa3c-4d95-92c1-71e9c599f46a | ownerIor | 07a14dc5 | →07a14dc5-8139-42ac-b495-c7394f75c302 |
| Method | 081eed71-e112-4bed-8db4-06ad8c99db28 | ownerIor | 5d9132cf | →5d9132cf-f49e-4d3b-bc67-5078d0d576d0 |
| UseCase | 08e36c7f-e519-4e42-84b7-ee24a55aeb3e | parent | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| UseCase | 08e36c7f-e519-4e42-84b7-ee24a55aeb3e | ownerIor | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| Implementation | 0ed5cd75-7cd5-420d-af29-28c7f167456c | ownerIor | 47822b73 | →47822b73-cfa0-4972-9a28-2fe826df55ef |
| Implementation | 197054f9-12d0-4e5e-a76d-77ad709c96c0 | ownerIor | d98af6d8 | →d98af6d8-2f87-40c1-9e7d-bed79510f58a |
| UseCase | 81aa3984-44f7-4b92-805d-c6e7ddc992fe | parent | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| UseCase | 81aa3984-44f7-4b92-805d-c6e7ddc992fe | ownerIor | e6a9de8c-2479-4785-8bf7-b9b | →e6a9de8c-2479-4785-8bf7-b9b38b37a42f |
| Test | 8cbd7538-c6c6-455f-8c41-49807c82ec9d | verifies | ce2085b2 | →ce2085b2-b93c-444e-aa28-fb226bbc98fe |
| Test | 8cbd7538-c6c6-455f-8c41-49807c82ec9d | ownerIor | ce2085b2 | →ce2085b2-b93c-444e-aa28-fb226bbc98fe |
| Test | fb907b0b-4844-411d-995f-2231bf882317 | verifies | 1a5ad916 | →1a5ad916-33ba-4829-80c4-44efd8756c35 |
| Test | fb907b0b-4844-411d-995f-2231bf882317 | ownerIor | 1a5ad916 | →1a5ad916-33ba-4829-80c4-44efd8756c35 |

## TRUNCATED-MISSING (4)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| Class | 66625aa7-4de6-4972-b731-f4e23a552480 | parent | 658841dc-8feb-483f-810f-d6b | ORPHAN unattributed to parent |
| Class | 66625aa7-4de6-4972-b731-f4e23a552480 | ownerIor | 658841dc-8feb-483f-810f-d6b | ORPHAN unattributed to owner |
| UseCase | 01666b33-7250-46aa-b9c2-ccf127b64d64 | parent | 658841dc-8feb-483f-810f-d6b | ORPHAN unattributed to parent |
| UseCase | 01666b33-7250-46aa-b9c2-ccf127b64d64 | ownerIor | 658841dc-8feb-483f-810f-d6b | ORPHAN unattributed to owner |

## FIXTURE (1)

| ior | referrer uuid | field | target | note/board-lie |
|---|---|---|---|---|
| Class | c0a0921d-b70e-4b28-a452-a4a806a0bba0 | ownerIor | orphan | ORPHAN unattributed to owner |