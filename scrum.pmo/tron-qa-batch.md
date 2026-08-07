# Tron QA Batch — stale-Active + R-C5 Done-candidates
Phone-readable. NOTHING flipped to Done (robbin-req recommends; Tron decides). Bulk-approve a group or spot-check; A-not-approved -> superseded/backlog.
**A=39 (Done? — live+gated+scope-match) · B=3 (partial/ambiguous) · C=10 (weak/unevidenced -> superseded/backlog, planner closing)**

## A — Done candidates (evidence = 1-click Test uuid / commit)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 0c28c7f8 | S19 | user-scenarios | Test f5211188 (R19.54) | Done |
| 147e2f64 | S19 | member-iors | Test c874546a (R19.35) | Done |
| 164d8114 | S19 | visibility | Test 9a4f07c7 (R19.3) | Done |
| 1805f7db | S19 | apply-flow | Test 2420ff7d (R19.5) | Done |
| 1c7f8d8e | S19 | server-log-level | Test 1f38ad83 (R19.41) | Done |
| 2195d98f | S19 | room-ui-shared | Test ea6ce5d8 (R19.21) | Done |
| 25c38ac0 | S19 | dnd-unknown-dispatcher | Test 1e763397 (R19.37) | Done |
| 312cb103 | S19 | default-flip | Test cda50af2 (R19.10) | Done |
| 3ca88df7 | S19 | room-join-stale-takeover | Test 3c153212 (R19.82) | Done |
| 40a756f5 | S19 | file-version-new | Test 8d8b3fdd (R19.48) | Done |
| 67b2763e | S19 | persistent | Test da3d0186 (R19.7) | Done |
| 6c4949fa | S19 | room-unit | Test 47971f31 (R19.1) | Done |
| 6f574da6 | S19 | file-version-array | Test bde41193 (R19.50) | Done |
| 787e88ab | S19 | remove-spectator | Test d12f34d5 (R19.24) | Done |
| 7fca98ae | S19 | dnd-file-chain | Test 2806c12e (R19.36) | Done |
| 834fe55b | S19 | file-unit | Test fbfeac53 (R19.14) | Done |
| a91643c6 | S19 | sticky-drawer-close | Test 859878d6 (R19.33) | Done |
| ae090710 | S19 | room-ui | Test e4963145 (R19.11) | Done |
| b3b822e9 | S19 | room-json-symlink-and-ui | Test f936d0f4 (R19.22) | Done |
| c0d67460 | S19 | room-edit-pen-canonical | Test 6d58883c (R19.30) | Done |
| e90c223d | S19 | remove-room-sizes | Test ffab35a3 (R19.23) | Done |
| fb629eb7 | S19 | back-button-visible | Test 79da3d78 (R19.57) | Done |
| fda34dac | S19 | room-link-404-fix | Test 7f5a8bb4 (R19.31) | Done |
| 10545051 | S20 | url-drawer BUG13 (.url opens drawer) | tester DET-3x 32ba15a7b | Done |
| 15aeb43d | S20 | CurrentSprint planner-skill (R20.13) | CurrentSprint.ts+8Tests 82e309bbb ~16spr-prod | Done |
| 54519bc4 | S20 | TestCase+Gate 1st-class (R20.20/21) | gate+render 7b07d8465 1023TC+6Gate | Done |
| d43fce61 | S20 | s19-shared-impl-split-recovery | Test e4963145 (R19.11) | Done |
| 0c1b375e | S21 | 21.1 | Test 068dbc4b (R21.1) | Done |
| 18845496 | S21 | 21.7 | Test 0802991c (R21.7) | Done |
| 1bae9710 | S21 | 21.3 | Test 4c93e285 (R21.3) | Done |
| 3960168e | S21 | 21.5 | Test 1fd43df9 (R21.5) | Done |
| 842d4f01 | S21 | 21.8 | Test 1d469c7b (R21.8) | Done |
| a25e2787 | S21 | 21.2 | Test 8f464c84 (R21.2) | Done |
| af9dc6cc | S21 | 21.6 | Test 2d069fd0 (R21.6) | Done |
| e83dc244 | S21 | 21.4 | Test f494cdd4 (R21.4) | Done |
| f86f7003 | S21 | 21.9 | Test 27d4d8ca (R21.9) | Done |
| 06544a45 | S25 | ask 25.1 | Test 1e763397 (R25.1) | Done |
| 92bdca8b | S25 | ask 25.3 | Test d82ebcf5 (R25.3) | Done |
| b9deaf57 | S25 | ask 25.4 | Test 222969ea (R25.4) | Done |

## B — partial / spot-check
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 56cc23b5 | S20 | rename-champagne-to-traceability | partial-tested | spot-check / superseded |
| 767dd241 | S20 | item-views-default-collapsed | partial-tested | spot-check / superseded |
| d01c38b3 | S25 | ask 25.7 | partial-tested | spot-check / superseded |

## C — unevidenced -> superseded/backlog (planner Phase-1 closing, listed for completeness)
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
| 6be9a92d | S31 | ask 31.6 | unevidenced | superseded/backlog |

_By robbin-req 2026-08-07. Deduped vs planner (disjoint: 49 stale-Active-InProgress + 3 R-C5 QA-Review). Planner closes C + c524c8a0-supersede. I deep-verify any row vs git/served on request._
