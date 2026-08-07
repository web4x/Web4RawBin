# Tron QA Batch — stale-Active + R-C5 Done-candidates
Phone-readable. NOTHING flipped Done (robbin-req recommends; Tron decides). SIGNAL, NOT STAMP. A2 scope-verify grind: S19+S21+S25 DONE.
**A1=21 (3 task-level DIRECT = signable NOW + 18 scope-verified PENDING VACUITY AUDIT) - A2=18 (held/unverified/vacuous) - B=3 - D=4 - S=2 - C=4**

> ★ SCOPE-VERIFIED != VACUITY-CHECKED (PO correction 2026-08-07): "the cited Test exists and names the right thing" was NEVER sufficient - the Test must be ABLE TO FAIL. Tester vacuity-audit IN PROGRESS: a91643c6 already found VACUOUS (moved A1->A2). Do NOT sign the 20 scope-verified rows until each is vacuity-checked. The 3 task-level rows (10545051/15aeb43d/54519bc4) have DIRECT tester evidence and stay signable NOW.

> ★ ROOT CAUSE (bigger than these rows): marker-STACK files (server.test.ts 69 markers / file-dnd-chain.test.ts 10 / impl-coverage-batch.test.ts) credit a FILE, not an assertion - a [test] marker in a bulk COMMENT block confers NO real scope. Architect is designing the symmetric AST-attach rule ([impl] already requires a name-matching decl; [test] did not).

## A1 — Done candidates: task-level direct OR scope-VERIFIED (Test asserts THIS task scope)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 147e2f64 | S19 | room scenario unit model holds IOR references to its mem | Test Room.persistMembers asserts member-IOR persistence (req R19.35 Test c874546a) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 1805f7db | S19 | BY-INVITE Apply button + invite-request messages | Test JoinRequestFlow.applySend asserts invite-apply send (req R19.5 Test 2420ff7d) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 2195d98f | S19 | in-room tree REUSES /trace rb-tree + rb-tree-item with M | Test RbRoomContent.mountTraceTree asserts tree REUSES rb-tree (req R19.21 Test ea6ce5d8) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 3ca88df7 | S19 | joining from lobby must succeed (same-token takeover, ne | Test R19.82 addMemberTakeover asserts stale-conn join takeover (req R19.82 Test 3c153212) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 787e88ab | S19 | strip isSpectator/mode/role/UI/join-flow/server/MSG type | Test Room.stripSpectator asserts spectator code stripped (req R19.24 Test d12f34d5) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 834fe55b | S19 | Files become scenario units (uuid.content + scenario.jso | Test FileUnit.upload asserts file stored as unit (req R19.14 Test fbfeac53) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| c0d67460 | S19 | edit pen on room item opens canonical scenario unit | Test RbRoomDetail.editCanonical asserts pen opens canonical editor (req R19.30 Test 6d58883c) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| e90c223d | S19 | strip maxMembers/maxPlayers/size config from model+UI+se | Test Room.stripSizeLimits asserts size/capacity limits removed (req R19.23 Test ffab35a3) | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 10545051 | S20 | url-drawer .url click opens the drawer (BUG13) | tester DET-3x real-data 32ba15a7b | Done? |
| 15aeb43d | S20 | CurrentSprint planner-skill maintains the pin (R20.13) | CurrentSprint.ts +8 Tests 82e309bbb, ~16-spr prod | Done? |
| 54519bc4 | S20 | TestCase+Gate as 1st-class units (R20.20/21) | gate+render 7b07d8465, 1023 TC+6 Gate | Done? |

| 0c1b375e | S21 | vCard drop stores .vcf beside avatar | Test R21.1 dropVCard asserts .vcf stored beside avatar | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 18845496 | S21 | Addresses async OSM-verified | Test R21.7 mintAndVerifyAsync asserts async OSM address verify | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 1bae9710 | S21 | Phone alt-UUID index (ln symlink) | Test R21.3 registerSymlink asserts phone alt-UUID ln symlink | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 3960168e | S21 | Emails as scenario units + alt-index | Test R21.5 mintAndLink asserts email-as-unit + alt-index | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 842d4f01 | S21 | Companies as shared dedup units | Test R21.8 mintOrReuseShared asserts company shared-dedup | Done? (scope-verified, PENDING VACUITY AUDIT) |
| a25e2787 | S21 | Lobby renders real name on first connect | Test R21.2 renderNameOnConnect asserts lobby real-name on connect | Done? (scope-verified, PENDING VACUITY AUDIT) |
| af9dc6cc | S21 | Phones as scenario units (seed Tron) | Test R21.6 mintAndLink asserts phone-as-scenario-unit | Done? (scope-verified, PENDING VACUITY AUDIT) |
| e83dc244 | S21 | Device-link on known phone/email | Test R21.4 resolveOrEnroll asserts device-link on known phone/email | Done? (scope-verified, PENDING VACUITY AUDIT) |
| 92bdca8b | S25 | vCard onboarding recognizes existing users (device-l | Test R25.3 recognizeIdentity asserts vCard onboarding recognizes existing user | Done? (scope-verified, PENDING VACUITY AUDIT) |
| b9deaf57 | S25 | Drawer interaction — grab-bar mouse parity + X-minim | Test R25.4 minimize (planner-wired 222969ea) asserts X-minimize | Done? (scope-verified, PENDING VACUITY AUDIT) |

## A2 — req-level Test only, SCOPE UNVERIFIED / held (grind ongoing S21/S25 next)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 1c7f8d8e | S19 | configurable server log level gates logging verbosity | req R19.41 Test 1f38ad83 - file test/vitest/server.test.ts grep=0 log-level assertions + 69 test-uuid markers bulk-stacked as comments before imports; 1f38ad83 asserts nothing about log-level = does not verify THIS task scope | VACUOUS (tester vacuity-audit, moved A1->A2) |
| 40a756f5 | S19 | different content same name registers new version | req R19.48 Test 8d8b3fdd - file test/vitest/file-dnd-chain.test.ts grep=0 version/same-name assertions; 8d8b3fdd = 1 of 10 markers BULK-STACKED at file top, tied to no assertion (credits a FILE not behaviour) = does not verify THIS task scope | VACUOUS (tester vacuity-audit, moved A1->A2) |
| a91643c6 | S19 | sticky close button on detail drawer | req R19.33 Test 859878d6 - cited Test is CSS-substring-only (impl-coverage-batch.test.ts:39-47: 5 substring checks on app.css .drawer-header / position:sticky / .drawer-body / overflow-y:auto / .drawer-close), asserts NO behaviour, passes even if feature absent = does not verify THIS task scope | VACUOUS (tester vacuity-audit, moved A1->A2) |
| 0c28c7f8 | S19 | Users become first-class scenario units (ior:class:User) | req R19.54 Test f5211188 — Test is Logger.logAtLevel-split artifact, not User-unit scope | SCOPE UNVERIFIED |
| 164d8114 | S19 | Room visibility modes (public/by-invite/private) | req R19.3 Test 9a4f07c7 — Test targets R19.4, task covers R19.3 (visibility) — wrong-req | SCOPE UNVERIFIED |
| 25c38ac0 | S19 | unknown format dropped onto room chat + extensible mimeT | req R19.37 Test 1e763397 — Test is R19.14 file-chain, task is R19.37 unknown-dispatch | SCOPE UNVERIFIED |
| 312cb103 | S19 | PERSISTENT becomes default mode after sprint | req R19.10 Test cda50af2 — Test modeSet generic, not the PERSISTENT-default-flip | SCOPE UNVERIFIED |
| 67b2763e | S19 | Room mode PERSISTENT + offline members + add/remove | req R19.7 Test da3d0186 — Test Room.memberAdd not the PERSISTENT-offline behaviour | SCOPE UNVERIFIED |
| 6c4949fa | S19 | Room IS a scenario unit + click-to-edit room editor | req R19.1 Test 47971f31 — Test Room.init covers unit-create, not click-to-edit editor | SCOPE UNVERIFIED |
| 6f574da6 | S19 | file scenario unit has version[] array {version,ior} | req R19.50 Test bde41193 — Test is Logger.logAtLevel-split artifact, not version[] scope | SCOPE UNVERIFIED |
| 7fca98ae | S19 | drop file onto room drop-zone uploads and creates FileUn | req R19.36 Test 2806c12e — Test R19.36 shareLink facet, not the drop-upload chain | SCOPE UNVERIFIED |
| ae090710 | S19 | drop-zone + Members/Files tree + member item views | req R19.11 Test e4963145 — Test RbRoomContent.render generic, not drop-zone+tree+members | SCOPE UNVERIFIED |
| b3b822e9 | S19 | room.json symlink to canonical scenario unit + UI link | req R19.22 Test f936d0f4 — Test scenarioLinkRender covers UI-link, not the symlink half | SCOPE UNVERIFIED |
| fb629eb7 | S19 | full-width drawer must not cover top-nav back button (R1 | req R19.57 Test 79da3d78 — Test is Logger.logAtLevel-split artifact for raiseAboveDrawer | SCOPE UNVERIFIED |
| fda34dac | S19 | room link navigates to live room or editor, never 404 | req R19.31 Test 7f5a8bb4 — Test generic click-navigate, not the 404-fix specifically | SCOPE UNVERIFIED |
| d43fce61 | S20 | split 11 shared-impl regressions into own Impl+marker pe | req R19.11 Test e4963145 — scope unverified | SCOPE UNVERIFIED |
| f86f7003 | S21 | File detail reorder + pan/zoom | req R21.9 Test 27d4d8ca — Test renderActionsFirst covers reorder, NOT the pan/zoom half | SCOPE UNVERIFIED |
| 06544a45 | S25 | Comprehensive DnD logging (capture every dropped URL sch | req R25.1 Test 1e763397 — Test is R19.14.DnDFileChain — wrong req (task=R25.1 logging) | SCOPE UNVERIFIED |

## B — partial / delivered-pending (PO ruling: default QA-Review, NOT superseded w/o named evidence, NOT Done w/o Tron)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 56cc23b5 | S20 | 'Champagne Chain' → 'Traceability Chain' in all user-fac | req CR1 Test ae08d5ec |  QA-Review (delivered-pending; no superseder named -> not superseded; Tron spot-check for Done) |
| 767dd241 | S20 | every item view defaults COLLAPSED on render, always | req R20.3 Test 50601482 |  QA-Review (delivered-pending; no superseder named -> not superseded; Tron spot-check for Done) |
| d01c38b3 | S25 | Room membership dedup by resolved identity (structural,  | req R25.7 Test cca392d6 |  QA-Review (delivered-pending; no superseder named -> not superseded; Tron spot-check for Done) |

## C — unevidenced -> superseded/backlog (planner Phase-1 closing)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 322d0fcd | S19 | file items in room tree survive re-render (mirror member | unevidenced | superseded/backlog |
| 4c19b50f | S19 | the drawer nudge/grab-handle must DRAG-RESIZE the drawer | unevidenced | superseded/backlog |
| 450cb98a | S20 | track tonight's 22:07 radical backfill of S19 v0.5.x cha | unevidenced | superseded/backlog |
| fe8c43a5 | S20 | default detail drawer nudge becomes the wide grab-bar (D | unevidenced | superseded/backlog |

## D — DELIVERED-LIVE but chain-UNBUILT (planner found live code under own markers; NOT no-deliverable). Path to Done = chain-backfill (mint UC->Method, wire Impl+Test) + gate. NOT Done yet.
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 7047d04f | S20 | app-wide SelectionModel + selection API | LIVE selection-model.ts; Impl 6a626fa3<->Test 7cba34a6 PASS (reverse-link+UC->Method backfill needed) | chain-backfill -> A1 (closest) |
| b1c93799 | S20 | Bug + ChangeRequest OOP template extensions | LIVE templates.ts:369 + icons.ts:23-24 (R20.4, UCs=0) | chain-backfill; NO Test -> tester gate |
| 18ee26a2 | S20 | chain section excludes self + non-chain | LIVE singular-chain.ts:49,52 (BUG1, UCs=0) | chain-backfill; NO Test -> tester gate |
| 1fac9d23 | S20 | tap clears/switches + long-press toggle | LIVE rb-object-item.ts:80,86 (BUG2, UCs=0) | chain-backfill; NO Test -> tester gate |

## S — backlog: open mobile gap / concept (NOT superseded — PO ruling)
| task | spr | what | evidence | rec |
|---|---|---|---|---|
| 1cbad4ef | S19 | iframe 2-finger pinch-scale gesture | OPEN GAP: RbPanZoom=wheel+dbltap does NOT cover 2-finger pinch (mobile-native zoom @390) | backlog — real mobile capability gap (PO surfacing to Tron) |
| 6be9a92d | S31 | shared pan/zoom viewer every embed | conceptOnly/future; universal-every-format unproven | backlog (concept, not delivered) |

_By robbin-req 2026-08-07. S19 A2 grind: 11 PROMOTED (real scope-match, cited) / 12 HELD (wrong-req Test, generic, or Logger-split artifact) / 0 demoted. S21/S25 next. Deep-verify/flag on request._