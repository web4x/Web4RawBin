# Tron QA Batch — stale-Active + R-C5 Done-candidates
Phone-readable. NOTHING flipped Done (robbin-req recommends; Tron decides). SIGNAL, NOT STAMP.
**A1=3 (task-level direct evidence -> Done?) · A2=36 (req-level Test only, SCOPE UNVERIFIED) · B=3 (partial) · C=10 (unevidenced -> superseded/backlog, planner closing)**

## A1 — task-level direct evidence (Tron: Done?)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 10545051 | S20 | url-drawer .url click opens drawer (BUG13) | tester DET-3x real-data 32ba15a7b | Done? |
| 15aeb43d | S20 | CurrentSprint planner-skill maintains pin (R20.13) | CurrentSprint.ts +8 Tests 82e309bbb, ~16-spr prod | Done? |
| 54519bc4 | S20 | TestCase+Gate 1st-class units (R20.20/21) | gate+render 7b07d8465, 1023 TC+6 Gate | Done? |

## A2 — req-level Test evidence ONLY — SCOPE NOT verified (a covered req has a gated Test, but THIS task scope is unconfirmed; NOT 'scope-match'). Tron/planner confirm scope per row -> Done, else superseded/backlog.
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 0c28c7f8 | S19 | user-scenarios | req R19.54 Test f5211188 | req-level only — SCOPE UNVERIFIED |
| 147e2f64 | S19 | member-iors | req R19.35 Test c874546a | req-level only — SCOPE UNVERIFIED |
| 164d8114 | S19 | visibility | req R19.3 Test 9a4f07c7 | req-level only — SCOPE UNVERIFIED |
| 1805f7db | S19 | apply-flow | req R19.5 Test 2420ff7d | req-level only — SCOPE UNVERIFIED |
| 1c7f8d8e | S19 | server-log-level | req R19.41 Test 1f38ad83 | req-level only — SCOPE UNVERIFIED |
| 2195d98f | S19 | room-ui-shared | req R19.21 Test ea6ce5d8 | req-level only — SCOPE UNVERIFIED |
| 25c38ac0 | S19 | dnd-unknown-dispatcher | req R19.37 Test 1e763397 | req-level only — SCOPE UNVERIFIED |
| 312cb103 | S19 | default-flip | req R19.10 Test cda50af2 | req-level only — SCOPE UNVERIFIED |
| 3ca88df7 | S19 | room-join-stale-takeover | req R19.82 Test 3c153212 | req-level only — SCOPE UNVERIFIED |
| 40a756f5 | S19 | file-version-new | req R19.48 Test 8d8b3fdd | req-level only — SCOPE UNVERIFIED |
| 67b2763e | S19 | persistent | req R19.7 Test da3d0186 | req-level only — SCOPE UNVERIFIED |
| 6c4949fa | S19 | room-unit | req R19.1 Test 47971f31 | req-level only — SCOPE UNVERIFIED |
| 6f574da6 | S19 | file-version-array | req R19.50 Test bde41193 | req-level only — SCOPE UNVERIFIED |
| 787e88ab | S19 | remove-spectator | req R19.24 Test d12f34d5 | req-level only — SCOPE UNVERIFIED |
| 7fca98ae | S19 | dnd-file-chain | req R19.36 Test 2806c12e | req-level only — SCOPE UNVERIFIED |
| 834fe55b | S19 | file-unit | req R19.14 Test fbfeac53 | req-level only — SCOPE UNVERIFIED |
| a91643c6 | S19 | sticky-drawer-close | req R19.33 Test 859878d6 | req-level only — SCOPE UNVERIFIED |
| ae090710 | S19 | room-ui | req R19.11 Test e4963145 | req-level only — SCOPE UNVERIFIED |
| b3b822e9 | S19 | room-json-symlink-and-ui | req R19.22 Test f936d0f4 | req-level only — SCOPE UNVERIFIED |
| c0d67460 | S19 | room-edit-pen-canonical | req R19.30 Test 6d58883c | req-level only — SCOPE UNVERIFIED |
| e90c223d | S19 | remove-room-sizes | req R19.23 Test ffab35a3 | req-level only — SCOPE UNVERIFIED |
| fb629eb7 | S19 | back-button-visible | req R19.57 Test 79da3d78 | req-level only — SCOPE UNVERIFIED |
| fda34dac | S19 | room-link-404-fix | req R19.31 Test 7f5a8bb4 | req-level only — SCOPE UNVERIFIED |
| d43fce61 | S20 | s19-shared-impl-split-recovery | req R19.11 Test e4963145 | req-level only — SCOPE UNVERIFIED |
| 0c1b375e | S21 | vCard drop stores .vcf beside avatar | req R21.1 Test 068dbc4b | req-level only — SCOPE UNVERIFIED |
| 18845496 | S21 | Addresses async OSM-verified | req R21.7 Test 0802991c | req-level only — SCOPE UNVERIFIED |
| 1bae9710 | S21 | Phone alt-UUID index (ln symlink) | req R21.3 Test 4c93e285 | req-level only — SCOPE UNVERIFIED |
| 3960168e | S21 | Emails as scenario units + alt-index | req R21.5 Test 1fd43df9 | req-level only — SCOPE UNVERIFIED |
| 842d4f01 | S21 | Companies as shared dedup units | req R21.8 Test 1d469c7b | req-level only — SCOPE UNVERIFIED |
| a25e2787 | S21 | Lobby renders real name on first connect | req R21.2 Test 8f464c84 | req-level only — SCOPE UNVERIFIED |
| af9dc6cc | S21 | Phones as scenario units (seed Tron) | req R21.6 Test 2d069fd0 | req-level only — SCOPE UNVERIFIED |
| e83dc244 | S21 | Device-link on known phone/email | req R21.4 Test f494cdd4 | req-level only — SCOPE UNVERIFIED |
| f86f7003 | S21 | File detail reorder + pan/zoom | req R21.9 Test 27d4d8ca | req-level only — SCOPE UNVERIFIED |
| 06544a45 | S25 | Comprehensive DnD logging (capture every dropped U | req R25.1 Test 1e763397 | req-level only — SCOPE UNVERIFIED |
| 92bdca8b | S25 | vCard onboarding recognizes existing users (device | req R25.3 Test d82ebcf5 | req-level only — SCOPE UNVERIFIED |
| b9deaf57 | S25 | Drawer interaction — grab-bar mouse parity + X-min | req R25.4 Test 222969ea | req-level only — SCOPE UNVERIFIED |

## B — partial-tested / spot-check
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 56cc23b5 | S20 | rename-champagne-to-traceability | partial CR1 Test ae08d5ec | spot-check/superseded |
| 767dd241 | S20 | item-views-default-collapsed | partial R20.3 Test 50601482 | spot-check/superseded |
| d01c38b3 | S25 | Room membership dedup by resolved identity (struct | partial R25.7 Test cca392d6 | spot-check/superseded |

## C — unevidenced -> superseded/backlog (planner Phase-1 closing)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 1cbad4ef | S19 | iframe-pinch-scale | unevidenced | superseded/backlog |
| 322d0fcd | S19 | room-file-item-rerender | unevidenced | superseded/backlog |
| 4c19b50f | S19 | drawer-drag-resize | unevidenced | superseded/backlog |
| 18ee26a2 | S20 | chain-excludes-self-and-nonchain | unevidenced | superseded/backlog |
| 1fac9d23 | S20 | selection-tap-switch-longpress-toggle | unevidenced | superseded/backlog |
| 450cb98a | S20 | s19-champagne-backfill-tracking | unevidenced | superseded/backlog |
| 7047d04f | S20 | selection-model | unevidenced | superseded/backlog |
| b1c93799 | S20 | bug-changerequest-oop-extensions | unevidenced | superseded/backlog |
| fe8c43a5 | S20 | detail-drawer-grab-bar | unevidenced | superseded/backlog |
| 6be9a92d | S31 | Shared pan/zoom viewer capability for EVERY embedd | unevidenced | superseded/backlog |

_By robbin-req 2026-08-07. Deduped disjoint (49 stale-Active-InProgress + 3 R-C5 QA-Review). I deep-verify any A2 row scope vs git/served on request -> promote confirmed to A1._
